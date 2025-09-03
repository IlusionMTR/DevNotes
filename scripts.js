const notesContainer = document.querySelector("#notes-container");
const noteInput = document.querySelector("#note-content");
const addNoteBtn = document.querySelector(".add-note");
const searchInput = document.querySelector("#search-input");
const exportBtn = document.querySelector("#export-notes");

// Funções principais
function showNotes() {
  cleanNotes();
  getNotes().forEach((note) => {
    const noteElement = createNote(note.id, note.content, note.fixed);
    notesContainer.appendChild(noteElement);
  });
}

function getNotes() {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  return notes.sort((a, b) => (a.fixed > b.fixed ? -1 : 1));
}

function cleanNotes() {
  notesContainer.innerHTML = "";
}

function saveNotes(notes) {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function createNote(id, content, fixed) {
  const element = document.createElement("div");
  element.classList.add("note");

  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.placeholder = "Adicione algum texto...";
  element.appendChild(textarea);

  if (fixed) {
    element.classList.add("fixed");
  }

  const pinIcon = document.createElement("i");
  pinIcon.classList.add("bi", "bi-pin");
  element.appendChild(pinIcon);

  const deleteIcon = document.createElement("i");
  deleteIcon.classList.add("bi", "bi-x-lg");
  element.appendChild(deleteIcon);

  const duplicateIcon = document.createElement("i");
  duplicateIcon.classList.add("bi", "bi-file-earmark-plus");
  element.appendChild(duplicateIcon);

  // Eventos
  textarea.addEventListener("keyup", () => {
    updateNote(id, textarea.value);
  });

  deleteIcon.addEventListener("click", () => {
    deleteNote(id, element);
  });

  pinIcon.addEventListener("click", () => {
    toggleFixNote(id);
  });

  duplicateIcon.addEventListener("click", () => {
    copyNote(id);
  });

  return element;
}

function addNote() {
  const notes = getNotes();

  if (noteInput.value.trim() === "") return;

  const newNote = {
    id: generateId(),
    content: noteInput.value,
    fixed: false,
  };

  notes.push(newNote);
  saveNotes(notes);
  noteInput.value = "";
  showNotes();
}

function generateId() {
  return Math.floor(Math.random() * 10000);
}

function updateNote(id, content) {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (note) {
    note.content = content;
    saveNotes(notes);
  }
}

function deleteNote(id, element) {
  let notes = getNotes();
  notes = notes.filter((note) => note.id !== id);
  saveNotes(notes);
  notesContainer.removeChild(element);
}

function toggleFixNote(id) {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (note) {
    note.fixed = !note.fixed;
    saveNotes(notes);
    showNotes();
  }
}

function copyNote(id) {
  const notes = getNotes();
  const original = notes.find((n) => n.id === id);

  if (!original) return;

  const newNote = {
    id: generateId(),
    content: original.content,
    fixed: false,
  };

  notes.push(newNote);
  saveNotes(notes);
  showNotes();
}

function searchNotes(term) {
  const notes = getNotes().filter((note) =>
    note.content.toLowerCase().includes(term.toLowerCase())
  );

  cleanNotes();

  notes.forEach((note) => {
    const noteElement = createNote(note.id, note.content, note.fixed);
    notesContainer.appendChild(noteElement);
  });
}

function exportData() {}
  const notes = getNotes();

  const escapeCSV = (str) =>
    `"${String(str).replace(/"/g, '""')}"`; // Escapa aspas e mantém \n funcionando

  const csvRows = []
