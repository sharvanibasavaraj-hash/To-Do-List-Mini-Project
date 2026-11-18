
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

const titleInput = document.getElementById("taskTitle");
const descriptionInput = document.getElementById("taskDescription");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");
const categoryInput = document.getElementById("category");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const categoryFilter = document.getElementById("categoryFilter");

const submitBtn = document.getElementById("submitBtn");
const cancelEdit = document.getElementById("cancelEdit");
const formHeading = document.getElementById("formHeading");

let editingId = null;
let toastTimer;

document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function isOverdue(task) {
    if (!task.due_date || task.status === "Completed") {
        return false;
    }

    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    return task.due_date < localToday;
}

function formatDate(date) {
    if (!date) return "No deadline";

    const parts = date.split("-");
    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

async function loadTasks() {
    try {
        taskList.innerHTML = '<p class="loading">Loading tasks...</p>';

        const params = new URLSearchParams();

        if (searchInput.value.trim()) {
            params.set("search", searchInput.value.trim());
        }

        if (statusFilter.value) {
            params.set("status", statusFilter.value);
        }

        if (priorityFilter.value) {
            params.set("priority", priorityFilter.value);
        }

        if (categoryFilter.value) {
            params.set("category", categoryFilter.value);
        }

        const tasks = await request(`/api/tasks?${params.toString()}`);

        document.getElementById("visibleCount").textContent =
            `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;

        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <h3>No tasks found</h3>
                    <p>Add a task or change your filters.</p>
                </div>
            `;
        } else {
            taskList.innerHTML = tasks.map(task => `
                <article class="task-card ${task.status === "Completed" ? "completed" : ""}">
                    <div class="task-top">
                        <div>
                            <h3 class="task-title">${escapeHTML(task.title)}</h3>
                            ${task.description ? `
                                <p class="task-description">${escapeHTML(task.description)}</p>
                            ` : ""}
                        </div>
                    </div>

                    <div class="task-badges">
                        <span class="badge priority-${escapeHTML(task.priority)}">
                            ${escapeHTML(task.priority)} Priority
                        </span>

                        <span class="badge">${escapeHTML(task.category)}</span>

                        <span class="badge">
                            ${escapeHTML(formatDate(task.due_date))}
                        </span>

                        ${isOverdue(task) ? `
                            <span class="badge overdue-badge">Overdue</span>
                        ` : ""}
                    </div>

                    <div class="task-bottom">
                        <select aria-label="Task status"
                            onchange="changeStatus(${task.id}, this.value)">
                            <option value="Pending" ${task.status === "Pending" ? "selected" : ""}>Pending</option>
                            <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
                            <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Completed</option>
                        </select>

                        <div class="task-actions">
                            <button class="action-btn"
                                onclick="editTask(${task.id})">Edit</button>
                            <button class="action-btn delete-btn"
                                onclick="deleteTask(${task.id})">Delete</button>
                        </div>
                    </div>
                </article>
            `).join("");
        }

        await loadStats();

    } catch (error) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>Could not load tasks</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}

async function loadStats() {
    const stats = await request("/api/stats");

    const total = Number(stats.total) || 0;
    const pending = Number(stats.pending) || 0;
    const inProgress = Number(stats.inProgress) || 0;
    const completed = Number(stats.completed) || 0;
    const overdue = Number(stats.overdue) || 0;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("progressCount").textContent = inProgress;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("overdueCount").textContent = overdue;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("progressPercent").textContent =
        `${percentage}%`;

    document.getElementById("progressBar").style.width =
        `${percentage}%`;
}

// Add or save edited task
taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    const task = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        due_date: dueDateInput.value || null,
        priority: priorityInput.value,
        category: categoryInput.value
    };

    if (!task.title) {
        showToast("Please enter a task title.");
        return;
    }

    try {
        if (editingId !== null) {
            const currentTasks = await request("/api/tasks");
            const existingTask = currentTasks.find(
                item => item.id === editingId
            );

            if (!existingTask) {
                throw new Error("Task not found.");
            }

            await request(`/api/tasks/${editingId}`, {
                method: "PUT",
                body: JSON.stringify({
                    ...task,
                    status: existingTask.status
                })
            });

            showToast("Task updated successfully.");
        } else {
            await request("/api/tasks", {
                method: "POST",
                body: JSON.stringify(task)
            });

            showToast("Task added successfully.");
        }

        resetForm();
        await loadTasks();

    } catch (error) {
        showToast(error.message);
    }
});

// Load a task into the form for editing
async function editTask(id) {
    try {
        const tasks = await request("/api/tasks");
        const task = tasks.find(item => item.id === id);

        if (!task) {
            showToast("Task not found.");
            return;
        }

        editingId = id;

        titleInput.value = task.title;
        descriptionInput.value = task.description || "";
        dueDateInput.value = task.due_date || "";
        priorityInput.value = task.priority;
        categoryInput.value = task.category;

        formHeading.textContent = "Edit task";
        submitBtn.textContent = "Save Changes";
        cancelEdit.classList.remove("hidden");

        document.querySelector(".form-panel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        titleInput.focus();

    } catch (error) {
        showToast(error.message);
    }
}

// Change task status
async function changeStatus(id, status) {
    try {
        await request(`/api/tasks/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        showToast("Task status updated.");
        await loadTasks();

    } catch (error) {
        showToast(error.message);
        await loadTasks();
    }
}

// Delete task
async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {
        await request(`/api/tasks/${id}`, {
            method: "DELETE"
        });

        if (editingId === id) {
            resetForm();
        }

        showToast("Task deleted.");
        await loadTasks();

    } catch (error) {
        showToast(error.message);
    }
}

// Reset the form
function resetForm() {
    taskForm.reset();
    editingId = null;

    formHeading.textContent = "Create a task";
    submitBtn.textContent = "+ Add Task";
    cancelEdit.classList.add("hidden");
}

cancelEdit.addEventListener("click", resetForm);

// Search and filters
let searchTimer;

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadTasks, 250);
});

statusFilter.addEventListener("change", loadTasks);
priorityFilter.addEventListener("change", loadTasks);
categoryFilter.addEventListener("change", loadTasks);

// Initial loading
loadTasks().catch(error => showToast(error.message));
