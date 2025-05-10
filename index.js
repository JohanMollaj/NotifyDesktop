// index.js with Firebase Integration
const { ipcRenderer } = require('electron');
const { addTask, deleteTask, getUserTasks, updateTask, toggleTaskStatus, 
        addNote, deleteNote, getUserNotes, updateNote } = require('./firebase-data');
const { logoutUser } = require('./auth-handler');

// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;

    // Task-related DOM elements
    var taskList = document.getElementById('taskList');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskDialog = document.getElementById('taskDialog');
    const closeDialog = document.getElementById('closeDialog');
    const cancelTask = document.getElementById('cancelTask');
    const saveTask = document.getElementById('saveTask');
    const taskForm = document.getElementById('taskForm');
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskCategory = document.getElementById('taskCategory');
    const dialogTitle = document.getElementById('dialogTitle');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Note-related DOM elements
    const notesList = document.getElementById('notesList');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const noteDialog = document.getElementById('noteDialog');
    const closeNoteDialogBtn = document.getElementById('closeNoteDialog');
    const cancelNote = document.getElementById('cancelNote');
    const saveNote = document.getElementById('saveNote');
    const noteForm = document.getElementById('noteForm');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const noteCategory = document.getElementById('noteCategory');
    const noteDialogTitle = document.getElementById('noteDialogTitle');

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');

    // Tab-related DOM elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Initial check for tasks
    if(taskList && taskList.childElementCount === 0){
        taskList.innerHTML = '<h4 class="empty-list">Loading tasks...</h4>';
    }

    // State variables
    let tasks = [];
    let notes = [];
    let filteredTasks = [];
    let filteredNotes = [];
    let currentFilter = 'all';
    let editingTaskId = null;
    let editingNoteId = null;

    // Initialize the app with user data
    function initializeWithUser(user) {
        const userInitializedEvent = new Event('userInitialized');
        window.dispatchEvent(userInitializedEvent);

        currentUser = user;
        console.log('App initialized with user:', user.uid);
        
        // Update UI with user info
        updateUserInfo(user);
        
        // Load data from Firebase
        loadTasks();
        loadNotes();
    }

    // Update user info in UI
    function updateUserInfo(user) {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        
        if (userName) userName.textContent = user.displayName || 'User';
        if (userEmail) userEmail.textContent = user.email || 'user@example.com';
        if (userAvatar) userAvatar.textContent = (user.displayName || 'U').charAt(0).toUpperCase();
    }

    // Initialize date picker with today's date and improve behavior
    if (taskDueDate) {
        const today = new Date().toISOString().split('T')[0];
        taskDueDate.value = today;
        
        // Add event listener for date input focus
        taskDueDate.addEventListener('click', function() {
            this.showPicker();
        });
    }

    function init() {
        console.log('Initializing app...');
        
        // Setup event listeners 
        setupEventListeners();

        // Listen for user data from main process
        ipcRenderer.on('user-data', (event, user) => {
            initializeWithUser(user);
        });
    }

    // Tab functionality
    function setupTabEvents() {
        if (!tabButtons || tabButtons.length === 0) return;
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                button.classList.add('active');
                
                // Show corresponding content
                const tabId = button.dataset.tab;
                const contentEl = document.getElementById(`${tabId}-content`);
                if (contentEl) {
                    contentEl.classList.add('active');
                }
            });
        });
    }

    // Task functions
    async function loadTasks() {
        if (!currentUser) return;
        
        // Show loading state
        if (taskList) taskList.innerHTML = '<h4 class="empty-list">Loading tasks...</h4>';
        
        const result = await getUserTasks(currentUser.uid);
        if (result.success) {
            tasks = result.tasks;
            console.log('Loaded tasks from Firebase:', tasks.length);
            
            // Update global reference for category filtering
            window.tasks = tasks;

            const tasksLoadedEvent = new Event('tasksLoaded');
            document.dispatchEvent(tasksLoadedEvent);

            
            // Initialize filtered tasks
            filteredTasks = [...tasks];
            
            // Render tasks
            renderTasks();
            
            // Update category sidebar if available
            if (window.categoryManager && window.categoryManager.renderCategorySidebar) {
                window.categoryManager.renderCategorySidebar();
            }
        } else {
            console.error('Failed to load tasks:', result.error);
            if (taskList) taskList.innerHTML = '<h4 class="empty-list">Failed to load tasks. Please try again.</h4>';
        }
    }

    function openTaskDialog(mode = 'add', taskId = null) {
        if (!taskForm) return;
        
        taskForm.reset();
        
        if (mode === 'edit' && taskId) {
            if (dialogTitle) dialogTitle.textContent = 'Edit Task';
            editingTaskId = taskId;
            
            const taskToEdit = tasks.find(task => task.id === taskId);
            
            if (taskToEdit) {
                if (taskTitle) taskTitle.value = taskToEdit.title;
                if (taskDescription) taskDescription.value = taskToEdit.description || '';
                if (taskCategory) taskCategory.value = taskToEdit.category || '';
                
                // Update the custom calendar if it exists
                if (window.customCalendar) {
                    if (taskToEdit.dueDate) {
                        window.customCalendar.setValue(taskToEdit.dueDate);
                    } else {
                        window.customCalendar.clearDate();
                    }
                } else if (taskDueDate) {
                    // Fallback to the standard date input
                    taskDueDate.value = taskToEdit.dueDate || '';
                }
            }
        } else {
            if (dialogTitle) dialogTitle.textContent = 'Add New Task';
            editingTaskId = null;
            
            // Set default date for new tasks in the calendar
            if (window.customCalendar) {
                const today = new Date().toISOString().split('T')[0];
                window.customCalendar.setValue(today);
                // Uncomment the line below if you want new tasks to have no date by default
                // window.customCalendar.clearDate();
            } else if (taskDueDate) {
                const today = new Date().toISOString().split('T')[0];
                taskDueDate.value = today;
            }
        }
        
        // Refresh category select options
        if (window.categoryManager && window.categoryManager.populateCategorySelects) {
            window.categoryManager.populateCategorySelects();
            
            // If adding a new task, set the default category to the currently selected one
            if (mode === 'add' && taskCategory && window.categoryManager.setDefaultCategoryInForm) {
                window.categoryManager.setDefaultCategoryInForm(taskCategory);
            }
        }
        
        // Show dialog
        if (taskDialog) taskDialog.classList.add('active');
    }

    function closeTaskDialog() {
        if (taskDialog) taskDialog.classList.remove('active');
    }

    async function addNewTask() {
        if (!currentUser || !taskTitle) return;
        
        const title = taskTitle.value.trim();
        
        if (title === '') return;
        
        // Get date from custom calendar if available, otherwise use original input
        let dueDate = '';
        if (window.customCalendar) {
            dueDate = window.customCalendar.getValue();
        } else if (taskDueDate) {
            dueDate = taskDueDate.value;
        }
        
        const newTask = {
            title: title,
            description: taskDescription ? taskDescription.value.trim() : '',
            dueDate: dueDate,
            category: taskCategory ? taskCategory.value : '',
            completed: false
        };
        
        const result = await addTask(currentUser.uid, newTask);
        if (result.success) {
            // Reload tasks to get fresh data with Firebase IDs
            await loadTasks();
            closeTaskDialog();
        } else {
            console.error('Failed to add task:', result.error);
            alert('Failed to add task. Please try again.');
        }
    }

    async function updateTaskInFirebase() {
        if (!currentUser || !editingTaskId || !taskTitle) return;
        
        const title = taskTitle.value.trim();
        
        if (title === '') return;
        
        // Get date from custom calendar if available, otherwise use original input
        let dueDate = '';
        if (window.customCalendar) {
            dueDate = window.customCalendar.getValue();
        } else if (taskDueDate) {
            dueDate = taskDueDate.value;
        }
        
        const updatedTask = {
            title: title,
            description: taskDescription ? taskDescription.value.trim() : '',
            dueDate: dueDate,
            category: taskCategory ? taskCategory.value : ''
        };
        
        const result = await updateTask(editingTaskId, updatedTask);
        if (result.success) {
            // Reload tasks to get fresh data
            await loadTasks();
            closeTaskDialog();
            editingTaskId = null;
        } else {
            console.error('Failed to update task:', result.error);
            alert('Failed to update task. Please try again.');
        }
    }

    async function deleteTaskFromFirebase(id) {
        // Ask for confirmation
        if (confirm('Are you sure you want to delete this task?')) {
            const result = await deleteTask(id);
            if (result.success) {
                // Reload tasks
                await loadTasks();
            } else {
                console.error('Failed to delete task:', result.error);
                alert('Failed to delete task. Please try again.');
            }
        }
    }

    async function toggleTaskStatusInFirebase(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        
        const result = await toggleTaskStatus(id, !task.completed);
        if (result.success) {
            // Reload tasks
            await loadTasks();
        } else {
            console.error('Failed to update task status:', result.error);
        }
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Set current filter
    function setFilter(filter) {
        currentFilter = filter;
        
        // Update active filter button
        if (filterButtons) {
            filterButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === filter);
            });
        }
        
        renderTasks();
    }

    // Get filtered tasks based on current filter and category
    function getFilteredTasks() {
        // First, filter by category (if a category is selected)
        let categoryFiltered = [...tasks];
        
        if (window.categoryManager && window.categoryManager.getCurrentCategory()) {
            const currentCategory = window.categoryManager.getCurrentCategory();
            categoryFiltered = tasks.filter(task => task.category === currentCategory);
        }
        
        // Then, filter by completion status
        switch (currentFilter) {
            case 'active':
                return categoryFiltered.filter(task => !task.completed);
            case 'completed':
                return categoryFiltered.filter(task => task.completed);
            default:
                return categoryFiltered;
        }
    }

    // Get category name by ID
    function getCategoryName(categoryId) {
        if (!categoryId) return '';
        
        if (window.categoryManager && window.categoryManager.getCategoryById) {
            const category = window.categoryManager.getCategoryById(categoryId);
            return category ? category.name : '';
        }
        
        return '';
    }

    // Render tasks to the DOM
    function renderTasks(tasksToRender) {
        // Check if taskList exists
        if (!taskList) {
            console.warn('taskList element not found');
            return;
        }
        
        // Clear current list
        taskList.innerHTML = '';
        
        // Get tasks based on current filter and category
        const filteredTasks = tasksToRender || getFilteredTasks();
        
        // Sort tasks by due date (closest first, then by creation date)
        filteredTasks.sort((a, b) => {
            // If both have due dates, sort by due date
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            // If only one has a due date, put the one with due date first
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            
            // If neither has a due date, sort by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Create task items
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-list';
            
            if (tasks.length === 0) {
                emptyMessage.textContent = 'Your to-do list is empty. Add a task to get started!';
            } else {
                const currentCategory = window.categoryManager ? window.categoryManager.getCurrentCategory() : null;
                if (currentCategory) {
                    const categoryName = getCategoryName(currentCategory);
                    emptyMessage.textContent = `No ${currentFilter} tasks found in category "${categoryName}".`;
                } else {
                    emptyMessage.textContent = `No ${currentFilter} tasks found.`;
                }
            }
            
            taskList.appendChild(emptyMessage);
        } else {
            filteredTasks.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                if (task.completed) {
                    taskItem.classList.add('completed');
                }
                
                // Add category badge if task has a category
                if (task.category) {
                    const categoryBadge = document.createElement('span');
                    categoryBadge.className = 'task-category';
                    categoryBadge.textContent = getCategoryName(task.category);
                    taskItem.appendChild(categoryBadge);
                }
                
                // Create task content
                const taskContent = document.createElement('div');
                taskContent.className = 'task-content';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'task-checkbox';
                checkbox.checked = task.completed;
                checkbox.addEventListener('change', () => toggleTaskStatusInFirebase(task.id));
                
                const taskText = document.createElement('div');
                taskText.className = 'task-text';
                
                const taskTextTitle = document.createElement('div');
                taskTextTitle.textContent = task.title;
                taskText.appendChild(taskTextTitle);
                
                if (task.description) {
                    const taskTextDesc = document.createElement('div');
                    taskTextDesc.textContent = task.description;
                    taskTextDesc.style.fontSize = '12px';
                    taskTextDesc.style.color = '#7f8c8d';
                    taskTextDesc.style.marginTop = '3px';
                    taskText.appendChild(taskTextDesc);
                }
                
                if (task.dueDate) {
                    const taskDate = document.createElement('span');
                    taskDate.className = 'task-date';
                    taskDate.innerHTML = `<i class="fa-regular fa-calendar"></i> ${formatDate(task.dueDate)}`;
                    
                    // Check if task is overdue
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDate = new Date(task.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    
                    if (dueDate < today && !task.completed) {
                        taskDate.style.color = '#e74c3c';
                    }
                    
                    taskText.appendChild(taskDate);
                }
                
                taskContent.appendChild(checkbox);
                taskContent.appendChild(taskText);
                
                // Create task actions
                const taskActions = document.createElement('div');
                taskActions.className = 'task-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                editBtn.addEventListener('click', () => openTaskDialog('edit', task.id));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                deleteBtn.addEventListener('click', () => deleteTaskFromFirebase(task.id));
                
                taskActions.appendChild(editBtn);
                taskActions.appendChild(deleteBtn);
                
                // Assemble task item
                taskItem.appendChild(taskContent);
                taskItem.appendChild(taskActions);
                
                // Add to list
                taskList.appendChild(taskItem);
            });
        }
    }

    // Notes functions
    async function loadNotes() {
        if (!currentUser) return;
        
        // Show loading state
        if (notesList) {
            notesList.innerHTML = '<div class="empty-list">Loading notes...</div>';
        }
        
        const result = await getUserNotes(currentUser.uid);
        if (result.success) {
            notes = result.notes;
            console.log('Loaded notes from Firebase:', notes.length);
            
            // Update global reference for category filtering
            window.notes = notes;

            const notesLoadedEvent = new Event('notesLoaded');
            document.dispatchEvent(notesLoadedEvent);

            // Initialize filtered notes
            filteredNotes = [...notes];
            
            // Render notes
            renderNotes();
            
            // Update category sidebar if available
            if (window.categoryManager && window.categoryManager.renderCategorySidebar) {
                window.categoryManager.renderCategorySidebar();
            }
        } else {
            console.error('Failed to load notes:', result.error);
            if (notesList) {
                notesList.innerHTML = '<div class="empty-list">Failed to load notes. Please try again.</div>';
            }
        }
    }

    function openNoteDialog(mode = 'add', noteId = null) {
        if (!noteForm) {
            console.warn('noteForm element not found');
            return;
        }
        
        noteForm.reset();
        
        if (mode === 'edit' && noteId) {
            if (noteDialogTitle) noteDialogTitle.textContent = 'Edit Note';
            editingNoteId = noteId;
            
            const noteToEdit = notes.find(note => note.id === noteId);
            
            if (noteToEdit) {
                if (noteTitle) noteTitle.value = noteToEdit.title;
                if (noteContent) noteContent.value = noteToEdit.content || '';
                if (noteCategory) noteCategory.value = noteToEdit.category || '';
            }
        } else {
            if (noteDialogTitle) noteDialogTitle.textContent = 'Add New Note';
            editingNoteId = null;
        }
        
        // Refresh category select options
        if (window.categoryManager && window.categoryManager.populateCategorySelects) {
            window.categoryManager.populateCategorySelects();
            
            // If adding a new note, set the default category to the currently selected one
            if (mode === 'add' && noteCategory && window.categoryManager.setDefaultCategoryInForm) {
                window.categoryManager.setDefaultCategoryInForm(noteCategory);
            }
        }
        
        // Show dialog
        if (noteDialog) noteDialog.classList.add('active');
    }

    function closeNoteDialog() {
        if (noteDialog) noteDialog.classList.remove('active');
    }

    async function addNewNote() {
        if (!currentUser || !noteTitle || !noteContent) {
            console.warn('noteTitle or noteContent elements not found or user not logged in');
            return;
        }
        
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (title === '' || content === '') return;
        
        const newNote = {
            title: title,
            content: content,
            category: noteCategory ? noteCategory.value : ''
        };
        
        const result = await addNote(currentUser.uid, newNote);
        if (result.success) {
            // Reload notes to get fresh data with Firebase IDs
            await loadNotes();
            closeNoteDialog();
        } else {
            console.error('Failed to add note:', result.error);
            alert('Failed to add note. Please try again.');
        }
    }

    async function updateNoteInFirebase() {
        if (!currentUser || !editingNoteId || !noteTitle || !noteContent) return;
        
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (title === '' || content === '') return;
        
        const updatedNote = {
            title: title,
            content: content,
            category: noteCategory ? noteCategory.value : '',
            updatedAt: new Date().toISOString()
        };
        
        const result = await updateNote(editingNoteId, updatedNote);
        if (result.success) {
            // Reload notes to get fresh data
            await loadNotes();
            closeNoteDialog();
            editingNoteId = null;
        } else {
            console.error('Failed to update note:', result.error);
            alert('Failed to update note. Please try again.');
        }
    }

    async function deleteNoteFromFirebase(id) {
        // Ask for confirmation
        if (confirm('Are you sure you want to delete this note?')) {
            const result = await deleteNote(id);
            if (result.success) {
                // Reload notes
                await loadNotes();
            } else {
                console.error('Failed to delete note:', result.error);
                alert('Failed to delete note. Please try again.');
            }
        }
    }

    // Format timestamp for display
    function formatTimestamp(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString(undefined, options);
    }

    // Get filtered notes based on current category
    function getFilteredNotes() {
        // Filter by category (if a category is selected)
        let categoryFiltered = [...notes];
        
        if (window.categoryManager && window.categoryManager.getCurrentCategory()) {
            const currentCategory = window.categoryManager.getCurrentCategory();
            categoryFiltered = notes.filter(note => note.category === currentCategory);
        }
        
        return categoryFiltered;
    }

    // Render notes to the DOM
    function renderNotes(notesToRender) {
        // Check if notesList exists
        if (!notesList) {
            console.warn('notesList element not found');
            return;
        }
        
        // Clear current list
        notesList.innerHTML = '';
        
        // Get notes based on current category
        const filteredNotes = notesToRender || getFilteredNotes();
        
        // Sort notes by creation date (newest first)
        const sortedNotes = [...filteredNotes].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Create note items
        if (sortedNotes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-list';
            
            if (notes.length === 0) {
                emptyMessage.textContent = 'Your notes list is empty. Add a note to get started!';
            } else {
                const currentCategory = window.categoryManager ? window.categoryManager.getCurrentCategory() : null;
                if (currentCategory) {
                    const categoryName = getCategoryName(currentCategory);
                    emptyMessage.textContent = `No notes found in category "${categoryName}".`;
                } else {
                    emptyMessage.textContent = 'No notes match the current filter.';
                }
            }
            
            notesList.appendChild(emptyMessage);
        } else {
            sortedNotes.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                
                // Add category badge if note has a category
                if (note.category) {
                    const categoryBadge = document.createElement('span');
                    categoryBadge.className = 'note-category';
                    categoryBadge.textContent = getCategoryName(note.category);
                    noteItem.appendChild(categoryBadge);
                }
                
                // Create note header
                const noteHeader = document.createElement('div');
                noteHeader.className = 'note-header';
                
                const noteItemTitle = document.createElement('div');
                noteItemTitle.className = 'note-title';
                noteItemTitle.textContent = note.title;
                
                const noteDate = document.createElement('div');
                noteDate.className = 'note-date';
                
                const timestamp = note.updatedAt ? 
                    `Updated: ${formatTimestamp(note.updatedAt)}` : 
                    `Created: ${formatTimestamp(note.createdAt)}`;
                
                noteDate.textContent = timestamp;
                
                noteHeader.appendChild(noteItemTitle);
                noteHeader.appendChild(noteDate);
                
                // Create note content
                const noteItemContent = document.createElement('div');
                noteItemContent.className = 'note-content';
                noteItemContent.textContent = note.content;
                
                // Create note actions
                const noteActions = document.createElement('div');
                noteActions.className = 'note-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                editBtn.title = 'Edit';
                editBtn.addEventListener('click', () => openNoteDialog('edit', note.id));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                deleteBtn.title = 'Delete';
                deleteBtn.addEventListener('click', () => deleteNoteFromFirebase(note.id));
                
                noteActions.appendChild(editBtn);
                noteActions.appendChild(deleteBtn);
                
                // Assemble note item
                noteItem.appendChild(noteHeader);
                noteItem.appendChild(noteItemContent);
                noteItem.appendChild(noteActions);
                
                // Add to list
                notesList.appendChild(noteItem);
            });
        }
    }

    // Setup all event listeners
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Set up tab switching
        setupTabEvents();
        
        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await logoutUser();
                if (result.success) {
                    ipcRenderer.send('logout');
                } else {
                    console.error('Logout failed:', result.error);
                    alert('Logout failed. Please try again.');
                }
            });
        }
        
        // Task-related event listeners
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => openTaskDialog());
        }
        
        if (closeDialog) {
            closeDialog.addEventListener('click', closeTaskDialog);
        }
        
        if (cancelTask) {
            cancelTask.addEventListener('click', closeTaskDialog);
        }
        
        if (saveTask) {
            saveTask.addEventListener('click', () => {
                if (editingTaskId) {
                    updateTaskInFirebase();
                } else {
                    addNewTask();
                }
            });
        }
        
        if (taskDialog) {
            taskDialog.addEventListener('click', (e) => {
                if (e.target === taskDialog) {
                    closeTaskDialog();
                }
            });
        }
        
        if (taskForm) {
            taskForm.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (editingTaskId) {
                        updateTaskInFirebase();
                    } else {
                        addNewTask();
                    }
                }
            });
        }
        
        // Filter buttons
        if (filterButtons) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    setFilter(btn.dataset.filter);
                });
            });
        }
        
        // Note-related event listeners
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => openNoteDialog());
        }
        
        if (closeNoteDialogBtn) {
            closeNoteDialogBtn.addEventListener('click', closeNoteDialog);
        }
        
        if (cancelNote) {
            cancelNote.addEventListener('click', closeNoteDialog);
        }
        
        if (saveNote) {
            saveNote.addEventListener('click', () => {
                if (editingNoteId) {
                    updateNoteInFirebase();
                } else {
                    addNewNote();
                }
            });
        }
        
        if (noteDialog) {
            noteDialog.addEventListener('click', (e) => {
                if (e.target === noteDialog) {
                    closeNoteDialog();
                }
            });
        }
        
        if (noteForm) {
            noteForm.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && e.target.id !== 'noteContent') {
                    e.preventDefault();
                    if (editingNoteId) {
                        updateNoteInFirebase();
                    } else {
                        addNewNote();
                    }
                }
            });
        }
        
        // Category filter integration with window methods
        window.filterTasksByCategory = function(categoryId) {
            if (!window.tasks) return;
            
            if (categoryId) {
                window.filteredTasks = window.tasks.filter(task => task.category === categoryId);
            } else {
                window.filteredTasks = [...window.tasks];
            }
            
            renderTasks(window.filteredTasks);
        };
        
        window.filterNotesByCategory = function(categoryId) {
            if (!window.notes) return;
            
            if (categoryId) {
                window.filteredNotes = window.notes.filter(note => note.category === categoryId);
            } else {
                window.filteredNotes = [...window.notes];
            }
            
            renderNotes(window.filteredNotes);
        };
    }

    // Make functions available globally for category filtering
    window.renderTasks = renderTasks;
    window.renderNotes = renderNotes;

    // Initialize the app
    init();
});