const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");
const notesList = document.querySelector("#notes-list");
const noteCount = document.querySelector("#note-count");
const message = document.querySelector("#form-message");
const cancelButton = document.querySelector("#cancel-button");
console.log('app started')
let editingNoteId = null;

async function fetchNotes() {
  const response = await fetch("/api/notes");
  const notes = await response.json();
  renderNotes(notes);
}

function renderNotes(notes) {
  noteCount.textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
  notesList.innerHTML = "";

  if (!notes.length) {
    notesList.innerHTML = '<div class="empty">No notes yet. Add your first one above.</div>';
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <h3></h3>
      <p></p>
      <div class="card-footer">
        <time></time>
        <span>
          <button class="secondary edit">Edit</button>
          <button class="delete">Delete</button>
        </span>
      </div>`;

    card.querySelector("h3").textContent = note.title;
    card.querySelector("p").textContent = note.content;
    card.querySelector("time").textContent = `Updated ${new Date(note.updatedAt).toLocaleString()}`;
    card.querySelector(".edit").addEventListener("click", () => startEditing(note));
    card.querySelector(".delete").addEventListener("click", () => deleteNote(note.id));
    notesList.appendChild(card);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  const note = { title: titleInput.value, content: contentInput.value };
  const url = editingNoteId ? `/api/notes/${editingNoteId}` : "/api/notes";

  const response = await fetch(url, {
    method: editingNoteId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note)
  });
  const result = await response.json();

  if (!response.ok) return (message.textContent = result.message);
  resetForm();
  fetchNotes();
});

function startEditing(note) {
  editingNoteId = note.id;
  titleInput.value = note.title;
  contentInput.value = note.content;
  document.querySelector("#editor-heading").textContent = "Edit note";
  form.querySelector('button[type="submit"]').textContent = "Update note";
  cancelButton.classList.remove("hidden");
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteNote(id) {
  if (!confirm("Delete this note?")) return;
  await fetch(`/api/notes/${id}`, { method: "DELETE" });
  if (editingNoteId === id) resetForm();
  fetchNotes();
}

function resetForm() {
  form.reset();
  editingNoteId = null;
  document.querySelector("#editor-heading").textContent = "Add a note";
  form.querySelector('button[type="submit"]').textContent = "Save note";
  cancelButton.classList.add("hidden");
  message.textContent = "";
}

cancelButton.addEventListener("click", resetForm);
fetchNotes();
