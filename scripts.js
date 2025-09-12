// Elements
const notesContainer = document.querySelector("#notes-container");
const noteInput = document.querySelector("#note-content");
const addNoteBtn = document.querySelector(".add-note");
const searchInput = document.querySelector("#search-input");
const exportCSVBtn = document.querySelector("#export-csv");
const exportXLSXBtn = document.querySelector("#export-xlsx");

// Functions
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
  notesContainer.replaceChildren([]);
}

function saveNotes(notes) {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function generateId() {
  return Math.floor(Math.random() * 5000);
}

function createNote(id, content, fixed) {
  const element = document.createElement("div");
  element.classList.add("note");

  if (fixed) {
    element.classList.add("fixed");
  }

  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.placeholder = "Adicione algum texto...";
  element.appendChild(textarea);

  const pinIcon = document.createElement("i");
  pinIcon.classList.add("bi", "bi-pin");
  element.appendChild(pinIcon);

  const deleteIcon = document.createElement("i");
  deleteIcon.classList.add("bi", "bi-x-lg");
  element.appendChild(deleteIcon);

  const duplicateIcon = document.createElement("i");
  duplicateIcon.classList.add("bi", "bi-file-earmark-plus");
  element.appendChild(duplicateIcon);

  // Events
  textarea.addEventListener("keydown", () => {
    const newText = textarea.value;
    updateNote(id, newText);
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
  const content = noteInput.value.trim();
  if (content === "") return;

  const newNote = {
    id: generateId(),
    content,
    fixed: false,
  };

  const noteElement = createNote(newNote.id, newNote.content, newNote.fixed);
  notesContainer.appendChild(noteElement);
  notes.push(newNote);
  saveNotes(notes);
  noteInput.value = "";
}

function updateNote(id, newContent) {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (note) {
    note.content = newContent;
    saveNotes(notes);
  }
}

function deleteNote(id, element) {
  const notes = getNotes().filter((note) => note.id !== id);
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
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  const duplicatedNote = {
    id: generateId(),
    content: note.content,
    fixed: false,
  };

  notes.push(duplicatedNote);
  saveNotes(notes);
  showNotes();
}

function searchNotes(search) {
  const filtered = getNotes().filter((note) =>
    note.content.toLowerCase().includes(search.toLowerCase())
  );
  cleanNotes();
  filtered.forEach((note) => {
    const element = createNote(note.id, note.content, note.fixed);
    notesContainer.appendChild(element);
  });
}

// Export to CSV (wps)
function exportToCSV() {
  const notes = getNotes();
  if (notes.length === 0) {
    alert("Nenhuma nota para exportar.");
    return;
  }

  const header = "Nota\n";
  const rows = notes.map((note) =>
    `"${note.content.replace(/"/g, '""')}"`
  );
  const csvContent = header + rows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "notas.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// export to xlsx (excel)
function exportToXLSX() {
  const notes = getNotes();
  if (notes.length === 0) {
    alert("Nenhuma nota para exportar.");
    return;
  }

  const data = notes.map((note) => ({ Nota: note.content }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Notas");

  XLSX.writeFile(workbook, "notas.xlsx");
}

// Events
addNoteBtn.addEventListener("click", () => addNote());

noteInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addNote();
  }
});

searchInput.addEventListener("input", (e) => {
  searchNotes(e.target.value);
});

exportCSVBtn.addEventListener("click", () => {
  exportToCSV();
});

exportXLSXBtn.addEventListener("click", () => {
  exportToXLSX();
});

// Inicialização
showNotes();
