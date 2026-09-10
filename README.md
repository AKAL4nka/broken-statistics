# Dice Roll Statistics Tracker

A small local web app for logging dice rolls during a game and seeing, in real time,
how far your actual rolls deviate from what probability says *should* happen.

It grew out of a very Catan-specific question — *"are these dice broken, or does it
just feel that way?"* — but it works for **any** dice setup: pick how many dice you're
rolling and how many sides they have (2d6, 3d6, 1d20, 4d4, …), and the app computes the
correct expected distribution for that configuration and compares your logged rolls
against it.

## What it does

- Log each roll of the sum of your dice with a single tap/click.
- Configure the dice: **N** dice each with **S** sides (e.g. `2d6` for Catan, `1d20` for D&D).
- Show a live table of **observed vs. expected** counts for every possible sum.
- Compute a **chi-squared goodness-of-fit test** to answer the real question:
  *is this distribution suspiciously different from fair dice, or within normal variance?*
- Visualise the distribution as a bar chart (expected vs. observed).
- Persist rolls between runs, and support separate **sessions** (one per game).

## Why the sum of dice isn't uniform

For a single fair `d6`, every face 1–6 is equally likely. But the **sum** of two or more
dice is not uniform — there are more ways to make a middle value than an extreme one.
For 2d6 there are 36 equally likely outcomes, and the sum 7 happens in 6 of them while
2 and 12 each happen in only 1:

| Sum | Ways | Probability |
|-----|------|-------------|
| 2   | 1    | 1/36 |
| 3   | 2    | 2/36 |
| 4   | 3    | 3/36 |
| 5   | 4    | 4/36 |
| 6   | 5    | 5/36 |
| 7   | 6    | 6/36 |
| 8   | 5    | 5/36 |
| 9   | 4    | 4/36 |
| 10  | 3    | 3/36 |
| 11  | 2    | 2/36 |
| 12  | 1    | 1/36 |

The app generalises this: for any `N` dice with `S` sides it computes the number of ways
to make each possible sum (from `N` to `N×S`), turns that into expected probabilities,
and measures how far your real rolls stray from it.

## The interesting part (the code I wrote myself)

The web framework and chart library are off-the-shelf, but the core logic is hand-written:

- **Distribution engine** — computing, for an arbitrary `N` dice of `S` sides, how many
  ways there are to make each sum. This is a small combinatorics/convolution problem
  (build the distribution one die at a time), not something a library hands you.
- **Deviation stats** — observed counts, expected counts, and per-sum deviation.
- **Chi-squared goodness-of-fit test** — including choosing the right number of degrees
  of freedom for whatever dice configuration is active, and turning the statistic into a
  plain-English verdict.

## Tech stack

- **Python 3** + **Flask** for the local web server and JSON API.
- **SQLite** (standard library) for persistence.
- **Vanilla HTML/JS** for the UI, with **Chart.js** for the bar chart.

## Requirements

- Python 3.10 or newer.

## Clone and run

```bash
# 1. Clone
git clone <your-repo-url> dice-stats
cd dice-stats

# 2. (Recommended) create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # on Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run
python app.py

# 5. Open the app
# Visit http://localhost:5000 in your browser
```

## How to use it

1. Set your dice configuration (number of dice and sides per die), e.g. `2` dice × `6` sides.
2. Start a new session for your game.
3. Each time the dice are rolled in real life, click the matching sum.
4. Watch the observed-vs-expected table and chart update, and check the chi-squared
   verdict to see whether the dice are behaving fairly.

## Project structure

```
dice-stats/
├── app.py            # Flask routes — the web/API layer
├── stats.py          # Distribution engine + deviation + chi-squared (the core math)
├── storage.py        # Persistence: save/load rolls and sessions (SQLite)
├── static/
│   ├── index.html    # UI: dice config, roll buttons, results
│   └── app.js        # fetch calls + rendering
├── requirements.txt
└── README.md
```

## Possible future additions

- Per-player roll tracking ("player X rolls 7 far more than expected").
- Streak/drought tracking (longest gap since a given sum appeared).
- Export a session's stats to CSV.
