const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'guestbook.db');

const NAME_MAX_LENGTH = 80;
const MESSAGE_MAX_LENGTH = 500;

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`);

const insertEntry = db.prepare(
  'INSERT INTO entries (name, message) VALUES (?, ?)'
);
const listEntries = db.prepare(
  'SELECT id, name, message, created_at FROM entries ORDER BY id DESC'
);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateEntry(body) {
  if (!body || typeof body !== 'object') {
    return 'Invalid request body.';
  }
  const { name, message } = body;

  if (typeof name !== 'string' || typeof message !== 'string') {
    return 'Name and message are required strings.';
  }

  const trimmedName = name.trim();
  const trimmedMessage = message.trim();

  if (trimmedName.length === 0 || trimmedMessage.length === 0) {
    return 'Name and message are required.';
  }
  if (trimmedName.length > NAME_MAX_LENGTH) {
    return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }
  if (trimmedMessage.length > MESSAGE_MAX_LENGTH) {
    return `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}

app.get('/api/entries', (req, res) => {
  const entries = listEntries.all();
  res.json(entries);
});

app.post('/api/entries', (req, res) => {
  const error = validateEntry(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const name = req.body.name.trim();
  const message = req.body.message.trim();

  const info = insertEntry.run(name, message);
  const entry = db
    .prepare('SELECT id, name, message, created_at FROM entries WHERE id = ?')
    .get(info.lastInsertRowid);

  res.status(201).json(entry);
});

const server = app.listen(PORT, () => {
  const { port } = server.address();
  console.log(`Guestbook app listening on http://localhost:${port}`);
});

module.exports = server;
