# Step-by-Step Build Plan

A milestone-by-milestone plan for building the Dice Roll Statistics Tracker yourself.
Each milestone ends with something that works and a git commit. Do them in order —
each one builds on the last. Aim to commit at every checkbox-worthy step, not just at
milestone boundaries.

Target effort: **20–40 hours**. Milestones 1–5 give you a complete, working app;
6–8 are polish and stretch goals to fill the time.

---

## Milestone 0 — Project setup (~30 min)

Goal: an empty but version-controlled project you can run.

- [x] Create the project folder and `cd` into it.
- [x] `git init` and create a `.gitignore`.
- [x] Make sure `.gitignore` covers `node_modules/`, `dist/`, `public/app.js`, and `*.db`.
- [x] `npm init -y`, then set `"type": "module"` in `package.json`.
- [x] `npm install express better-sqlite3`.
- [x] `npm install -D typescript tsx @types/node @types/express @types/better-sqlite3`.
- [x] `npx tsc --init`, then set `"strict": true`, `"module": "NodeNext"`,
  `"moduleResolution": "NodeNext"`, `"outDir": "dist"`, `"rootDir": "src"`, and exclude
  `src/client`.
- [x] Create a second `tsconfig.client.json` for the browser code: `"module": "ES2022"`,
  `"lib": ["DOM", "ES2022"]`, `"rootDir": "src/client"`, `"outDir": "public"`.
- [x] Add npm scripts: `dev` (`tsx watch src/server.ts`), `build:client`
  (`tsc -p tsconfig.client.json`), `test` (`tsx --test "src/**/*.test.ts"`), and `typecheck`
  (`tsc --noEmit && tsc -p tsconfig.client.json --noEmit`).
- [x] Create empty files: `src/server.ts`, `src/stats.ts`, `src/storage.ts`,
  `src/client/app.ts`, `public/index.html`.
- [x] **Commit:** `chore: project scaffold`.

**Definition of done:** `npm run typecheck` passes; `git log` shows the scaffold commit.

---

## Milestone 1 — The distribution engine (~3–5 hrs) ⭐ the heart of the project

Goal: given `N` dice with `S` sides, compute how likely each possible sum is. Pure
math, no Express, no web. This is the most interesting code — take your time here.

Work in `src/stats.ts`. Export these functions:

- [ ] `possibleSums(numDice: number, sides: number): number[]`
  Returns every reachable sum, from `numDice` (all ones) to `numDice * sides`.

- [ ] `waysToMakeSums(numDice: number, sides: number): Map<number, number>`
  The core algorithm. For each possible sum, how many distinct dice combinations
  produce it. **Build it one die at a time** (this is a convolution):
  - Start with 1 die: `1 → 1, 2 → 1, ..., sides → 1`.
  - To add another die, for every current sum count, spread it across `+1..+sides`.
  - Repeat until you've added all `numDice` dice.
  - Sanity check: the counts must sum to `sides ** numDice`.

- [ ] `expectedProbabilities(numDice: number, sides: number): Map<number, number>`
  Each sum's ways divided by the total number of outcomes (`sides ** numDice`).

- [ ] Verify by hand: for `numDice=2, sides=6`, you must get the classic
  `2→1, 3→2, ..., 7→6, ..., 12→1` out of 36.

- [ ] Write `src/stats.test.ts` using `node:test` and `node:assert` that checks the 2d6
  table, and run it with `npm test`.

- [ ] **Commit:** `feat: dice distribution engine`.

**Definition of done:** `npm test` passes with a correct 2d6 table, and the ways sum
to 36.

---

## Milestone 2 — Deviation & chi-squared stats (~3–4 hrs) ⭐ still core math

Goal: compare a list of actual rolls against the expected distribution.

Still in `src/stats.ts`:

- [ ] `observedCounts(rolls: number[], numDice: number, sides: number): Map<number, number>`
  Tally how many times each possible sum appeared. Initialise every possible sum to 0
  so missing sums show as 0, not absent.

- [ ] `expectedCounts(n: number, numDice: number, sides: number): Map<number, number>`
  `n * probability` for each sum, where `n = rolls.length`.

- [ ] `deviations(rolls: number[], numDice: number, sides: number): SumDeviation[]`
  For each sum, return observed, expected, absolute difference, and percentage
  deviation. Define `SumDeviation` as an exported `interface`.

- [ ] `chiSquared(rolls: number[], numDice: number, sides: number): number`
  Compute the sum of `(observed - expected) ** 2 / expected` over all sums with expected > 0.

- [ ] `degreesOfFreedom(numDice: number, sides: number): number`
  `numberOfPossibleSums - 1`.

- [ ] `verdict(rolls: number[], numDice: number, sides: number): string`
  Compare the chi-squared statistic to the critical value for its degrees of freedom
  (95% confidence). Hardcode a small lookup table of critical values (you only need a
  handful of common configs), and return a plain-English message like
  *"looks fair"* or *"suspicious — deviates more than 95% of fair-dice runs would."*
  Also guard against too-few-rolls (say < 30) and return *"not enough data yet."*

- [ ] Add a few tests to `src/stats.test.ts`:
  - All-average rolls → low chi-squared.
  - Wildly skewed rolls (all 7s) → high chi-squared.

- [ ] **Commit:** `feat: deviation and chi-squared statistics`.

**Definition of done:** you can call `chiSquared([...], 2, 6)` and `verdict([...], 2, 6)`
and get sensible numbers.

---

## Milestone 3 — Persistence (~2–3 hrs)

Goal: rolls survive a restart, and you can undo mistakes.

Work in `src/storage.ts`. Use SQLite via `better-sqlite3` (its API is synchronous,
which keeps things simple).

- [ ] Design a tiny schema: a `sessions` table (id, name, num_dice, sides, created_at)
  and a `rolls` table (id, session_id, value, created_at).
- [ ] Define a `Session` interface for a row of the `sessions` table.
- [ ] `initDb(path: string)` — open the database and create the tables if they don't
  exist. Use `":memory:"` in tests.
- [ ] `createSession(name: string, numDice: number, sides: number): number` — returns the id.
- [ ] `addRoll(sessionId: number, value: number): void`.
- [ ] `getRolls(sessionId: number): number[]`.
- [ ] `undoLast(sessionId: number): void` — delete the most recent roll.
- [ ] `listSessions(): Session[]` and `getSession(sessionId: number): Session | undefined`.
- [ ] Keep this module free of any Express imports — it's just data in/out.
- [ ] Add `src/storage.test.ts` against an in-memory database.
- [ ] **Commit:** `feat: sqlite persistence for sessions and rolls`.

**Definition of done:** tests can create a session, add rolls, read them back, and
undo one.

---

## Milestone 4 — Express API (~3–4 hrs)

Goal: expose the logic over HTTP. This is all the Express you need to learn — a handful of routes.

Work in `src/server.ts`:

- [ ] Boot a minimal Express app with `express.json()`, and call `initDb()` on startup.
- [ ] Serve the `public/` folder with `express.static` (gives you `GET /`).
- [ ] `POST /sessions` → body has `name`, `numDice`, `sides`; create a session, return its id.
- [ ] `POST /rolls` → body has `sessionId` and `value`; log a roll.
- [ ] `DELETE /rolls/last` → body has `sessionId`; undo the last roll.
- [ ] `GET /stats?sessionId=...` → load rolls, run the `stats.ts` functions, and return
  JSON: observed, expected, deviations, chi-squared, degrees of freedom, and the verdict.
- [ ] Validate request bodies (request JSON is `unknown` until you check it) and return
  `400` for bad input.
- [ ] Test each route with `curl` before touching the frontend, e.g.:
  ```bash
  curl -X POST localhost:3000/sessions -H 'Content-Type: application/json' \
    -d '{"name":"game 1","numDice":2,"sides":6}'
  ```
- [ ] **Commit:** `feat: express api for rolls and stats`.

**Definition of done:** you can drive the whole app with curl — create a session, log
rolls, and fetch computed stats as JSON.

---

## Milestone 5 — The web UI (~4–6 hrs)

Goal: a page you can actually use during a game.

Work in `public/index.html` and `src/client/app.ts` (compiled to `public/app.js` with
`npm run build:client`; load it with `<script type="module" src="app.js">`):

- [ ] A small config form: number of dice, sides per die, session name → "Start session".
- [ ] After a session starts, render **roll buttons** for every possible sum
  (`numDice` … `numDice × sides`) — generate them dynamically from the config.
- [ ] Clicking a button `POST`s the roll, then re-fetches `/stats` and redraws.
- [ ] An "Undo" button hitting `DELETE /rolls/last`.
- [ ] Type the `/stats` response with an interface instead of using `any`.
- [ ] A results table: sum | observed | expected | deviation.
- [ ] Show the chi-squared value, degrees of freedom, and the verdict prominently.
- [ ] **Commit:** `feat: web ui with roll buttons and live stats`.

**Definition of done:** you can play a game, tap sums, and watch the stats update live
in the browser.

---

## Milestone 6 — Chart (~2–3 hrs)

Goal: see the shape of the distribution, not just numbers.

- [ ] Add Chart.js via a `<script>` tag (CDN) in `index.html`, and declare the global
  `Chart` for TypeScript (or `npm install chart.js` for its types).
- [ ] Draw a bar chart overlaying **expected vs. observed** counts per sum.
- [ ] Redraw it whenever stats refresh.
- [ ] **Commit:** `feat: distribution bar chart`.

**Definition of done:** the chart visibly shows where reality diverges from expectation.

---

## Milestone 7 — Sessions UI & polish (~3–5 hrs, stretch)

- [ ] List existing sessions and let the user switch between them.
- [ ] Show all-time stats vs. current-session stats.
- [ ] Handle edge cases: 0 rolls, 1 die (uniform distribution), large dice like d20.
- [ ] Basic styling so it's pleasant to use.
- [ ] **Commit:** `feat: session switching and polish`.

---

## Milestone 8 — Docs & wrap-up (~1–2 hrs)

- [ ] Make sure the README's clone-and-run steps actually work from a fresh clone.
- [ ] Add a short "How to use it" walkthrough (already stubbed in the README).
- [ ] Clean up dead code and stray `console.log` calls.
- [ ] Final read-through of your git history — it should tell the story of the build.
- [ ] **Commit:** `docs: finalise readme and cleanup`.

---

## Tips for staying on track

- **Commit often** — every green checkbox is a reasonable commit point.
- **Keep the math out of Express.** `stats.ts` and `storage.ts` should never import
  Express; `server.ts` is the only web-aware file. This makes the interesting code easy to test.
- **Test the core before the UI.** If `stats.ts` is right, the rest is plumbing.
- **Start narrow, then generalise.** It's fine to hardcode 2d6 in Milestone 1 to get it
  working, then generalise to arbitrary `N`/`S` once the shape is clear — just don't
  ship it hardcoded.
- **If you get stuck on chi-squared**, remember the goal is only to flag "unusually far
  from expected." Even a rough critical-value table gives a useful verdict.
