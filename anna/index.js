// Liste les zones
const zones = [
  {
    id: "taskList",
    label: "Tâches habituelles",
    allowAdd: true,
    allowImport: true,
    allowSave: true,
    allowTrash: true,
    allowDrop: true,
    type: "task",
    empty: "<p style=\"text-align:center; color:#888; font-style:italic;\">Glissez une tâche ici pour indiquer vos habitudes.</p>",
  },
  {
    id: "jobList",
    label: "Tâches travail",
    allowAdd: true,
    allowImport: true,
    allowSave: true,
    allowTrash: true,
    allowDrop: true,
    type: "job",
    empty: "<p style=\"text-align:center; color:#888; font-style:italic;\">Glissez une tâche ici pour indiquer votre travail.</p>",
  },
  {
    id: "planningList",
    label: "Planning du jour",
    allowAdd: true,
    allowImport: true,
    allowSave: true,
    allowTrash: true,
    allowDrop: true,
    type: "planning",
    empty: "<p style=\"text-align:center; color:#888; font-style:italic;\">Glissez une tâche ici pour construire votre planning.</p>",
  },
  {
    id: "tomorrowList",
    label: "Planning demain",
    allowAdd: true,
    allowImport: true,
    allowSave: true,
    allowTrash: true,
    allowDrop: true,
    type: "tomorrow",
    empty: "<p style=\"text-align:center; color:#888; font-style:italic;\">Glissez une tâche ici pour construire votre planning.</p>",
  },
  {
    id: "afterTomorrowList",
    label: "Planning après-demain",
    allowAdd: true,
    allowImport: true,
    allowSave: true,
    allowTrash: true,
    allowDrop: true,
    type: "afterTomorrow",
    empty: "<p style=\"text-align:center; color:#888; font-style:italic;\">Glissez une tâche ici pour construire votre planning.</p>",
  },
];

let dragged = null;




function fillZone(zone, items){
  items.forEach(item => {
    addItemInZone(item, zone, true);
  });
}

function saveZone(zone) {
  const items = [...zone.elem.querySelectorAll(".item")].map(item => {
    const time = item.querySelector(".timing")?.innerHTML.trim() || "";
    const description = item.querySelector(".description")?.innerHTML.trim() || "";
    const classes = [...(item.querySelector(".description")?.classList || [])].filter(c => c !== "description");
    return { time: time, descr: description, classes: classes };
  });
  localStorage.setItem(zone.type, JSON.stringify(items));
  console.log("Sauvegarde : ", zone.type);
}

function saveState() {
  zones.forEach(zone => saveZone(zone));
}

function loadState() {
  zones.forEach(zone => {
    zone.elem.innerHTML = "";
    const items = JSON.parse(localStorage.getItem(zone.type) || "[]");

    if(items.length > 0){
      fillZone(zone, items);
      console.log("Restored " + zone.type + ".");
    } else {
      resetZone(zone);
      console.log("Restored empty " + zone.type + ".");
    }

  });
}

function createItem(item){
      // item : {time, descr};

      // Item
  const wrap = document.createElement("div");
  wrap.classList.add("taskWrapper");
  wrap.draggable = true;

      // Timing
  const timing = document.createElement("span");
  timing.classList.add("timing");
  if (item.time?.trim()) {
    timing.innerHTML = item.time.trim();
  } else {
    timing.classList.add("hidden");
  }

      // Description
  const description = document.createElement("span");
  description.classList.add("description");
  description.innerHTML = item.descr.trim();

  if ("classes" in item && item.classes.length > 0) {
    item.classes.forEach(c => {description.classList.add(c)});
  }


  wrap.appendChild(timing);
  wrap.appendChild(description);

  wrap.onclick = (e) => {
    e.stopPropagation();
    const currentValues = {
      time: wrap.querySelector(".timing")?.innerHTML.trim(),
      descr: wrap.querySelector(".description")?.innerHTML.trim(),
      classes: [...(wrap.querySelector(".description")?.classList || [])].filter(c => c !== "description")
    };
    showPrompt("Modifier l'élément :", currentValues, function(newValues) {
      if (!newValues) return;
      changeItem(newValues, wrap);
    });
  };

  return wrap;
}

function changeItem(newValues, item){
  const timing = item.querySelector(".timing");
  if (newValues.time?.trim()) {
    timing.innerHTML = newValues.time.trim();
    timing.classList.remove("hidden");
  } else {
    timing.innerHTML = "";
    timing.classList.add("hidden");
  }

  const description = item.querySelector(".description");
  description.innerHTML = newValues.descr.trim();
  description.className = "description";
  if(newValues.classes) {
    newValues.classes.forEach(c => {description.classList.add(c);});
  }

  description.parentNode.parentNode.className = "item " + newValues.classes;

  saveState();
}

function insertionSlot(zone) {
  const item = document.createElement("div");
  item.className = "insert-slot";

  const span = document.createElement("span");
  span.className = "hover-text";
  span.textContent = "+";

  item.appendChild(span);

  item.addEventListener("click", () => {
    const currentZone = zones.find(z => z.elem.contains(item));
    showPrompt(currentZone.label + " : Entrer une nouvelle tâche à ajouter", {time: "", descr: "", classes: ""}, function(newValues) {
      if (!newValues) return;
      const fragment = prepareItemForZone(newValues, currentZone);
      emptyIfEmpty(currentZone);
          // Ajoute l'item à la zone
      item.parentNode.parentNode.insertBefore(fragment, item.parentNode.nextSibling);
          // Save
      saveZone(currentZone);
    });
  });
  return item
}

function prepareItemForZone(values, zone){
      // values : {time, descr};
  const fragment = document.createDocumentFragment();

  const itemBlock = document.createElement("div");
  itemBlock.className = "item-block";

  const item  = document.createElement("div");
  item.className = "item";

  const iSlot = insertionSlot(zone);

  const wrapper = createItem(values);

      // Bouton Modifier
  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.innerHTML = "&#9998;";
  editBtn.title = "Modifier";
  editBtn.onclick = (e) => {
    e.stopPropagation();
    const currentValues = {
      time: wrapper.querySelector(".timing")?.innerHTML.trim(),
      descr: wrapper.querySelector(".description")?.innerHTML.trim(),
      classes: [...(wrapper.querySelector(".description")?.classList || [])].filter(c => c !== "description")
    };
    showPrompt("Modifier l'élément :", currentValues, function(newValues) {
      if (!newValues) return;
      changeItem(newValues, wrapper);
    });
  };

      // Bouton Supprimer
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "&#10006;";
  deleteBtn.title = "Supprimer";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    const currentZone = zones.find(z => z.elem.contains(item));
        // Remove element
    item.remove();
    iSlot.remove();
    saveZone(currentZone);
        // Check if there are elements in the zone
    if([...currentZone.elem.querySelectorAll(".item")].length == 0){
          // Otherwise, clean it
      resetZone(currentZone);
    }
  };

      // Ajoutes les parties à l'item
  item.append(wrapper, editBtn, deleteBtn);

  itemBlock.appendChild(item);
      // Ajoute insertion slot
  itemBlock.appendChild(iSlot);

  fragment.appendChild(itemBlock);

  wrapper.addEventListener("dragstart", (e) => {
    dragged = {"zone": zone, "elem": itemBlock};
    e.dataTransfer.setDragImage(new Image(), 0, 0);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({
      time: item.time || "",
      descr: item.descr || ""
    }));
    item.classList.add("dragging");
    itemBlock.classList.add("dragging");
  });
  wrapper.addEventListener("dragend", () => {
    item.classList.remove("dragging");
    itemBlock.classList.remove("dragging");
    zone.elem.classList.remove("drag-over");
    dragged = null;
  });

  return fragment;
}

function addItemInZone(values, zone, silent=false) {
  const fragment = prepareItemForZone(values, zone);

  emptyIfEmpty(zone);

      // Ajoute l'item à la zone
  zone.elem.appendChild(fragment);

      // Save
  if(!silent){
    saveZone(zone);
  }

}

function resetZone(zone){
  zone.elem.innerHTML = zone.empty;
}

    // Identify the location where item should be inserted
function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll(".item-block:not(.dragging)")];
  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset
    ? { offset, element: child }
    : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

    // Select these elements and prepare them
zones.forEach(zone => {
  zone.elem = document.getElementById(zone.id);

  const header = zone.elem.previousElementSibling;

      // Prepare fragment
  const fragment = document.createDocumentFragment();
      // Title
  const title = document.createElement("h2");
  title.textContent = zone.label;
  fragment.appendChild(title);

      // Add button
  if(zone.allowAdd){
    const addBtn = document.createElement("span");
    addBtn.classList.add("addItemBtn");
    addBtn.title = "Ajouter"
    addBtn.innerHTML = "&#43";
    fragment.appendChild(addBtn);

    addBtn.addEventListener("click", () => {
      showPrompt(zone.label + " : Entrer une nouvelle tâche à ajouter", {time: "", descr: "", classes: ""}, function(newValues) {
        if (!newValues) return;
        addItemInZone(newValues, zone);
        saveZone(zone);
      });
    });

    zone.elem.addEventListener("click", (e) => {
      if(e.target.tagName === "P"){
        addBtn.click();
      }
    });

  }

      // Filler
  const filler = document.createElement("span");
  filler.classList.add("filler");
  fragment.appendChild(filler);



      // Trash button
  if(zone.allowTrash){
    const trashBtn = document.createElement("span");
    trashBtn.classList.add("btnT");
    trashBtn.title = "Vider"
    trashBtn.innerHTML = "&#128465;";
    fragment.appendChild(trashBtn);

    trashBtn.addEventListener("click", () => {
      resetZone(zone);
      saveZone(zone);
    });
  }

      // Save button
  if(zone.allowSave){
    const saveBtn = document.createElement("span");
    saveBtn.classList.add("btnT");
    saveBtn.title = "Sauver"
    saveBtn.innerHTML = "&#128190;";
    fragment.appendChild(saveBtn);

    saveBtn.addEventListener("click", () => {
      const items = zone.elem.querySelectorAll(".item");
      if (!items.length) {
        alert("Le planning est vide.");
        return;
      }
      const lines = [...items].map(item => {
        const time = item.querySelector(".timing")?.textContent.trim() || "";
        const description = item.querySelector(".description")?.textContent.trim() || "";
        const classesArray = [...(item.querySelector(".description")?.classList || [])].filter(c => c !== "description").join(";");
        const classesString = classesArray.length > 0 ? ';' + classesArray : '';
        return time + ";" + description + classesString;
      });
      const output = lines.join("\n");

      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });

          // Nom de fichier basé sur la date actuelle
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      const filename = `${zone.type}-${yyyy}-${mm}-${dd}.txt`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

  }

      // Import button
  if(zone.allowImport){
    const input = document.createElement('input');
    input.type = 'file';
    input.id = `input-${zone.id}`;
    input.accept = '.txt';
    input.classList.add("hidden");
    fragment.appendChild(input);

    const importBtn = document.createElement("label");
    importBtn.setAttribute("for", input.id);
    importBtn.classList.add("btnT");
    importBtn.title = "Importer"
    importBtn.innerHTML = "&#128194;";
    fragment.appendChild(importBtn);

    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      // zone.elem.innerHTML = "";
      const reader = new FileReader();
      reader.onload = (ev) => {

        const lines = ev.target.result
            .split(/\r?\n/) // Division en ligne selon l'OS
            .map(l => l.trim())
            .filter(Boolean);

        const parsedLines = lines.map(line => {
            const parts = line.split(';').map(part => part.trim());

            if (parts.length === 1) {
                return {descr: parts[0]};
            } else if (parts.length === 2) {
                return {time: parts[0], descr: parts[1]};
            } else {
                const time = parts[0];
                const descr = parts[1];
                const classes = parts.slice(2);
                return {time: time, descr: descr, classes: classes};
            }
          });
        fillZone(zone, parsedLines);
        saveZone(zone);
      };
      reader.readAsText(file);
      input.value = "";
    });
  }

  header.appendChild(fragment);

});

    // Drag & Drop pour **réordonner** dans une zone
    zones.forEach(zone => {
      zone.elem.addEventListener("dragover", e => {
        e.preventDefault();
        zone.elem.classList.add("drag-over");

        const after = getDragAfterElement(zone.elem, e.clientY);
        const dragging = document.querySelector(".dragging");

        if (!dragging) return;

        if (after) {
          zone.elem.insertBefore(dragging, after);
        } else {
          emptyIfEmpty(zone);
          zone.elem.appendChild(dragging);
        }

        e.dataTransfer.dropEffect = 'move';

      });

      zone.elem.addEventListener("dragleave", () => {
        zone.elem.classList.remove("drag-over");
      });

      zone.elem.addEventListener("drop", (e) => {
        e.preventDefault();

        zone.elem.classList.remove("drag-over");

        saveState();

        setTimeout(() => {
          if (
            dragged?.zone &&
            dragged.zone.elem.querySelectorAll(".item").length === 0
            ) {
            resetZone(dragged.zone);
        }
      }, 0);
      });
    });

    function emptyIfEmpty(zone) {
      if(!zone.elem.querySelectorAll(".item").length){
        zone.elem.innerHTML = "";
      }
    }
    




    function showPrompt(title, initialValue, callback) {
      const modal = document.getElementById("customPromptOverlay");
      const inputTime = document.getElementById("promptInputTime");
      const inputDescr = document.getElementById("promptInputDescr");
      const titleEl = document.getElementById("promptTitle");
      const selectClass = document.getElementById("classPalette");


      titleEl.textContent = title;
      inputTime.value = initialValue.time || "";
      inputDescr.value = initialValue.descr || "";
      modal.classList.remove("hidden");
      inputDescr.focus();

      selectClass.querySelectorAll(".modalBtn").forEach(button =>{
        if(initialValue.classes.includes(button.textContent)){
          button.classList.add("selected");
        } else {
          button.classList.remove("selected");
        }
      });

      function handleKeyDown(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          document.getElementById("promptConfirmBtn").click();
          inputTime.removeEventListener("keydown", handleKeyDown);
          inputDescr.removeEventListener("keydown", handleKeyDown);
        }

        if (e.key === "Escape") {
          e.preventDefault();
          cleanup();
          callback(null);
          inputTime.removeEventListener("keydown", handleKeyDown);
          inputDescr.removeEventListener("keydown", handleKeyDown);
        }
      }

      inputTime.addEventListener("keydown", handleKeyDown);
      inputDescr.addEventListener("keydown", handleKeyDown);

      function cleanup() {
        modal.classList.add("hidden");
        document.getElementById("promptConfirmBtn").onclick = null;
        document.getElementById("promptCancelBtn").onclick = null;
      }

      document.getElementById("promptConfirmBtn").onclick = () => {
        cleanup();
        callback({time: inputTime.value.trim(), descr: inputDescr.value.trim(), classes: [...selectClass.querySelectorAll(".selected")].map(e => e.textContent)});
      };

      document.getElementById("promptCancelBtn").onclick = () => {
        cleanup();
        callback(null);
      };

      document.getElementById("customPromptOverlay").addEventListener("click", function (e) {
        const modal = document.getElementById("customPrompt");
        if (!modal.contains(e.target)) {
          cleanup();
          callback(null);
        }
      });

      let activeInput = inputDescr; // champ actif

      // Lorsqu’un input reçoit le focus, on le mémorise
      inputTime.addEventListener("focus", () => {activeInput = inputTime});
      inputDescr.addEventListener("focus", () => {activeInput = inputDescr});


      document.querySelectorAll("#emojiPalette .emoji").forEach(el => {
        el.onclick = () => {
          if (!activeInput) return;

          const emoji = el.innerHTML;
          const start = activeInput.selectionStart;
          const end = activeInput.selectionEnd;
          const text = activeInput.value;

          // Insère l’emoji à la position du curseur
          activeInput.value = text.slice(0, start) + emoji + text.slice(end);

          // Replace le curseur juste après l’emoji inséré
          const newPos = start + emoji.length;
          activeInput.setSelectionRange(newPos, newPos);

          activeInput.focus();
        };
      });
    }

    document.addEventListener("dragend", () => {
      dragged = null;
      document.querySelectorAll(".dragging").forEach(el => el.classList.remove("dragging"));
    });


    

    loadState();

    const container = document.getElementById('page');
    const resizer = document.getElementById('resizer');

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    resizer.addEventListener('mousedown', function (e) {
      isDragging = true;
      startY = e.clientY;
      startHeight = container.offsetHeight;
      document.body.style.cursor = 'row-resize';
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      const dy = e.clientY - startY;
      container.style.height = `${startHeight + dy}px`;
    });

    document.addEventListener('mouseup', function () {
      isDragging = false;
      document.body.style.cursor = 'default';
    });
