# Cafe Connect

Like Beli for cafes — add coffee shops to your been-to list, compare favorites, and see community rankings.

## Features

- **Been-to list** — Pick a green, yellow, or red cup (liked / fine / didn't like), then place the shop on your list with quick comparisons.
- **Auto rating (1–10)** — Green = 7–10, yellow = 4–6, red = 1–3; your position on the list fine-tunes the score within that range.
- **Community rankings** — Global leaderboard from all users' cups and comparisons.
- **Search** — Find shops by name, city, or address. Add new shops if missing.

## Run locally

```bash
cd cafe-connect
npm install
npm run db:seed   # optional sample shops
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 15 (App Router)
- SQLite + Drizzle ORM
- Tailwind CSS v4 (brown/cream theme, responsive)
