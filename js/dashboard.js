

document.addEventListener("DOMContentLoaded", async function () {
  let taskIdCounter = 0;
  let tasks = [];
  let collaborators = [];

  const userEmail = localStorage.getItem('userEmail') || '';
  const currentUser = userEmail.split('@')[0];

  const form = document.getElementById('addTaskForm');
  const personalTaskTableBody = document.getElementById('personalTaskTableBody');
  const otherTaskTableBody = document.getElementById('otherTaskTableBody');

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
    mainContent.scrollTo({ top: tasksSection.offsetTop, behavior: 'smooth' });
  });

  document.querySelector('.sidebar a[href="#top"]').addEventListener('click', function (e) {
    e.preventDefault();
    const topSection = document.querySelector('#top');
    mainContent.scrollTo({ top: topSection.offsetTop, behavior: 'smooth' });
  });

  await fetchCollaborators();
  loadTasksFromLocalStorage();

  async function fetchCollaborators() {
    try {
      const res = await fetch('http://localhost:5000/api/collaborators');
      if (!res.ok) throw new Error('Failed to fetch collaborators');
      collaborators = await res.json();
      populateCollaboratorsDropdown();
    } catch (err) {
      console.error(err);
      collaborators = [];
    }
  }

  function populateCollaboratorsDropdown() {
    const select = document.getElementById('taskAssignedTo');
    select.innerHTML = '<option value="" disabled selected>Select collaborator</option>';
    collaborators.forEach(user => {
      const option = document.createElement('option');
      option.value = user._id;
      option.textContent = user.email.split('@')[0];
      select.appendChild(option);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('taskName').value.trim();
    const date = document.getElementById('taskDueDate').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value.toLowerCase();
    const assignedTo = document.getElementById('taskAssignedTo').value;
    const comment = document.getElementById('taskComments')?.value.trim() || "";

    if (!name || !date || !assignedTo) {
      alert('Please fill in all fields');
      return;
    }

    const taskId = ++taskIdCounter;
    const task = { id: taskId, name, date, status, priority, assignedTo, comment };
    tasks.push(task);
    saveTasksToLocalStorage();
    renderTaskTable();
    updateDashboardStats();
    form.reset();
  });

  function formatUserName(userId) {
    if (!userId) return "Unassigned";
    const user = collaborators.find(u => u._id === userId);
    return user ? user.email.split('@')[0] : "Unknown";
  }

  function loadTasksFromLocalStorage() {
    const saved = JSON.parse(localStorage.getItem('tasks') || '[]');
    saved.forEach(t => {
      tasks.push(t);
      if (t.id > taskIdCounter) taskIdCounter = t.id;
    });
    renderTaskTable();
    updateDashboardStats();
  }

  function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
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

  function renderTaskTable() {
    personalTaskTableBody.innerHTML = '';
    otherTaskTableBody.innerHTML = '';

    tasks.forEach(task => {
      if (formatUserName(task.assignedTo) === currentUser) {
        addTaskRow(task, personalTaskTableBody);
      } else {
        addTaskRow(task, otherTaskTableBody);
      }
    });
  }

  function toggleStatus(element) {
    const current = element.getAttribute('data-status');
    const next = current === 'pending' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'pending';
    element.setAttribute('data-status', next);
    element.className = 'status ' + next;
    element.textContent = formatStatusText(next);
  }

  function addTaskRow(task, tableBody) {
    const row = document.createElement('tr');
    row.dataset.taskId = task.id;

    row.innerHTML = `
      <td>${task.name}</td>
      <td><span class="status ${task.status}" data-status="${task.status}">${formatStatusText(task.status)}</span></td>
      <td>${task.date}</td>
      <td>${capitalize(task.priority)}</td>
      <td>${formatUserName(task.assignedTo)}</td>
      <td><button class="delete-btn">Delete</button></td>
      <td><button class="edit-btn">Edit</button></td>
    `;

    const commentCell = createCommentToggleCell(task.comment);
    row.appendChild(commentCell);

    row.querySelector('.status').addEventListener('click', function () {
      toggleStatus(this);
      const t = tasks.find(t => t.id === task.id);
      if (t) {
        t.status = this.getAttribute('data-status');
        saveTasksToLocalStorage();
        updateDashboardStats();
      }
    });

    row.querySelector('.delete-btn').addEventListener('click', () => {
      const i = tasks.findIndex(t => t.id === task.id);
      if (i !== -1) {
        tasks.splice(i, 1);
        saveTasksToLocalStorage();
        renderTaskTable();
        updateDashboardStats();
      }
    });

    row.querySelector('.edit-btn').addEventListener('click', () => enterEditMode(row));

    tableBody.appendChild(row);
  }

  function createCommentToggleCell(commentText) {
    const td = document.createElement("td");

    const btn = document.createElement("button");
    btn.textContent = "View";
    btn.classList.add("view-comments-btn");

    const commentBox = document.createElement("div");
    commentBox.textContent = commentText || "No comments.";
    commentBox.className = "comment-text";

    btn.addEventListener("click", () => {
      const isVisible = commentBox.style.display === "block";
      commentBox.style.display = isVisible ? "none" : "block";
      btn.textContent = isVisible ? "View" : "Hide";
    });

    td.appendChild(btn);
    td.appendChild(commentBox);
    return td;
  }

  function updateDashboardStats() {
    const allTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    const currentUser = (localStorage.getItem('userEmail') || '').split('@')[0];

    let total = 0, completed = 0, dueToday = 0, overdue = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allTasks.forEach(task => {
      const assignedUser = collaborators.find(c => c._id === task.assignedTo);
      const assignedName = assignedUser ? assignedUser.email.split("@")[0] : "Unassigned";

      if (assignedName === currentUser) {
        total++;
        const taskDate = new Date(task.dueDate || task.date);
        taskDate.setHours(0, 0, 0, 0);
        if (task.status === "completed") completed++;
        if (taskDate.getTime() === today.getTime()) dueToday++;
        if (taskDate < today && task.status !== "completed") overdue++;
      }
    });

    document.querySelector('.card.total p').textContent = total;
    document.querySelector('.card.completed p').textContent = completed;
    document.querySelector('.card.today p').textContent = dueToday;
    document.querySelector('.card.overdue p').textContent = overdue;
  }
});




let collaborators = [];
let allUsers = [];

const taskAssignedToSelect = document.getElementById("taskAssignedTo");
const addUserSelect = document.getElementById("collaboratorSelect");
const addTaskForm = document.getElementById("addTaskForm");
const taskTableBody = document.getElementById("taskTableBody");
const addCollaboratorBtn = document.getElementById("addSelectedCollaboratorBtn");
const collaboratorsGrid = document.getElementById("collaboratorsGrid");

document.addEventListener("DOMContentLoaded", async () => {
  await loadCollaboratorsFromDB();
  await loadAllUsersFromDB();

  const userEmail = localStorage.getItem("userEmail") || "";
  const username = userEmail.split("@")[0];
  const welcomeHeader = document.querySelector(".dashboard-welcome h2");
  if (welcomeHeader) welcomeHeader.textContent = `Welcome back, ${username} 👋`;
});


async function loadAllUsersFromDB() {
  try {
    const res = await fetch("http://localhost:5000/api/users");
    allUsers = await res.json();
    updateAddUserDropdown();
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

async function loadCollaboratorsFromDB() {
  const stored = localStorage.getItem("collaborators");
  if (stored) {
    collaborators = JSON.parse(stored);
    showCollaboratorsGrid();
    updateTaskAssignedDropdown();
  } else {
    try {
      const res = await fetch("http://localhost:5000/api/collaborators");
      collaborators = await res.json();
      showCollaboratorsGrid();
      updateTaskAssignedDropdown();
      saveCollaboratorsToStorage();
    } catch (err) {
      console.error("Error loading collaborators:", err);
    }
  }
}


function updateTaskAssignedDropdown() {
  if (!taskAssignedToSelect) return;
  taskAssignedToSelect.innerHTML = `<option value="" disabled selected>Select collaborator</option>`;
  collaborators.forEach(c => {
    const name = c.email.split("@")[0];
    taskAssignedToSelect.innerHTML += `<option value="${c._id}">${name}</option>`;
  });
}

function updateAddUserDropdown() {
  addUserSelect.innerHTML = `<option value="" disabled selected>Select user</option>`;
  allUsers
    .filter(u => !collaborators.some(c => c.email === u.email))
    .forEach(u => {
      const name = u.email.split("@")[0];
      addUserSelect.innerHTML += `<option value="${u._id}">${name}</option>`;
    });
}


function showCollaboratorsGrid() {
  collaboratorsGrid.innerHTML = "";
  collaborators.forEach(c => {
    const name = c.email.split("@")[0];
    collaboratorsGrid.innerHTML += `
      <div class="collaborator-card">
        <div class="collab-info">
          <h3>${name}</h3>
          <p class="role-display">${c.role || "No role"}</p>
        </div>
        <div class="collab-actions">
          <button class="edit-role-btn" data-id="${c._id}">Edit Role</button>
          <button class="delete-collab-btn" data-id="${c._id}">Delete</button>
        </div>
      </div>`;
  });
  document.querySelectorAll(".delete-collab-btn")
    .forEach(b => b.addEventListener("click", () => deleteCollaborator(b.dataset.id)));
  document.querySelectorAll(".edit-role-btn")
    .forEach(b => b.addEventListener("click", handleEditRoleClick));
}

addCollaboratorBtn.addEventListener("click", () => {
  const selectedId = addUserSelect.value;
  if (!selectedId) return alert("Select a user first!");
  const user = allUsers.find(u => u._id === selectedId);
  if (!user) return alert("User not found!");

  fetch("http://localhost:5000/api/collaborators", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email })
  })
    .then(r => r.json())
    .then(newC => {
      collaborators.push(newC);
      showCollaboratorsGrid();
      updateTaskAssignedDropdown();
      updateAddUserDropdown();
      saveCollaboratorsToStorage();
    })
    .catch(err => console.error("Add collaborator error:", err));
});

async function deleteCollaborator(id) {
  try {
    await fetch(`http://localhost:5000/api/collaborators/${id}`, { method: "DELETE" });
    collaborators = collaborators.filter(c => c._id !== id);
    showCollaboratorsGrid();
    updateTaskAssignedDropdown();
    updateAddUserDropdown();
    saveCollaboratorsToStorage();
  } catch (err) {
    console.error("Delete collaborator error:", err);
  }
}
function saveCollaboratorsToStorage() {
  localStorage.setItem("collaborators", JSON.stringify(collaborators));
}



function loadTasksFromStorage() {
  tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  renderTaskTable();
}

function saveTasksToStorage() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTaskTable() {
  taskTableBody.innerHTML = "";
  tasks.forEach((task, i) => {
    const c = collaborators.find(c => c._id === task.assignedTo);
    const name = c ? c.email.split("@")[0] : "Unassigned";
    taskTableBody.innerHTML += `
      <tr>
        <td>${task.name}</td><td>${task.status}</td><td>${task.dueDate}</td>
        <td>${task.priority}</td><td>${name}</td>
        <td><button onclick="deleteTask(${i})">🗑️</button></td>
        <td><button onclick="editTask(${i})">✏️</button></td>
      </tr>`;
  });
}

async function deleteTask(index) {
  const task = tasks[index];
  if (!task || !task._id) {
    alert("Task ID missing");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to delete task');
    }

    tasks.splice(index, 1);
    saveTasksToStorage();
    renderTaskTable();
    updateDashboardStats();

    alert("Task deleted successfully!");
  } catch (err) {
    alert("Error deleting task: " + err.message);
    console.error(err);
  }
}



function editTask(index) {
  const task = tasks[index];
  document.getElementById("taskName").value = task.name;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskDueDate").value = task.dueDate;
  document.getElementById("taskPriority").value = task.priority;
  taskAssignedToSelect.value = task.assignedTo;
  tasks.splice(index, 1);
  saveTasksToStorage();
  renderTaskTable();
}

addTaskForm.addEventListener("submit", e => {
  e.preventDefault();
  const t = {
    name: document.getElementById("taskName").value.trim(),
    status: document.getElementById("taskStatus").value,
    dueDate: document.getElementById("taskDueDate").value,
    priority: document.getElementById("taskPriority").value,
    assignedTo: taskAssignedToSelect.value
  };
  if (!t.name || !t.dueDate) return alert("Fill all fields");
  tasks.push(t);
  saveTasksToStorage();
  renderTaskTable();
  addTaskForm.reset();
});


document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
  window.location.href = 'http://localhost:5000/auth/google';
});

function handleEditRoleClick(e) {
  const btn = e.target;
  const card = btn.closest(".collaborator-card");
  const collabId = btn.getAttribute("data-id");


  const roleDisplay = card.querySelector(".role-display");
  const currentRole = roleDisplay.textContent;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "role-input";
  input.value = currentRole === "No role" ? "" : currentRole;

  roleDisplay.replaceWith(input);

  btn.textContent = "Save";
  btn.removeEventListener("click", handleEditRoleClick);
  btn.addEventListener("click", () => saveRole(collabId, input.value, card, btn));
}

async function saveRole(collabId, newRole, card, saveBtn) {
  try {
    const collab = collaborators.find(c => c._id === collabId);
    if (collab) {
      collab.role = newRole;
      saveCollaboratorsToStorage(); 
    }

    const input = card.querySelector("input.role-input");
    const roleDisplay = document.createElement("p");
    roleDisplay.className = "role-display";
    roleDisplay.textContent = newRole || "No role";
    input.replaceWith(roleDisplay);

    saveBtn.textContent = "Edit Role";
    saveBtn.removeEventListener("click", saveRole);
    saveBtn.addEventListener("click", handleEditRoleClick);
  } catch (err) {
    console.error("Error saving role:", err);
  }
}


function cancelEditRole(card, oldRole, saveBtn, cancelBtn) {
  const roleSelect = card.querySelector("select");
  const roleDisplay = document.createElement("p");
  roleDisplay.className = "role-display";
  roleDisplay.textContent = oldRole;

  roleSelect.replaceWith(roleDisplay);

  saveBtn.textContent = "Edit Role";
  saveBtn.removeEventListener("click", () => saveRole);
  saveBtn.addEventListener("click", handleEditRoleClick);

  cancelBtn.remove();
}

function saveCollaboratorsToStorage() {
  localStorage.setItem("collaborators", JSON.stringify(collaborators));
}

function loadCollaboratorsFromStorage() {
  const stored = localStorage.getItem("collaborators");
  if (stored) {
    collaborators = JSON.parse(stored);
  }
}

addTaskForm.addEventListener("submit", async e => {
  e.preventDefault();

  const t = {
    title: document.getElementById("taskName").value.trim(),  
    status: document.getElementById("taskStatus").value,
    dueDate: document.getElementById("taskDueDate").value,
    priority: document.getElementById("taskPriority").value,
    assignedTo: taskAssignedToSelect.value
  };

  if (!t.title || !t.dueDate || !t.assignedTo) {
    return alert("Please fill in all required fields");
  }

  try {
    const res = await fetch("http://localhost:5000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to add task");
    }

    const newTask = await res.json();

    alert("Task added successfully!");
    
    tasks.push({
      id: newTask._id,   
      name: newTask.title,
      status: newTask.status,
      dueDate: newTask.dueDate.slice(0,10),  
      priority: newTask.priority,
      assignedTo: newTask.assignedTo
    });

    saveTasksToStorage();
    renderTaskTable();
    addTaskForm.reset();

  } catch (err) {
    alert("Error adding task: " + err.message);
    console.error(err);
  }
});
function createCommentToggleCell(commentText) {
  const td = document.createElement("td");

  const btn = document.createElement("button");
  btn.textContent = "View";
  btn.classList.add("view-comments-btn");

  const commentBox = document.createElement("div");
  commentBox.textContent = commentText || "No comments.";
  commentBox.className = "comment-text";

  btn.addEventListener("click", () => {
    const isVisible = commentBox.style.display === "block";
    commentBox.style.display = isVisible ? "none" : "block";
    btn.textContent = isVisible ? "View" : "Hide";
  });

  td.appendChild(btn);
  td.appendChild(commentBox);
  return td;
}
