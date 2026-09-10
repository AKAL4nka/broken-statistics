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

- [ ] Create the project folder and `cd` into it.
- [ ] `git init` and create a `.gitignore` (ignore `.venv/`, `__pycache__/`, `*.db`).
- [ ] Create a virtual environment: `python3 -m venv .venv` and activate it.
- [ ] `pip install flask` and then `pip freeze > requirements.txt`.
- [ ] Create empty files: `app.py`, `stats.py`, `storage.py`, `static/index.html`, `static/app.js`.
- [ ] **Commit:** `chore: project scaffold`.

**Definition of done:** `python -c "import flask"` works; `git log` shows one commit.

---

## Milestone 1 — The distribution engine (~3–5 hrs) ⭐ the heart of the project

Goal: given `N` dice with `S` sides, compute how likely each possible sum is. Pure
math, no Flask, no web. This is the most interesting code — take your time here.

Work in `stats.py`. Functions to implement:

- [ ] `possible_sums(num_dice, sides) -> list[int]`
  Returns every reachable sum, from `num_dice` (all ones) to `num_dice * sides`.

- [ ] `ways_to_make_sums(num_dice, sides) -> dict[int, int]`
  The core algorithm. For each possible sum, how many distinct dice combinations
  produce it. **Build it one die at a time** (this is a convolution):
  - Start with 1 die: `{1: 1, 2: 1, ..., sides: 1}`.
  - To add another die, for every current sum count, spread it across `+1..+sides`.
  - Repeat until you've added all `num_dice` dice.
  - Sanity check: the counts must sum to `sides ** num_dice`.

- [ ] `expected_probabilities(num_dice, sides) -> dict[int, float]`
  Each sum's ways divided by the total number of outcomes (`sides ** num_dice`).

- [ ] Verify by hand: for `num_dice=2, sides=6`, you must get the classic
  `{2:1, 3:2, ..., 7:6, ..., 12:1}` out of 36.

- [ ] Add a `if __name__ == "__main__":` block that prints the table for 2d6 so you
  can eyeball it.

- [ ] **Commit:** `feat: dice distribution engine`.

**Definition of done:** running `python stats.py` prints a correct 2d6 table, and the
ways sum to 36.

---

## Milestone 2 — Deviation & chi-squared stats (~3–4 hrs) ⭐ still core math

Goal: compare a list of actual rolls against the expected distribution.

Still in `stats.py`:

- [ ] `observed_counts(rolls, num_dice, sides) -> dict[int, int]`
  Tally how many times each possible sum appeared. Initialise every possible sum to 0
  so missing sums show as 0, not absent.

- [ ] `expected_counts(n, num_dice, sides) -> dict[int, float]`
  `n * probability` for each sum, where `n = len(rolls)`.

- [ ] `deviations(rolls, num_dice, sides) -> dict[int, dict]`
  For each sum, return observed, expected, absolute difference, and percentage
  deviation.

- [ ] `chi_squared(rolls, num_dice, sides) -> float`
  Compute `sum((observed - expected)**2 / expected)` over all sums with expected > 0.

- [ ] `degrees_of_freedom(num_dice, sides) -> int`
  `number_of_possible_sums - 1`.

- [ ] `verdict(rolls, num_dice, sides) -> str`
  Compare the chi-squared statistic to the critical value for its degrees of freedom
  (95% confidence). Hardcode a small lookup table of critical values (you only need a
  handful of common configs), and return a plain-English message like
  *"looks fair"* or *"suspicious — deviates more than 95% of fair-dice runs would."*
  Also guard against too-few-rolls (say < 30) and return *"not enough data yet."*

- [ ] Write a few quick tests (a `tests/` file or asserts in the `__main__` block):
  - All-average rolls → low chi-squared.
  - Wildly skewed rolls (all 7s) → high chi-squared.

- [ ] **Commit:** `feat: deviation and chi-squared statistics`.

**Definition of done:** you can call `chi_squared([...], 2, 6)` and `verdict([...], 2, 6)`
and get sensible numbers.

---

## Milestone 3 — Persistence (~2–3 hrs)

Goal: rolls survive a restart, and you can undo mistakes.

Work in `storage.py`. Use SQLite from the standard library (`import sqlite3`).

- [ ] Design a tiny schema: a `sessions` table (id, name, num_dice, sides, created_at)
  and a `rolls` table (id, session_id, value, created_at).
- [ ] `init_db()` — create the tables if they don't exist.
- [ ] `create_session(name, num_dice, sides) -> session_id`.
- [ ] `add_roll(session_id, value)`.
- [ ] `get_rolls(session_id) -> list[int]`.
- [ ] `undo_last(session_id)` — delete the most recent roll.
- [ ] `list_sessions()` and `get_session(session_id)`.
- [ ] Keep this module free of any Flask imports — it's just data in/out.
- [ ] **Commit:** `feat: sqlite persistence for sessions and rolls`.

**Definition of done:** from a Python shell you can create a session, add rolls, read
them back, and undo one.

---

## Milestone 4 — Flask API (~3–4 hrs)

Goal: expose the logic over HTTP. This is all the Flask you need to learn — four routes.

Work in `app.py`:

- [ ] Boot a minimal Flask app and call `init_db()` on startup.
- [ ] `GET /` → serve `static/index.html`.
- [ ] `POST /sessions` → body has `name`, `num_dice`, `sides`; create a session, return its id.
- [ ] `POST /rolls` → body has `session_id` and `value`; log a roll.
- [ ] `DELETE /rolls/last` → body has `session_id`; undo the last roll.
- [ ] `GET /stats?session_id=...` → load rolls, run the `stats.py` functions, and return
  JSON: observed, expected, deviations, chi-squared, degrees of freedom, and the verdict.
- [ ] Test each route with `curl` before touching the frontend, e.g.:
  ```bash
  curl -X POST localhost:5000/sessions -H 'Content-Type: application/json' \
    -d '{"name":"game 1","num_dice":2,"sides":6}'
  ```
- [ ] **Commit:** `feat: flask api for rolls and stats`.

**Definition of done:** you can drive the whole app with curl — create a session, log
rolls, and fetch computed stats as JSON.

---

## Milestone 5 — The web UI (~4–6 hrs)

Goal: a page you can actually use during a game.

Work in `static/index.html` and `static/app.js`:

- [ ] A small config form: number of dice, sides per die, session name → "Start session".
- [ ] After a session starts, render **roll buttons** for every possible sum
  (`num_dice` … `num_dice × sides`) — generate them dynamically from the config.
- [ ] Clicking a button `POST`s the roll, then re-fetches `/stats` and redraws.
- [ ] An "Undo" button hitting `DELETE /rolls/last`.
- [ ] A results table: sum | observed | expected | deviation.
- [ ] Show the chi-squared value, degrees of freedom, and the verdict prominently.
- [ ] **Commit:** `feat: web ui with roll buttons and live stats`.

**Definition of done:** you can play a game, tap sums, and watch the stats update live
in the browser.

---

## Milestone 6 — Chart (~2–3 hrs)

Goal: see the shape of the distribution, not just numbers.

- [ ] Add Chart.js via a `<script>` tag (CDN) in `index.html`.
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

- [ ] Make sure the README's clone-and-run steps actually work from scratch in a fresh
  virtualenv.
- [ ] Add a short "How to use it" walkthrough (already stubbed in the README).
- [ ] Clean up dead code and stray print statements.
- [ ] Final read-through of your git history — it should tell the story of the build.
- [ ] **Commit:** `docs: finalise readme and cleanup`.

---

## Tips for staying on track

- **Commit often** — every green checkbox is a reasonable commit point.
- **Keep the math out of Flask.** `stats.py` and `storage.py` should never import Flask;
  `app.py` is the only web-aware file. This makes the interesting code easy to test.
- **Test the core before the UI.** If `stats.py` is right, the rest is plumbing.
- **Start narrow, then generalise.** It's fine to hardcode 2d6 in Milestone 1 to get it
  working, then generalise to arbitrary `N`/`S` once the shape is clear — just don't
  ship it hardcoded.
- **If you get stuck on chi-squared**, remember the goal is only to flag "unusually far
  from expected." Even a rough critical-value table gives a useful verdict.
