# My Notes — Express CRUD practice

A small full-stack Express app. Notes are saved to `data/notes.json`, so they remain after restarting the server.

## Run it

1. Open a terminal in this folder.
2. Run `npm start`.
3. Visit `http://localhost:3000` in your browser.

Stop the server with `Ctrl + C`.

## The four APIs

- `GET /api/notes` — read every note.
- `POST /api/notes` — create a note; JSON body: `{ "title": "...", "content": "..." }`.
- `PUT /api/notes/:id` — update a note; uses the same JSON body.
- `DELETE /api/notes/:id` — delete a note.

The backend lives in `server.js`. `express.json()` reads JSON request bodies, and `express.static()` serves the UI. The browser code lives in `public/app.js`.
