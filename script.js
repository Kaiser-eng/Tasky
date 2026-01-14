        class TaskManager {
            constructor() {
                this.tasks = this.loadTasks();
                this.categories = this.loadCategories();
                this.currentEditId = null;
                this.viewMode = 'board';
                this.filters = {
                    priority: [],
                    category: []
                };
                this.sortBy = null;
                this.initializeDefaultCategories();
            }

            initializeDefaultCategories() {
                if (this.categories.length === 0) {
                    this.categories = ['UX Design', 'Development', 'Marketing', 'Design', 'Backend', 'Frontend', 'Testing'];
                    this.saveCategories();
                }
            }

            loadCategories() {
                const stored = localStorage.getItem('tasky_categories');
                return stored ? JSON.parse(stored) : [];
            }

            saveCategories() {
                localStorage.setItem('tasky_categories', JSON.stringify(this.categories));
            }

            addCategory(name) {
                if (!name || this.categories.includes(name)) return false;
                this.categories.push(name);
                this.saveCategories();
                return true;
            }

            deleteCategory(name) {
                const hasTasksWithCategory = this.tasks.some(t => t.category === name);
                if (hasTasksWithCategory) {
                    alert('No se puede eliminar esta materia porque hay tareas asociadas a ella.');
                    return false;
                }
                this.categories = this.categories.filter(c => c !== name);
                this.saveCategories();
                return true;
            }

            loadTasks() {
                const stored = localStorage.getItem('tasky_tasks');
                return stored ? JSON.parse(stored) : [];
            }

            saveTasks() {
                localStorage.setItem('tasky_tasks', JSON.stringify(this.tasks));
            }

            addTask(task) {
                task.id = Date.now().toString();
                task.createdAt = new Date().toISOString();
                task.status = 'progress';
                this.tasks.push(task);
                this.saveTasks();
                return task;
            }

            updateTask(id, updates) {
                const index = this.tasks.findIndex(t => t.id === id);
                if (index !== -1) {
                    this.tasks[index] = { ...this.tasks[index], ...updates };
                    this.saveTasks();
                    return this.tasks[index];
                }
                return null;
            }

            deleteTask(id) {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.saveTasks();
            }

            getTasksByStatus(status) {
                let tasks = this.tasks.filter(t => t.status === status);
                
                if (this.filters.priority.length > 0) {
                    tasks = tasks.filter(t => this.filters.priority.includes(t.priority));
                }
                if (this.filters.category.length > 0) {
                    tasks = tasks.filter(t => this.filters.category.includes(t.category));
                }

                if (this.sortBy) {
                    tasks = this.sortTasks(tasks, this.sortBy);
                }

                return tasks;
            }

            sortTasks(tasks, sortBy) {
                const sorted = [...tasks];
                switch(sortBy) {
                    case 'date':
                        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
                    case 'priority':
                        const priorityOrder = { high: 3, medium: 2, low: 1 };
                        return sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                    case 'category':
                        return sorted.sort((a, b) => a.category.localeCompare(b.category));
                    case 'title':
                        return sorted.sort((a, b) => a.title.localeCompare(b.title));
                    default:
                        return sorted;
                }
            }

            searchTasks(query) {
                const q = query.toLowerCase();
                return this.tasks.filter(t => 
                    t.title.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    t.category.toLowerCase().includes(q)
                );
            }

            getAllCategories() {
                return this.categories;
            }
        }

        const taskManager = new TaskManager();

        function renderBoards() {
            const container = document.getElementById('boardsContainer');
            const statuses = [
                { id: 'progress', title: 'In Progress', icon: 'fa-spinner' },
                { id: 'completed', title: 'Completed Task', icon: 'fa-check-circle' },
                { id: 'overdue', title: 'Over-Due', icon: 'fa-exclamation-triangle' }
            ];

            const isListView = taskManager.viewMode === 'list';
            if (isListView) {
                container.classList.add('list-view');
            } else {
                container.classList.remove('list-view');
            }

            container.innerHTML = statuses.map(status => {
                const tasks = taskManager.getTasksByStatus(status.id);
                return `
                    <div class="board">
                        <div class="board-header">
                            <span class="board-title">
                                <i class="fas ${status.icon}"></i>
                                ${status.title}
                            </span>
                            <div class="board-header-right">
                                <span class="task-count">(${tasks.length})</span>
                                <button class="icon-btn">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                            </div>
                        </div>
                        <div class="board-tasks">
                            ${tasks.length > 0 ? tasks.map(task => renderTaskCard(task, isListView)).join('') : 
                            '<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay tareas aquí</p></div>'}
                        </div>
                    </div>
                `;
            }).join('');

            updateCategoryFilters();
        }

        function renderTaskCard(task, isListView = false) {
            const priorityClass = `priority-${task.priority}`;
            const priorityText = task.priority === 'high' ? 'High' : 
                                task.priority === 'medium' ? 'Medium' : 'Low';
            const priorityIcon = task.priority === 'high' ? 'fa-exclamation-circle' :
                                task.priority === 'medium' ? 'fa-exclamation-triangle' : 'fa-info-circle';
            
            const cardClass = isListView ? 'task-card list-view' : 'task-card';
            
            return `
                <div class="${cardClass}" data-task-id="${task.id}">
                    <div class="task-header">
                        <span class="badge ${priorityClass}">
                            <i class="fas ${priorityIcon}"></i>
                            ${priorityText}
                        </span>
                        <span class="badge time-badge">
                            <i class="far fa-clock"></i>
                            ${task.time || '6:00 PM'}
                        </span>
                        <span class="badge category-badge">
                            <i class="fas fa-tag"></i>
                            ${task.category}
                        </span>
                    </div>
                    <h3 class="task-title">${task.title}</h3>
                    <p class="task-description" id="desc-${task.id}">${task.description}</p>
                    <div class="task-meta">
                        <span><i class="fas fa-paperclip"></i> ${task.progress || '0/3'}</span>
                        <span><i class="far fa-calendar"></i> ${formatDate(task.date)}</span>
                    </div>
                    <div class="task-footer">
                        <div></div>
                        <div class="task-actions">
                            <button class="task-action-btn" onclick="viewTask('${task.id}')" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="task-action-btn" onclick="editTask('${task.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="task-action-btn delete" onclick="deleteTask('${task.id}')" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const options = { month: 'short', day: 'numeric' };
            return date.toLocaleDateString('es-ES', options);
        }

        function openModal(editMode = false) {
            const modal = document.getElementById('taskModal');
            const title = document.getElementById('modalTitle');
            const statusGroup = document.getElementById('statusGroup');
            
            title.innerHTML = editMode ? '<i class="fas fa-edit"></i> Editar Tarea' : '<i class="fas fa-plus"></i> Nueva Tarea';
            
            statusGroup.style.display = editMode ? 'block' : 'none';
            
            loadCategoryOptions();
            renderCategoriesList();
            
            modal.classList.add('active');
        }

        function closeModal() {
            const modal = document.getElementById('taskModal');
            modal.classList.remove('active');
            document.getElementById('taskForm').reset();
            document.getElementById('taskId').value = '';
            document.getElementById('taskTime').value = '18:00';
            hideCategoryInput();
            updateCharCounter();
            taskManager.currentEditId = null;
        }

        function editTask(id) {
            const task = taskManager.tasks.find(t => t.id === id);
            if (!task) return;

            taskManager.currentEditId = id;
            document.getElementById('taskId').value = id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            updateCharCounter();
            document.getElementById('taskDate').value = task.date;
            document.getElementById('taskTime').value = task.time || '18:00';
            
            loadCategoryOptions();
            document.getElementById('taskCategory').value = task.category;
            
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;

            openModal(true);
        }

        function viewTask(id) {
            const task = taskManager.tasks.find(t => t.id === id);
            if (!task) return;

            const priorityClass = `priority-${task.priority}`;
            const priorityText = task.priority === 'high' ? 'Alta' : 
                                task.priority === 'medium' ? 'Media' : 'Baja';
            const priorityIcon = task.priority === 'high' ? 'fa-exclamation-circle' :
                                task.priority === 'medium' ? 'fa-exclamation-triangle' : 'fa-info-circle';

            const statusLabels = {
                'progress': 'En Progreso',
                'completed': 'Completada',
                'overdue': 'Atrasada'
            };

            const statusIcons = {
                'progress': 'fa-spinner',
                'completed': 'fa-check-circle',
                'overdue': 'fa-exclamation-triangle'
            };

            const content = document.getElementById('taskDetailContent');
            content.innerHTML = `
                <div class="task-detail-header">
                    <h3 class="task-detail-title">${task.title}</h3>
                    <div class="task-detail-badges">
                        <span class="badge ${priorityClass}">
                            <i class="fas ${priorityIcon}"></i>
                            Prioridad ${priorityText}
                        </span>
                        <span class="badge category-badge">
                            <i class="fas fa-tag"></i>
                            ${task.category}
                        </span>
                    </div>
                </div>

                <div class="task-detail-section">
                    <div class="task-detail-label">
                        <i class="fas fa-align-left"></i>
                        Descripción
                    </div>
                    <div class="task-detail-description">
                        <div class="task-detail-content">${task.description}</div>
                    </div>
                </div>

                <div class="task-detail-meta">
                    <div class="task-detail-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <div class="task-detail-meta-content">
                            <span class="task-detail-meta-label">Fecha de entrega</span>
                            <span class="task-detail-meta-value">${formatFullDate(task.date)}</span>
                        </div>
                    </div>
                    <div class="task-detail-meta-item">
                        <i class="fas fa-clock"></i>
                        <div class="task-detail-meta-content">
                            <span class="task-detail-meta-label">Hora</span>
                            <span class="task-detail-meta-value">${task.time || '6:00 PM'}</span>
                        </div>
                    </div>
                    <div class="task-detail-meta-item">
                        <i class="fas ${statusIcons[task.status]}"></i>
                        <div class="task-detail-meta-content">
                            <span class="task-detail-meta-label">Estado</span>
                            <span class="task-detail-meta-value">${statusLabels[task.status]}</span>
                        </div>
                    </div>
                    <div class="task-detail-meta-item">
                        <i class="fas fa-paperclip"></i>
                        <div class="task-detail-meta-content">
                            <span class="task-detail-meta-label">Progreso</span>
                            <span class="task-detail-meta-value">${task.progress || '0/3'}</span>
                        </div>
                    </div>
                </div>

                <div class="task-detail-actions">
                    <button class="btn btn-primary" onclick="closeDetailModal(); editTask('${task.id}')">
                        <i class="fas fa-edit"></i>
                        Editar Tarea
                    </button>
                    <button class="btn btn-secondary" onclick="closeDetailModal()">
                        <i class="fas fa-times"></i>
                        Cerrar
                    </button>
                </div>
            `;

            document.getElementById('taskDetailModal').classList.add('active');
        }

        function closeDetailModal() {
            document.getElementById('taskDetailModal').classList.remove('active');
        }

        function formatFullDate(dateString) {
            const date = new Date(dateString);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('es-ES', options);
        }

        function deleteTask(id) {
            if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
                taskManager.deleteTask(id);
                renderBoards();
            }
        }


        document.getElementById('taskForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const taskData = {
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDescription').value,
                date: document.getElementById('taskDate').value,
                time: document.getElementById('taskTime').value,
                category: document.getElementById('taskCategory').value,
                priority: document.getElementById('taskPriority').value,
                progress: '0/3'
            };

            const editId = document.getElementById('taskId').value;
            
            if (editId) {
                taskData.status = document.getElementById('taskStatus').value;
                taskManager.updateTask(editId, taskData);
            } else {
                taskManager.addTask(taskData);
            }

            closeModal();
            renderBoards();
        });

        document.getElementById('taskDescription').addEventListener('input', updateCharCounter);

        function updateCharCounter() {
            const textarea = document.getElementById('taskDescription');
            const counter = document.getElementById('charCounter');
            const current = textarea.value.length;
            const max = 500;
            
            counter.textContent = `${current} / ${max}`;
            
            if (current >= max) {
                counter.classList.add('error');
                counter.classList.remove('warning');
            } else if (current >= max * 0.8) {
                counter.classList.add('warning');
                counter.classList.remove('error');
            } else {
                counter.classList.remove('warning', 'error');
            }
        }

        function loadCategoryOptions() {
            const select = document.getElementById('taskCategory');
            const categories = taskManager.getAllCategories();
            
            select.innerHTML = '<option value="">Seleccionar o crear nueva...</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }

        function renderCategoriesList() {
            const container = document.getElementById('categoriesList');
            const categories = taskManager.getAllCategories();
            
            container.innerHTML = categories.map(cat => `
                <div class="category-item">
                    <i class="fas fa-tag"></i>
                    <span>${cat}</span>
                    <button type="button" onclick="deleteCategory('${cat}')" title="Eliminar materia">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }

        function showCategoryInput() {
            document.getElementById('newCategoryInput').style.display = 'block';
            document.getElementById('newCategoryName').focus();
        }

        function hideCategoryInput() {
            document.getElementById('newCategoryInput').style.display = 'none';
            document.getElementById('newCategoryName').value = '';
        }

        function addCategory() {
            const input = document.getElementById('newCategoryName');
            const name = input.value.trim();
            
            if (!name) {
                alert('Por favor ingresa un nombre para la materia');
                return;
            }
            
            if (taskManager.addCategory(name)) {
                loadCategoryOptions();
                renderCategoriesList();
                document.getElementById('taskCategory').value = name;
                hideCategoryInput();
            } else {
                alert('Esta materia ya existe');
            }
        }

        function deleteCategory(name) {
            if (confirm(`¿Estás seguro de que deseas eliminar la materia "${name}"?`)) {
                if (taskManager.deleteCategory(name)) {
                    loadCategoryOptions();
                    renderCategoriesList();
                    renderBoards();
                }
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            const newCategoryInput = document.getElementById('newCategoryName');
            if (newCategoryInput) {
                newCategoryInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addCategory();
                    }
                });
            }
        });

        document.getElementById('searchInput').addEventListener('input', function(e) {
            const query = e.target.value;
            if (query.trim() === '') {
                renderBoards();
            } else {
                const results = taskManager.searchTasks(query);
                renderSearchResults(results);
            }
        });

        function renderSearchResults(tasks) {
            const container = document.getElementById('boardsContainer');
            container.classList.remove('list-view');
            container.innerHTML = `
                <div class="board" style="grid-column: 1 / -1;">
                    <div class="board-header">
                        <span class="board-title">
                            <i class="fas fa-search"></i>
                            Resultados de búsqueda
                        </span>
                        <span class="task-count">(${tasks.length})</span>
                    </div>
                    <div class="board-tasks" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;">
                        ${tasks.length > 0 ? tasks.map(task => renderTaskCard(task)).join('') :
                        '<div class="empty-state"><i class="fas fa-inbox"></i><p>No se encontraron tareas</p></div>'}
                    </div>
                </div>
            `;
        }

        function togglePreview() {
            const btn = document.getElementById('previewBtn');
            taskManager.viewMode = taskManager.viewMode === 'board' ? 'list' : 'board';
            
            if (taskManager.viewMode === 'list') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            renderBoards();
        }

        function toggleSort() {
            const dropdown = document.getElementById('sortDropdown');
            dropdown.classList.toggle('active');
            
            document.getElementById('filterDropdown').classList.remove('active');
        }

        function sortTasks(sortBy) {
            taskManager.sortBy = sortBy;
            
            document.querySelectorAll('#sortDropdown .sort-option').forEach(opt => {
                opt.classList.remove('active');
            });
            event.target.closest('.sort-option').classList.add('active');
            
            renderBoards();
            document.getElementById('sortDropdown').classList.remove('active');
        }

        function toggleFilter() {
            const dropdown = document.getElementById('filterDropdown');
            dropdown.classList.toggle('active');
            
            document.getElementById('sortDropdown').classList.remove('active');
        }

        function updateCategoryFilters() {
            const categories = taskManager.getAllCategories();
            const container = document.getElementById('categoryFilters');
            
            container.innerHTML = categories.map(cat => `
                <div class="filter-option">
                    <input type="checkbox" id="filter-cat-${cat}" value="${cat}" onchange="applyFilters()">
                    <label for="filter-cat-${cat}">${cat}</label>
                </div>
            `).join('');
        }

        function applyFilters() {
            taskManager.filters.priority = [];
            ['high', 'medium', 'low'].forEach(priority => {
                const checkbox = document.getElementById(`filter-${priority}`);
                if (checkbox && checkbox.checked) {
                    taskManager.filters.priority.push(priority);
                }
            });

            taskManager.filters.category = [];
            taskManager.getAllCategories().forEach(cat => {
                const checkbox = document.getElementById(`filter-cat-${cat}`);
                if (checkbox && checkbox.checked) {
                    taskManager.filters.category.push(cat);
                }
            });

            const filterBtn = document.getElementById('filterBtn');
            const totalFilters = taskManager.filters.priority.length + taskManager.filters.category.length;
            if (totalFilters > 0) {
                filterBtn.classList.add('active');
            } else {
                filterBtn.classList.remove('active');
            }

            renderBoards();
        }

        function clearFilters() {
            document.querySelectorAll('#filterDropdown input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            
            taskManager.filters.priority = [];
            taskManager.filters.category = [];
            
            document.getElementById('filterBtn').classList.remove('active');
            
            renderBoards();
        }

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.filter-dropdown')) {
                document.getElementById('sortDropdown').classList.remove('active');
                document.getElementById('filterDropdown').classList.remove('active');
            }
        });

        renderBoards();