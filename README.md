# Guestbook

A small dynamic guestbook web app. Visitors submit a name and a message; all
submissions are stored persistently and listed newest-first on the homepage.

## Stack

- **Backend:** Node.js + Express
- **Storage:** SQLite via `better-sqlite3` (file-based, persists across restarts)
- **Frontend:** A single static HTML page (`public/index.html`) with vanilla JS —
  fetches entries as JSON and renders them, submits new entries via `fetch`.

## Setup

Requires Node.js 18+.

```bash
npm install
```

## Run locally

```bash
npm start
```

Then open http://localhost:3000 in your browser. Submit the form and see your
entry appear at the top of the list below it.

The SQLite database file is created automatically at `data/guestbook.db` on
first run. Restarting the server will not lose data — entries persist in that
file.

Environment variables (all optional):

- `PORT` — port to listen on (default `3000`)
- `DB_PATH` — path to the SQLite database file (default `data/guestbook.db`)

## Run tests

A smoke test spins up the server against a throwaway database, exercises
validation, insertion, and listing over HTTP, and checks the results:

```bash
npm test
```

## API

- `GET /api/entries` — returns all entries as JSON, newest first.
- `POST /api/entries` — creates an entry. Body: `{ "name": "...", "message": "..." }`.
  - `name` and `message` are required, must be non-empty after trimming.
  - `name` max length: 80 characters. `message` max length: 500 characters.
  - Returns `400` with `{ "error": "..." }` on validation failure.

## Security notes

- Input is validated and trimmed server-side (required, max length) before
  being stored.
- The frontend renders entries using `textContent` (not `innerHTML`), so any
  HTML/script characters in a submitted name or message are displayed as
  plain text rather than executed — this prevents stored XSS.

## Deployment

This app is a plain Node.js process with a file-based SQLite database, which
makes it deployable as-is on Railway, Render, or Fly.io using the
`npm start` script (`package.json`), or via the included `Dockerfile`:

```bash
docker build -t guestbook .
docker run -p 3000:3000 -v guestbook-data:/app/data guestbook
```

For Render/Railway: point the service at this repo, set the build command to
`npm install` and the start command to `npm start`. Mount a persistent disk
at the `data/` directory (or set `DB_PATH` to a path on a persistent volume)
so entries survive deploys/restarts.
