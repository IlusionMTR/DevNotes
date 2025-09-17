// Elements
const notesContainer = document.querySelector("#notes-container");
const noteInput = document.querySelector("#note-content");
const noteCategory = document.querySelector("#note-category");
const addNoteBtn = document.querySelector(".add-note");
const searchInput = document.querySelector("#search-input");
const exportXLSXBtn = document.querySelector("#export-xlsx");
const scoreValue = document.querySelector("#score-value");

// Traduções das categorias para português
const categoryMap = {
  done: "Concluído",
  progress: "Em progresso",
  default: "Não urgente",
  urgent: "Urgente"
};

// Functions
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
  return notes.sort((a, b) => (a.fixed > b.fixed ? -1 : 1));
}

function cleanNotes() {
  notesContainer.replaceChildren([]);
}

function saveNotes(notes) {
  localStorage.setItem("notes", JSON.stringify(notes));
  updateScore();
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

  if (fixed) {
    element.classList.add("fixed");
  }

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

  // Rodapé da nota (datas)
  const footer = document.createElement("div");
  footer.classList.add("note-footer");
  footer.innerHTML = `
    <small>Enviado: ${formatDate(createdAt)}</small><br>
    <small>Concluído: ${formatDate(completedAt)}</small>
  `;
  element.appendChild(footer);

  // Events
  textarea.addEventListener("input", () => {
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
  const category = noteCategory.value;

  if (content === "") return;

  const newNote = {
    id: generateId(),
    content,
    fixed: false,
    category,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  const noteElement = createNote(
    newNote.id,
    newNote.content,
    newNote.fixed,
    newNote.category,
    newNote.createdAt,
    newNote.completedAt
  );
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

function changeNoteCategory(id) {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  const currentIndex = categoryOrder.indexOf(note.category);
  const nextIndex = (currentIndex + 1) % categoryOrder.length;
  const nextCategory = categoryOrder[nextIndex];

  note.category = nextCategory;

  // Salva a data de conclusão se for concluído
  if (nextCategory === "done" && !note.completedAt) {
    note.completedAt = new Date().toISOString();
  }

  // Remove data se deixar de ser concluído
  if (note.completedAt && nextCategory !== "done") {
    note.completedAt = null;
  }

  saveNotes(notes);
  showNotes();
}

const categoryOrder = ["default", "urgent", "progress", "done"];

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

// Exportar para XLSX (Excel)
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

// Score system
function updateScore() {
  const notes = getNotes();
  const total = notes.length;
  const done = notes.filter((n) => n.category === "done").length;

  const score = total > 0 ? Math.round((done / total) * 100) : 0;
  scoreValue.textContent = score + "%";

  saveScoreHistory(score);

  const average = calculateAverage();
  document.querySelector("#average-score").textContent = average + "%";

  const feedbackEl = document.querySelector("#score-feedback");
  if (average < 15) {
    feedbackEl.textContent = "Sua média está baixa, precisa melhorar!";
    feedbackEl.style.color = "#ff4d4d";
  } else if (average < 30) {
    feedbackEl.textContent = "Está razoável, mas dá para evoluir.";
    feedbackEl.style.color = "#ffd633";
  } else {
    feedbackEl.textContent = "Excelente, continue assim!";
    feedbackEl.style.color = "#33cc33";
  }
}

function saveScoreHistory(score) {
  const history = JSON.parse(localStorage.getItem("scoreHistory") || "[]");
  history.push(score);
  if (history.length > 30) history.shift();
  localStorage.setItem("scoreHistory", JSON.stringify(history));
}

function calculateAverage() {
  const history = JSON.parse(localStorage.getItem("scoreHistory") || "[]");
  if (history.length === 0) return 0;
  const sum = history.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / history.length);
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

exportXLSXBtn.addEventListener("click", () => {
  exportToXLSX();
});

// Inicialização
showNotes();
