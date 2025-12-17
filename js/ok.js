document.addEventListener("DOMContentLoaded", function () {
  const taskList = [];
  let taskIdCounter = 0;

  const form = document.getElementById('addTaskForm');
  const taskTableBody = document.getElementById('taskTableBody');

  loadTasksFromLocalStorage();

  const toggleBtn = document.getElementById("togglesidebar");
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("collapsed");
  });

  document.querySelector('.sidebar a[href="#tasks"]').addEventListener('click', function (e) {
    e.preventDefault();
    const tasksSection = document.querySelector('#tasks');
    mainContent.scrollTo({
      top: tasksSection.offsetTop,
      behavior: 'smooth'
    });
  });

  document.querySelector('.sidebar a[href="#top"]').addEventListener('click', function (e) {
    e.preventDefault();
    const topSection = document.querySelector('#top');
    mainContent.scrollTo({
      top: topSection.offsetTop,
      behavior: 'smooth'
    });
  });


  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('taskName').value.trim();
    const date = document.getElementById('taskDueDate').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value.toLowerCase();
    const assignedTo = document.getElementById('taskAssignedTo').value.trim();

    if (!name || !date) {
      alert('Please enter all required fields.');
      return;
    }

    const taskId = ++taskIdCounter;
    const task = { id: taskId, name, date, status, priority, assignedTo };
    taskList.push(task);
    addTaskRow(task);
    saveTasksToLocalStorage();
    form.reset();
  });

  function loadTasksFromLocalStorage() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    savedTasks.forEach(task => {
      taskList.push(task);
      addTaskRow(task);
      if (task.id > taskIdCounter) taskIdCounter = task.id;
    });
  }

  function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(taskList));
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatStatusText(status) {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  }

  function toggleStatus(element) {
    const currentStatus = element.getAttribute('data-status');
    let newStatus;
    if (currentStatus === 'pending') newStatus = 'in-progress';
    else if (currentStatus === 'in-progress') newStatus = 'completed';
    else newStatus = 'pending';

    element.setAttribute('data-status', newStatus);
    element.className = 'status ' + newStatus;
    element.textContent = formatStatusText(newStatus);
  }

  function addTaskRow(task) {
    const row = document.createElement('tr');
    row.dataset.taskId = task.id;

    const nameCell = document.createElement('td');
    nameCell.textContent = task.name;
    row.appendChild(nameCell);

    const statusCell = document.createElement('td');
    statusCell.innerHTML = `<span class="status ${task.status}" data-status="${task.status}">${formatStatusText(task.status)}</span>`;
    row.appendChild(statusCell);

    const dateCell = document.createElement('td');
    dateCell.textContent = task.date;
    row.appendChild(dateCell);

    const priorityCell = document.createElement('td');
    priorityCell.textContent = capitalize(task.priority);
    row.appendChild(priorityCell);

    const assignedToCell = document.createElement('td');
    assignedToCell.textContent = task.assignedTo || 'Unassigned';
    row.appendChild(assignedToCell);

    const deleteCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => {
      row.remove();
      const index = taskList.findIndex(t => t.id === task.id);
      if (index !== -1) {
        taskList.splice(index, 1);
        saveTasksToLocalStorage();
      }
    });
    deleteCell.appendChild(deleteBtn);
    row.appendChild(deleteCell);

    const editCell = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    editBtn.addEventListener('click', () => enterEditMode(row));
    editCell.appendChild(editBtn);
    row.appendChild(editCell);

    taskTableBody.appendChild(row);

    statusCell.querySelector('.status').addEventListener('click', function () {
      toggleStatus(this);
      const taskObj = taskList.find(t => t.id === task.id);
      if (taskObj) {
        taskObj.status = this.getAttribute('data-status');
        saveTasksToLocalStorage();
      }
    });
  }

  function enterEditMode(row) {
    const cells = row.querySelectorAll('td');
    const currentName = cells[0].textContent;
    const currentStatus = cells[1].querySelector('.status').getAttribute('data-status');
    const currentDate = cells[2].textContent;
    const currentPriority = cells[3].textContent.toLowerCase();
    const currentAssignedTo = cells[4].textContent;

    cells[0].innerHTML = `<input type="text" value="${currentName}" />`;
    cells[1].innerHTML = `
      <select>
        <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="in-progress" ${currentStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
    `;
    cells[2].innerHTML = `<input type="date" value="${currentDate}" />`;
    cells[3].innerHTML = `
      <select>
        <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>Low</option>
        <option value="medium" ${currentPriority === 'medium' ? 'selected' : ''}>Medium</option>
        <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>High</option>
      </select>
    `;
    cells[4].innerHTML = `<input type="text" value="${currentAssignedTo}" />`;

    cells[5].innerHTML = '';
    cells[6].innerHTML = '';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.classList.add('save-btn');
    saveBtn.addEventListener('click', () => saveChanges(row));

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.classList.add('cancel-btn');
    cancelBtn.addEventListener('click', () => cancelEdit(row, {
      name: currentName,
      status: currentStatus,
      date: currentDate,
      priority: currentPriority,
      assignedTo: currentAssignedTo
    }));

    cells[5].appendChild(saveBtn);
    cells[6].appendChild(cancelBtn);
  }

  function saveChanges(row) {
    const taskId = parseInt(row.dataset.taskId);
    const cells = row.querySelectorAll('td');

    const newName = cells[0].querySelector('input').value.trim();
    const newStatus = cells[1].querySelector('select').value;
    const newDate = cells[2].querySelector('input').value;
    const newPriority = cells[3].querySelector('select').value;
    const newAssignedTo = cells[4].querySelector('input').value.trim();

    if (!newName || !newDate) {
      alert('Please enter all required fields.');
      return;
    }

    const task = taskList.find(t => t.id === taskId);
    if (task) {
      task.name = newName;
      task.status = newStatus;
      task.date = newDate;
      task.priority = newPriority;
      task.assignedTo = newAssignedTo;
    }

    cells[0].textContent = newName;
    cells[1].innerHTML = `<span class="status ${newStatus}" data-status="${newStatus}">${formatStatusText(newStatus)}</span>`;
    cells[2].textContent = newDate;
    cells[3].textContent = capitalize(newPriority);
    cells[4].textContent = newAssignedTo || 'Unassigned';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => {
      row.remove();
      const index = taskList.findIndex(t => t.id === taskId);
      if (index !== -1) taskList.splice(index, 1);
      saveTasksToLocalStorage();
    });

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    editBtn.addEventListener('click', () => enterEditMode(row));

    cells[5].innerHTML = '';
    cells[6].innerHTML = '';
    cells[5].appendChild(deleteBtn);
    cells[6].appendChild(editBtn);

    cells[1].querySelector('.status').addEventListener('click', function () {
      toggleStatus(this);
      const task = taskList.find(t => t.id === taskId);
      if (task) {
        task.status = this.getAttribute('data-status');
        saveTasksToLocalStorage();
      }
    });

    saveTasksToLocalStorage();
  }

  function cancelEdit(row, originalData) {
    const cells = row.querySelectorAll('td');
    cells[0].textContent = originalData.name;
    cells[1].innerHTML = `<span class="status ${originalData.status}" data-status="${originalData.status}">${formatStatusText(originalData.status)}</span>`;
    cells[2].textContent = originalData.date;
    cells[3].textContent = capitalize(originalData.priority);
    cells[4].textContent = originalData.assignedTo || 'Unassigned';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => {
      row.remove();
      const index = taskList.findIndex(t => t.id === parseInt(row.dataset.taskId));
      if (index !== -1) {
        taskList.splice(index, 1);
        saveTasksToLocalStorage();
      }
    });

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    editBtn.addEventListener('click', () => enterEditMode(row));

    cells[5].innerHTML = '';
    cells[6].innerHTML = '';
    cells[5].appendChild(deleteBtn);
    cells[6].appendChild(editBtn);

    cells[1].querySelector('.status').addEventListener('click', function () {
      toggleStatus(this);
      const task = taskList.find(t => t.id === parseInt(row.dataset.taskId));
      if (task) {
        task.status = this.getAttribute('data-status');
        saveTasksToLocalStorage();
      }
    });
  }
});

  function cancelEdit(row, originalData) {
    const cells = row.querySelectorAll('td');

    cells[0].textContent = originalData.name;
    cells[1].innerHTML = `<span class="status ${originalData.status}" data-status="${originalData.status}">${formatStatusText(originalData.status)}</span>`;
    cells[2].textContent = originalData.date;
    cells[3].textContent = capitalize(originalData.priority);
    cells[4].textContent = originalData.assignedTo || 'Unassigned';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => row.remove());

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');
    editBtn.addEventListener('click', () => enterEditMode(row));

    cells[5].innerHTML = '';
    cells[6].innerHTML = '';
    cells[5].appendChild(deleteBtn);
    cells[6].appendChild(editBtn);

    cells[1].querySelector('.status').addEventListener('click', function () {
      toggleStatus(this);
    });
  }

  function formatStatusText(status) {
    if (status === 'pending') return 'Pending';
    if (status === 'in-progress') return 'In Progress';
    if (status === 'completed') return 'Completed';
    return status;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function toggleStatus(statusSpan) {
    let currentStatus = statusSpan.getAttribute('data-status');
    if (currentStatus === 'pending') currentStatus = 'in-progress';
    else if (currentStatus === 'in-progress') currentStatus = 'completed';
    else currentStatus = 'pending';

    statusSpan.setAttribute('data-status', currentStatus);
    statusSpan.className = 'status ' + currentStatus;
    statusSpan.textContent = formatStatusText(currentStatus);
  }

  function saveTasksToLocalStorage() {
    localStorage.setItem('taskList', JSON.stringify(taskList));
    localStorage.setItem('taskIdCounter', taskIdCounter.toString());
  }

  function loadTasksFromLocalStorage() {
    const savedTasks = localStorage.getItem('taskList');
    const savedCounter = localStorage.getItem('taskIdCounter');

    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);
      tasks.forEach(task => {
        taskList.push(task);
        addTaskRow(task);
      });
    }

    if (savedCounter) {
      taskIdCounter = parseInt(savedCounter, 10);
    }
  }

  function createCollaboratorCard({ name, role, status }) {
    const card = document.createElement('div');
    card.className = 'collaborator-card';

    card.innerHTML = `
      <div class="collab-info">
        <h3>${name}</h3>
        <p>${role}</p>
        <span class="status ${status}">${capitalize(status)}</span>
      </div>
      <div class="collab-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Remove</button>
      </div>
    `;

    return card;
  }

  function attachCardEventListeners(card) {
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');

    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to remove this collaborator?')) {
        card.remove();
        saveCollaborators(); 
      }
    });

    editBtn.addEventListener('click', () => {
      enterEditMode(card);
    });
  }

  function enterEditMode(card) {
    const infoDiv = card.querySelector('.collab-info');
    const actionsDiv = card.querySelector('.collab-actions');

    const currentName = infoDiv.querySelector('h3').textContent;
    const currentRole = infoDiv.querySelector('p').textContent;
    const currentStatus = infoDiv.querySelector('span.status').classList.contains('active') ? 'active' : 'inactive';

    infoDiv.innerHTML = `
      <input type="text" class="edit-name" value="${currentName}" />
      <input type="text" class="edit-role" value="${currentRole}" />
      <select class="edit-status">
        <option value="active" ${currentStatus === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${currentStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
    `;

    actionsDiv.innerHTML = `
      <button class="save-btn">Save</button>
      <button class="cancel-btn">Cancel</button>
    `;

    actionsDiv.querySelector('.save-btn').addEventListener('click', () => {
      saveEdit(card);
    });

    actionsDiv.querySelector('.cancel-btn').addEventListener('click', () => {
      cancelEdit(card, currentName, currentRole, currentStatus);
    });
  }

  function saveEdit(card) {
  const infoDiv = card.querySelector('.collab-info');
  const actionsDiv = card.querySelector('.collab-actions');

  const newName = infoDiv.querySelector('.edit-name').value.trim();
  const newRole = infoDiv.querySelector('.edit-role').value.trim();
  const newStatus = infoDiv.querySelector('.edit-status').value;

  if (!newName || !newRole) {
    alert('Please fill in both name and role.');
    return;
  }

  infoDiv.innerHTML = `
    <h3>${newName}</h3>
    <p>${newRole}</p>
    <span class="status ${newStatus}">${capitalize(newStatus)}</span>
  `;

  actionsDiv.innerHTML = `
    <button class="edit-btn">Edit</button>
    <button class="delete-btn">Remove</button>
  `;

  attachCardEventListeners(card);

  saveCollaborators(); 
}

function cancelEdit(card, originalName, originalRole, originalStatus) {
  const infoDiv = card.querySelector('.collab-info');
  const actionsDiv = card.querySelector('.collab-actions');

  infoDiv.innerHTML = `
    <h3>${originalName}</h3>
    <p>${originalRole}</p>
    <span class="status ${originalStatus}">${capitalize(originalStatus)}</span>
  `;

  actionsDiv.innerHTML = `
    <button class="edit-btn">Edit</button>
    <button class="delete-btn">Remove</button>
  `;

  attachCardEventListeners(card);
}

function saveCollaborators() {
  const collaborators = [];
  const cards = collaboratorsGrid.querySelectorAll('.collaborator-card');
  cards.forEach(card => {
    const name = card.querySelector('h3').textContent;
    const role = card.querySelector('p').textContent;
    const status = card.querySelector('span.status')?.classList.contains('active') ? 'active' : 'inactive';
    collaborators.push({ name, role, status });
  });
  localStorage.setItem('collaborators', JSON.stringify(collaborators));
}

function loadCollaborators() {
  const saved = localStorage.getItem('collaborators');
  if (!saved) return;

  collaboratorsGrid.innerHTML = ''; 

  const collaborators = JSON.parse(saved);
  collaborators.forEach(collab => {
    const card = createCollaboratorCard(collab);
    collaboratorsGrid.appendChild(card);
    attachCardEventListeners(card);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


let tasks = [];

let collaborators = []; 
const currentUser = "Me"; 

const taskAssignedToSelect = document.getElementById("taskAssignedTo");
const addTaskForm = document.getElementById("addTaskForm");
const taskTableBody = document.getElementById("taskTableBody");

const collabNameInput = document.getElementById("collabName");
const collabRoleInput = document.getElementById("collabRole");
const collabStatusSelect = document.getElementById("collabStatus");
const saveCollaboratorBtn = document.getElementById("saveCollaboratorBtn");
const addCollaboratorBtn = document.querySelector(".add-collaborator-btn");
const addCollaboratorForm = document.getElementById("addCollaboratorForm");
const cancelCollaboratorBtn = document.getElementById("cancelCollaboratorBtn");
const collaboratorsGrid = document.querySelector(".collaborators-grid");

let isEditingCollaborator = false;
let editingCollaboratorIndex = null;


function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function loadCollaboratorsFromStorage() {
  const saved = localStorage.getItem('collaborators');
  if (saved) {
    collaborators = JSON.parse(saved);
  }
}

function saveCollaboratorsToStorage() {
  localStorage.setItem('collaborators', JSON.stringify(collaborators));
}

function renderCollaborators() {
  collaboratorsGrid.innerHTML = collaborators.map((collab, index) => `
    <div class="collaborator-card" data-index="${index}">
      <div class="collab-info">
        <h3>${collab.name}</h3>
        <p>${collab.role}</p>
        <span class="status ${collab.status}">${capitalize(collab.status)}</span>
      </div>
      <div class="collab-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Remove</button>
      </div>
    </div>
  `).join('');
}

collaboratorsGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".collaborator-card");
  if (!card) return;

  const index = parseInt(card.dataset.index, 10);

  if (e.target.classList.contains("edit-btn")) {
    editCollaborator(index);
  } else if (e.target.classList.contains("delete-btn")) {
    deleteCollaborator(index);
  }
});

function editCollaborator(index) {
  const collab = collaborators[index];
  if (!collab) return;

  collabNameInput.value = collab.name;
  collabRoleInput.value = collab.role;
  collabStatusSelect.value = collab.status;

  addCollaboratorForm.style.display = "block";
  saveCollaboratorBtn.textContent = "Update";

  isEditingCollaborator = true;
  editingCollaboratorIndex = index;
}

function deleteCollaborator(index) {
  if (confirm("Are you sure you want to remove this collaborator?")) {
    collaborators.splice(index, 1);
    saveCollaboratorsToStorage();      
    renderCollaborators();
    updateAssignToDropdown();

    if (isEditingCollaborator && editingCollaboratorIndex === index) {
      cancelCollaboratorBtn.click();
    }
  }
}

function handleSaveCollaborator() {
  const name = collabNameInput.value.trim();
  const role = collabRoleInput.value.trim();
  const status = collabStatusSelect.value;

  if (!name || !role) {
    alert("Please enter valid collaborator name and role.");
    return;
  }

  if (isEditingCollaborator) {
    collaborators[editingCollaboratorIndex] = { name, role, status };
    isEditingCollaborator = false;
    editingCollaboratorIndex = null;
    saveCollaboratorBtn.textContent = "Save";
  } else {
    collaborators.push({ name, role, status });
  }

  saveCollaboratorsToStorage();  

  renderCollaborators();
  updateAssignToDropdown();

  addCollaboratorForm.style.display = "none";
  collabNameInput.value = "";
  collabRoleInput.value = "";
  collabStatusSelect.value = "active";
}

saveCollaboratorBtn.addEventListener("click", handleSaveCollaborator);

addCollaboratorBtn.addEventListener("click", () => {
  addCollaboratorForm.style.display = "block";
  saveCollaboratorBtn.textContent = "Save";
  isEditingCollaborator = false;
  editingCollaboratorIndex = null;
  collabNameInput.value = "";
  collabRoleInput.value = "";
  collabStatusSelect.value = "active";
});

cancelCollaboratorBtn.addEventListener("click", () => {
  addCollaboratorForm.style.display = "none";
  collabNameInput.value = "";
  collabRoleInput.value = "";
  collabStatusSelect.value = "active";
  isEditingCollaborator = false;
  editingCollaboratorIndex = null;
});

function updateAssignToDropdown() {
  taskAssignedToSelect.innerHTML = '<option value="" disabled selected>Assign to (optional)</option>';
  collaborators.forEach(collab => {
    if (collab.name !== currentUser) {
      const option = document.createElement("option");
      option.value = collab.name;
      option.textContent = collab.name;
      taskAssignedToSelect.appendChild(option);
    }
  });
}


function renderTasks() {

}

function addTaskSubmitHandler(e) {
  e.preventDefault();
  const name = document.getElementById("taskName").value.trim();
  const status = document.getElementById("taskStatus").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const priority = document.getElementById("taskPriority").value;
  let assignedTo = taskAssignedToSelect.value;

  if (!assignedTo) {
    assignedTo = currentUser;
  }

  if (name && dueDate) {
    tasks.push({ name, status, dueDate, priority, assignedTo });
    renderTasks();

    addTaskForm.reset();
    taskAssignedToSelect.selectedIndex = 0;
  } else {
    alert("Please fill in required fields.");
  }
}

addTaskForm.addEventListener("submit", addTaskSubmitHandler);

taskTableBody.addEventListener("click", (e) => {
  const index = e.target.dataset.index;

  if (e.target.classList.contains("delete-task-btn")) {
    tasks.splice(index, 1);
    renderTasks();
  }

  if (e.target.classList.contains("edit-task-btn")) {
    editTask(index);
  }
});

let editingTaskIndex = null;

function updateTaskHandler(e) {
  e.preventDefault();

  const updatedName = document.getElementById("taskName").value.trim();
  const updatedStatus = document.getElementById("taskStatus").value;
  const updatedDueDate = document.getElementById("taskDueDate").value;
  const updatedPriority = document.getElementById("taskPriority").value;
  const updatedAssignedTo = taskAssignedToSelect.value || currentUser;

  if (!updatedName || !updatedDueDate) {
    alert("Please fill in required fields.");
    return;
  }

  tasks[editingTaskIndex] = {
    name: updatedName,
    status: updatedStatus,
    dueDate: updatedDueDate,
    priority: updatedPriority,
    assignedTo: updatedAssignedTo
  };

  renderTasks();
  addTaskForm.reset();
  updateAssignToDropdown();

  addTaskForm.removeEventListener("submit", updateTaskHandler);
  addTaskForm.addEventListener("submit", addTaskSubmitHandler);

  editingTaskIndex = null;
}

function editTask(index) {
  editingTaskIndex = index;
  const task = tasks[index];

  document.getElementById("taskName").value = task.name;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskDueDate").value = task.dueDate;
  document.getElementById("taskPriority").value = task.priority;
  taskAssignedToSelect.value = task.assignedTo;

  addTaskForm.removeEventListener("submit", addTaskSubmitHandler);
  addTaskForm.addEventListener("submit", updateTaskHandler);
}

loadCollaboratorsFromStorage();
renderCollaborators();
updateAssignToDropdown();
renderTasks();
