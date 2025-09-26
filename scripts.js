const notesContainer = document.querySelector("#notes-container");
const noteInput = document.querySelector("#note-content");
const noteCategory = document.querySelector("#note-category");
const addNoteBtn = document.querySelector(".add-note");
const searchInput = document.querySelector("#search-input");
const exportXLSXBtn = document.querySelector("#export-xlsx");
const scoreValue = document.querySelector("#score-value");
const feedbackEl = document.querySelector("#score-feedback");

const categoryMap = {
  done: "Concluído",
  progress: "Em progresso",
  default: "Não urgente",
  urgent: "Urgente"
};

const categoryOrder = ["default", "urgent", "progress", "done"];

// functions
function showNotes() {
  cleanNotes();
  getNotes().forEach((note) => {
    const noteElement = createNote(
      note.id,
      note.content,
      note.fixed,
      note.category,
      note.createdAt,
      note.completedAt
    );
    notesContainer.appendChild(noteElement);
  });
  updateScore();
}

function getNotes() {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  return notes.sort((a, b) => (a.fixed === b.fixed ? 0 : a.fixed ? -1 : 1));
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

function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR");
}

function createNote(id, content, fixed, category = "default", createdAt, completedAt) {
  const element = document.createElement("div");
  element.classList.add("note", category);
  if (fixed) element.classList.add("fixed");

  const categoryBar = document.createElement("div");
  categoryBar.classList.add("category-bar");
  element.appendChild(categoryBar);

  categoryBar.addEventListener("click", (e) => {
    e.stopPropagation();
    changeNoteCategory(id);
  });

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

  const footer = document.createElement("div");
  footer.classList.add("note-footer");
  footer.innerHTML = `
    <small>Enviado: ${formatDate(createdAt)}</small><br>
    <small>Concluído: ${formatDate(completedAt)}</small>
  `;
  element.appendChild(footer);

  // events
  textarea.addEventListener("input", () => updateNote(id, textarea.value));
  deleteIcon.addEventListener("click", () => deleteNote(id, element));
  pinIcon.addEventListener("click", () => toggleFixNote(id));
  duplicateIcon.addEventListener("click", () => copyNote(id));

  return element;
}

function addNote() {
  const notes = getNotes();
  const content = noteInput.value.trim();
  const category = noteCategory.value;
  if (content === "") return;

  const now = new Date().toISOString();

  const newNote = {
    id: generateId(),
    content,
    fixed: false,
    category,
    createdAt: now,
    completedAt: category === "done" ? now : null 
  };

  notes.push(newNote);
  saveNotes(notes);
  noteInput.value = "";
  showNotes();
}

function updateNote(id, newContent) {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (note) {
    note.content = newContent;
    saveNotes(notes);
    updateScore();
  }
}

function deleteNote(id, element) {
  const notes = getNotes().filter((note) => note.id !== id);
  saveNotes(notes);
  if (element && element.parentNode === notesContainer) {
    notesContainer.removeChild(element);
  }
  updateScore();
}

function changeNoteCategory(id) {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  const currentIndex = categoryOrder.indexOf(note.category);
  const nextIndex = (currentIndex + 1) % categoryOrder.length;
  const nextCategory = categoryOrder[nextIndex];

  note.category = nextCategory;
  if (nextCategory === "done" && !note.completedAt) note.completedAt = new Date().toISOString();
  if (note.completedAt && nextCategory !== "done") note.completedAt = null;

  saveNotes(notes);
  showNotes();
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
    category: note.category,
    createdAt: new Date().toISOString(),
    completedAt: null
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
    const element = createNote(
      note.id,
      note.content,
      note.fixed,
      note.category,
      note.createdAt,
      note.completedAt
    );
    notesContainer.appendChild(element);
  });
}

function exportToXLSX() {
  const notes = getNotes();
  if (notes.length === 0) {
    alert("Nenhuma nota para exportar.");
    return;
  }

  const data = notes.map((note) => ({
    Nota: note.content,
    Categoria: categoryMap[note.category] || "Não definida",
    Prioridade:
      note.category === "done"
        ? "Concluído"
        : note.category === "urgent"
        ? "Imediata"
        : note.category === "progress"
        ? "Média"
        : "Baixa",
    "Data de Envio": formatDate(note.createdAt),
    "Data de Conclusão": formatDate(note.completedAt)
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Notas");

  XLSX.writeFile(workbook, "notas.xlsx");
}

// score
function updateScore() {
  const notes = getNotes();
  const total = notes.length;
  const done = notes.filter((n) => n.category === "done").length;

  const score = total > 0 ? Math.round((done / total) * 100) : 0;
  if (scoreValue) scoreValue.textContent = score + "%";

  if (feedbackEl) {
    if (score <= 25) {
      feedbackEl.textContent = "Sua produtividade está baixa, precisa melhorar!";
      feedbackEl.style.color = "#ff4d4d";
    } else if (score <= 50) {
      feedbackEl.textContent = "Produtividade razoável, pode melhorar.";
      feedbackEl.style.color = "#ffd633";
    } else {
      feedbackEl.textContent = "Excelente produtividade! Continue assim!";
      feedbackEl.style.color = "#33cc33";
    }
  }
}

// events
addNoteBtn.addEventListener("click", addNote);
noteInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addNote(); });
searchInput.addEventListener("input", (e) => searchNotes(e.target.value));
exportXLSXBtn.addEventListener("click", exportToXLSX);

// inicialização
showNotes();
