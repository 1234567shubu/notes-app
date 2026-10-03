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
// Remove a bearer token left behind by the earlier localStorage-based version.
localStorage.removeItem("token");

function showLogin(messageText = "") {
  notesContainer.style.display = "none";
  authContainer.style.display = "block";
  registerPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  authMessage.textContent = messageText;
  notesList.innerHTML = "";
  noteCount.textContent = "";
  userNameDisplay.textContent = "";
  resetForm();
}

function showNotes(user) {
  authContainer.style.display = "none";
  notesContainer.style.display = "block";
  userNameDisplay.textContent = user?.name ? `Welcome, ${user.name}` : "";
}

async function isRefreshTokenExpired() {
  
  try {
    // 1. Make a clean POST request to the refresh endpoint
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: "same-origin" // or "include" depending on your CORS setup
    });

    // 2. If the refresh token is also expired or invalid in the backend
    if (!response.ok) {
      return true; // Refresh failed
    }

    return false; // Refresh succeeded, new access token cookie is now set!
  } catch (error) {
    console.error('Error refreshing token:', error);
    return true;
  }
}

async function authorizedFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});

  // 1. Try the original request
  const response = await fetch(url, { ...options, headers, credentials: "same-origin" });
  
  // 2. If Access Token expired (401 Unauthorized)
  if (response.status === 401) {
    const refreshTokenExpired = await isRefreshTokenExpired();
    
    // 3. If refresh token is dead, force login
    if (refreshTokenExpired) {
      showLogin("Your session expired. Please log in again.");
      return null;
    }
    
    // 4. Refresh succeeded! Retry the original request with the new access token
    const res = await fetch(url, { ...options, headers, credentials: "same-origin" });
    
    if (!res.ok) {
      showLogin("Your session expired. Please log in again.");
      return null;
    }
    
    return res;
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

async function checkLogin() {
  try {
    const response = await authorizedFetch("/api/auth/me", { credentials: "same-origin" });
    if (!response) return; // If authorizedFetch returned null, the user is not logged in
    if (!response.ok) {
      showLogin();
      return;
    }
    const result = await readJson(response);
    showNotes(result.user);
    fetchNotes();
  } catch (err) {
    showLogin("Could not reach the server. Please try again.");
  }
}
checkLogin();

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
    const result = await readJson(response);
    if (!response.ok) return (authMessage.textContent = result.message);
    showNotes(result.user);
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
  fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) throw new Error("Logout failed");
      showLogin("You have been logged out.");
    })
    .catch(() => {
      authMessage.textContent = "Could not log out. Please try again.";
    });
});
