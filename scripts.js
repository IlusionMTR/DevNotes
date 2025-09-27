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

const categoryColors = {
  default: "#ccc",
  urgent: "#ff4d4d", 
  progress: "#ffd633",
  done: "#33cc33"
};

const categoryOrder = ["default", "urgent", "progress", "done"];

function getNotes() {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  return notes.sort((a, b) => {
    if (a.fixed && !b.fixed) return -1;
    if (!a.fixed && b.fixed) return 1;
    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  });
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

function createNote(id, content, fixed, category, createdAt, completedAt) {
  const element = document.createElement("div");
  element.classList.add("note", category);
  if (fixed) element.classList.add("fixed");
  element.dataset.id = id;

  const categoryBar = document.createElement("div");
  categoryBar.classList.add("category-bar");
  categoryBar.dataset.category = category;
  element.appendChild(categoryBar);
  categoryBar.addEventListener("click", e => {
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

  textarea.addEventListener("input", () => updateNote(id, textarea.value));
  deleteIcon.addEventListener("click", () => deleteNote(id, element));
  pinIcon.addEventListener("click", () => toggleFixNote(id));
  duplicateIcon.addEventListener("click", () => copyNote(id));

  return element;
}

function addNote() {
  const content = noteInput.value.trim();
  const category = noteCategory.value;
  if (!content) return;

  const notes = getNotes();
  const now = new Date().toISOString();
  const newNote = { id: generateId(), content, fixed: false, category, createdAt: now, completedAt: category === "done" ? now : null };
  notes.push(newNote);
  saveNotes(notes);
  noteInput.value = "";
  renderNotesWithAnimation();
}

function updateNote(id, newContent) {
  const notes = getNotes();
  const note = notes.find(n => n.id === id);
  if (note) {
    note.content = newContent;
    saveNotes(notes);
    updateScore();
  }
}

function deleteNote(id, element) {
  // Animação de saída mais suave
  element.style.transform = "scale(0.8) translateY(10px)";
  element.style.opacity = "0";
  
  setTimeout(() => {
    const notes = getNotes().filter(n => n.id !== id);
    saveNotes(notes);
    renderNotesWithAnimation();
  }, 400);
}

function changeNoteCategory(id) {
  const notes = getNotes();
  const note = notes.find(n => n.id === id);
  if (!note) return;

  const oldCategory = note.category;
  const idx = categoryOrder.indexOf(note.category);
  const newCategory = categoryOrder[(idx + 1) % categoryOrder.length];
  
  // Animação de transição de cor primeiro
  animateColorTransition(id, oldCategory, newCategory);
  
  // Depois atualiza os dados
  setTimeout(() => {
    note.category = newCategory;
    if (note.category === "done" && !note.completedAt) note.completedAt = new Date().toISOString();
    if (note.completedAt && note.category !== "done") note.completedAt = null;
    
    saveNotes(notes);
    renderNotesWithAnimation();
  }, 600); // Tempo para a animação de cor completar
}

function toggleFixNote(id) {
  const notes = getNotes();
  const note = notes.find(n => n.id === id);
  if (note) note.fixed = !note.fixed;
  saveNotes(notes);
  renderNotesWithAnimation();
}

function copyNote(id) {
  const notes = getNotes();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  const duplicated = { ...note, id: generateId(), fixed: false, createdAt: new Date().toISOString(), completedAt: null };
  notes.push(duplicated);
  saveNotes(notes);
  renderNotesWithAnimation();
}

function searchNotes(search) {
  const filtered = getNotes().filter(n => n.content.toLowerCase().includes(search.toLowerCase()));
  renderNotesWithAnimation(filtered);
}

function exportToXLSX() {
  const notes = getNotes();
  if (!notes.length) { alert("Nenhuma nota para exportar."); return; }

  const data = notes.map(note => ({
    Nota: note.content,
    Categoria: categoryMap[note.category] || "Não definida",
    Prioridade: note.category === "done" ? "Concluído" : note.category === "urgent" ? "Imediata" : note.category === "progress" ? "Média" : "Baixa",
    "Data de Envio": formatDate(note.createdAt),
    "Data de Conclusão": formatDate(note.completedAt)
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Notas");
  XLSX.writeFile(workbook, "notas.xlsx");
}

function updateScore() {
  const notes = getNotes();
  const total = notes.length;
  const done = notes.filter(n => n.category === "done").length;
  const score = total > 0 ? Math.round((done / total) * 100) : 0;
  scoreValue.textContent = score + "%";

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

// Animação suave de transição de cor
function animateColorTransition(noteId, oldCategory, newCategory) {
  const noteElement = document.querySelector(`.note[data-id="${noteId}"]`);
  const categoryBar = noteElement.querySelector('.category-bar');
  
  if (!categoryBar) return;
  
  const oldColor = categoryColors[oldCategory];
  const newColor = categoryColors[newCategory];
  
  // Adiciona a classe de animação
  categoryBar.classList.add('color-transition');
  categoryBar.style.setProperty('--old-color', oldColor);
  categoryBar.style.setProperty('--new-color', newColor);
  
  // Atualiza a categoria no dataset para a animação CSS
  categoryBar.dataset.category = newCategory;
  
  // Remove a classe após a animação
  setTimeout(() => {
    categoryBar.classList.remove('color-transition');
  }, 600);
}

// Animação para renderização geral
function renderNotesWithAnimation(filteredNotes = null) {
  const notes = filteredNotes || getNotes();
  
  // Salva as posições atuais
  const oldPositions = {};
  Array.from(notesContainer.children).forEach(note => {
    oldPositions[note.dataset.id] = note.getBoundingClientRect();
  });
  
  // Limpa o container
  notesContainer.innerHTML = "";
  
  // Adiciona as notas novamente
  notes.forEach(note => {
    const el = createNote(note.id, note.content, note.fixed, note.category, note.createdAt, note.completedAt);
    notesContainer.appendChild(el);
  });
  
  // Anima cada nota para sua nova posição
  Array.from(notesContainer.children).forEach(note => {
    const oldRect = oldPositions[note.dataset.id];
    if (!oldRect) {
      // Nova nota - animação de entrada
      note.style.opacity = "0";
      note.style.transform = "translateY(20px)";
      
      requestAnimationFrame(() => {
        note.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        note.style.opacity = "1";
        note.style.transform = "";
        
        setTimeout(() => {
          note.style.transition = "";
        }, 400);
      });
      return;
    }
    
    const newRect = note.getBoundingClientRect();
    const containerRect = notesContainer.getBoundingClientRect();
    
    const deltaX = oldRect.left - containerRect.left - (newRect.left - containerRect.left);
    const deltaY = oldRect.top - containerRect.top - (newRect.top - containerRect.top);
    
    note.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    note.style.opacity = "0.8";
    
    requestAnimationFrame(() => {
      note.style.transition = "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s ease";
      note.style.transform = "";
      note.style.opacity = "1";
      
      setTimeout(() => {
        note.style.transition = "";
      }, 600);
    });
  });
  
  updateScore();
}

// Eventos
addNoteBtn.addEventListener("click", addNote);
noteInput.addEventListener("keydown", e => { if (e.key === "Enter") addNote(); });
searchInput.addEventListener("input", e => searchNotes(e.target.value));
exportXLSXBtn.addEventListener("click", exportToXLSX);

renderNotesWithAnimation();
