const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");
const notesList = document.querySelector("#notes-list");
const noteCount = document.querySelector("#note-count");
const message = document.querySelector("#form-message");
const cancelButton = document.querySelector("#cancel-button");
const authContainer = document.querySelector("#auth-container");
const notesContainer = document.querySelector("#notes-container");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const authMessage = document.querySelector("#auth-message");
const loginPanel = document.querySelector("#login-panel");
const registerPanel = document.querySelector("#register-panel");
const logoutButton = document.querySelector("#logout-button");
const userNameDisplay = document.querySelector("#user-name");

console.log('app started')
let editingNoteId = null;

function handleExpiredToken() {
  localStorage.removeItem("token");
  notesContainer.style.display = "none";
  authContainer.style.display = "block";
  registerPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  authMessage.textContent = "Your session expired. Please log in again.";
  notesList.innerHTML = "";
  noteCount.textContent = "";
  resetForm();
}

async function authorizedFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${localStorage.getItem("token") || ""}`);

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    handleExpiredToken();
    return null;
  }
  return response;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

if (localStorage.getItem("token")) {
  authContainer.style.display = "none";
  notesContainer.style.display = "block";
  fetchNotes();
} else {
  notesContainer.style.display = "none";
  authContainer.style.display = "block";
}

document.querySelector("#show-register").addEventListener("click", (event) => {
  event.preventDefault();
  authMessage.textContent = "";
  loginPanel.classList.add("hidden");
  registerPanel.classList.remove("hidden");
});

document.querySelector("#show-login").addEventListener("click", (event) => {
  event.preventDefault();
  authMessage.textContent = "";
  registerPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");
});

async function handleLogin(event) {
  event.preventDefault();
  authMessage.textContent = "";
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
    });
    const result = await response.json();
    if (!response.ok) return (authMessage.textContent = result.message);
    localStorage.setItem("token", result.accessToken);
    userNameDisplay.textContent = `Welcome, ${result.user.name}`;
    authContainer.style.display = "none";
    notesContainer.style.display = "block";
    fetchNotes();
  } catch (err) {
    authMessage.textContent = "Could not reach the server. Please try again.";
  }
}

loginForm.addEventListener("submit", handleLogin);

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "";
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(registerForm)))
    });
    const result = await response.json();
    authMessage.textContent = result.message;
    authMessage.classList.toggle("error", !response.ok);
    if (response.ok) {
      registerForm.reset();
      registerPanel.classList.add("hidden");
      loginPanel.classList.remove("hidden");
      document.querySelector("#login-email").value = result.user.email;
    }
  } catch (err) {
    authMessage.textContent = "Could not reach the server. Please try again.";
    authMessage.classList.add("error");
  }
});

async function fetchNotes() {
  try {
    const response = await authorizedFetch("/api/notes");
    if (!response) return;
    const notes = await readJson(response);
    if (!response.ok) {
      message.textContent = notes.message || "Could not load notes.";
      return;
    }
    renderNotes(notes);
  }
  catch (err) {
    console.error("Error fetching notes:", err);
    message.textContent = "Could not reach the server. Please try again.";
  }

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
    card.querySelector(".delete").addEventListener("click", () => deleteNote(note._id));
    notesList.appendChild(card);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  const note = { title: titleInput.value, content: contentInput.value };
  const url = editingNoteId ? `/api/notes/${editingNoteId}` : "/api/notes";

  try {
    const response = await authorizedFetch(url, {
      method: editingNoteId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    if (!response) return;
    const result = await readJson(response);
    if (!response.ok) {
      message.textContent = result.message || "Could not save the note.";
      return;
    }
    resetForm();
    fetchNotes();
  } catch (err) {
    message.textContent = "Could not reach the server. Please try again.";
  }
});

function startEditing(note) {
  editingNoteId = note._id;
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

  try {
    const response = await authorizedFetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!response) return;
    if (!response.ok) {
      const result = await readJson(response);
      message.textContent = result.message || "Could not delete the note.";
      return;
    }

    if (editingNoteId === id) resetForm();
    fetchNotes();
  } catch (err) {
    message.textContent = "Could not reach the server. Please try again.";
  }
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
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  notesContainer.style.display = "none";
  authContainer.style.display = "block";
  registerPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  notesList.innerHTML = "";
  noteCount.textContent = "";
  resetForm();
});
