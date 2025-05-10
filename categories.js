/**
 * Category Management for Productivity App
 * Handles categories for both tasks and notes
 * With icon selection functionality
 * Updated for Firebase integration
 */
document.addEventListener('DOMContentLoaded', function() {
    // Category-related DOM elements
    const categoriesList = document.getElementById('categoriesList');
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    const categoryDialog = document.getElementById('categoryDialog');
    const closeCategoryDialogBtn = document.getElementById('closeCategoryDialog');
    const saveCategoryChanges = document.getElementById('saveCategoryChanges');
    const newCategoryName = document.getElementById('newCategoryName');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryManagementList = document.getElementById('categoryManagementList');
    const iconSelector = document.getElementById('iconSelector');
    
    // Task and Note category select elements
    const taskCategorySelect = document.getElementById('taskCategory');
    const noteCategorySelect = document.getElementById('noteCategory');
    
    // State variables
    let categories = [];
    let currentCategory = null;
    let taskListRef = document.getElementById('taskList');
    let notesListRef = document.getElementById('notesList');
    let selectedIcon = 'fa-folder'; // Default icon
    
    // Available icons for categories
    const availableIcons = [
        { name: 'Folder', icon: 'fa-folder' },
        { name: 'Tag', icon: 'fa-tag' },
        { name: 'Bookmark', icon: 'fa-bookmark' },
        { name: 'Star', icon: 'fa-star' },
        { name: 'Flag', icon: 'fa-flag' },
        { name: 'Circle', icon: 'fa-circle' },
        { name: 'Heart', icon: 'fa-heart' },
        { name: 'Cube', icon: 'fa-cube' },
        { name: 'Gem', icon: 'fa-gem' },
        { name: 'Home', icon: 'fa-home' },
        { name: 'Building', icon: 'fa-building' },
        { name: 'Car', icon: 'fa-car' },
        { name: 'Plane', icon: 'fa-plane' },
        { name: 'Book', icon: 'fa-book' },
        { name: 'Graduation Cap', icon: 'fa-graduation-cap' },
        { name: 'Briefcase', icon: 'fa-briefcase' },
        { name: 'Shopping Bag', icon: 'fa-shopping-bag' },
        { name: 'Money', icon: 'fa-money-bill' },
        { name: 'Calendar', icon: 'fa-calendar' },
        { name: 'Clock', icon: 'fa-clock' },
        { name: 'User', icon: 'fa-user' }
    ];
    
    // Initialize
    function init() {
        console.log('Initializing categories...');
        loadCategories();
        createIconSelector();
        setupEventListeners();
        
        // We'll render the sidebar once we have user data and items loaded
    }
    
    // Create icon selector UI
    function createIconSelector() {
        if (!iconSelector) {
            console.warn('Icon selector element not found, creating one');
            
            // Create the icon selector container if it doesn't exist
            const iconSelectorContainer = document.createElement('div');
            iconSelectorContainer.className = 'icon-selector-container';
            iconSelectorContainer.id = 'iconSelector';
            
            // Find the form element that contains the new category input
            const formGroup = newCategoryName.closest('.form-group');
            if (formGroup) {
                // Create a label for the icon selector
                const iconLabel = document.createElement('label');
                iconLabel.textContent = 'Select an Icon';
                
                // Insert the label and selector after the existing form group
                formGroup.parentNode.insertBefore(iconLabel, formGroup.nextSibling);
                formGroup.parentNode.insertBefore(iconSelectorContainer, formGroup.nextSibling.nextSibling);
                
                // Update the reference
                iconSelector = iconSelectorContainer;
            }
        }
        
        // Clear any existing icons
        iconSelector.innerHTML = '';
        
        // Create icon grid
        availableIcons.forEach(iconItem => {
            const iconElement = document.createElement('div');
            iconElement.className = 'icon-option' + (iconItem.icon === selectedIcon ? ' selected' : '');
            iconElement.setAttribute('data-icon', iconItem.icon);
            iconElement.innerHTML = `<i class="fa-solid ${iconItem.icon}" title="${iconItem.name}"></i>`;
            
            // Add click event to select icon
            iconElement.addEventListener('click', () => {
                // Remove selected class from all icons
                document.querySelectorAll('.icon-option').forEach(icon => {
                    icon.classList.remove('selected');
                });
                
                // Add selected class to clicked icon
                iconElement.classList.add('selected');
                
                // Update selected icon
                selectedIcon = iconItem.icon;
            });
            
            iconSelector.appendChild(iconElement);
        });
    }
    
    // Load categories from localStorage (we'll keep this method for now)
    function loadCategories() {
        const storedCategories = localStorage.getItem('categories');
        categories = storedCategories ? JSON.parse(storedCategories) : [
            // Default categories
            { id: 'personal', name: 'Personal', icon: 'fa-user' },
            { id: 'work', name: 'Work', icon: 'fa-briefcase' }
        ];
        console.log('Loaded categories:', categories.length);
    }
    
    // Save categories to localStorage
    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }
    
    // Render categories in sidebar
    function renderCategorySidebar() {
        if (!categoriesList) return;
        
        // Clear current list
        categoriesList.innerHTML = '';
        
        // Add "All" category at the top
        const allCategoryItem = document.createElement('li');
        allCategoryItem.className = 'category-item' + (currentCategory === null ? ' active' : '');
        allCategoryItem.setAttribute('data-category', '');
        allCategoryItem.innerHTML = `
            <span class="category-icon"><i class="fa-solid fa-layer-group"></i></span>
            <span class="category-name">All Items</span>
            <span class="category-count">${getTotalItemsCount()}</span>
        `;
        allCategoryItem.addEventListener('click', () => {
            selectCategory(null);
        });
        categoriesList.appendChild(allCategoryItem);
        
        // Create category items
        categories.forEach(category => {
            const categoryItem = document.createElement('li');
            categoryItem.className = 'category-item' + (currentCategory === category.id ? ' active' : '');
            categoryItem.setAttribute('data-category', category.id);
            categoryItem.innerHTML = `
                <span class="category-icon"><i class="fa-solid ${category.icon}"></i></span>
                <span class="category-name">${category.name}</span>
                <span class="category-count">${getItemsCountByCategory(category.id)}</span>
            `;
            categoryItem.addEventListener('click', () => {
                selectCategory(category.id);
            });
            categoriesList.appendChild(categoryItem);
        });
    }
    
    // Count total items (tasks + notes) from global arrays instead of localStorage
    function getTotalItemsCount() {
        const tasks = window.tasks || [];
        const notes = window.notes || [];
        return tasks.length + notes.length;
    }
    
    // Count items by category from global arrays instead of localStorage
    function getItemsCountByCategory(categoryId) {
        const tasks = window.tasks || [];
        const notes = window.notes || [];
        
        const tasksCount = tasks.filter(task => task.category === categoryId).length;
        const notesCount = notes.filter(note => note.category === categoryId).length;
        
        return tasksCount + notesCount;
    }
    
    // Select a category and filter items
    function selectCategory(categoryId) {
        currentCategory = categoryId;
        
        // Update active category in sidebar
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-category') === (categoryId || ''));
        });
        
        // Filter tasks and notes by category
        filterItemsByCategory();
    }
    
    // Filter tasks and notes by current category
    function filterItemsByCategory() {
        // Filter tasks
        if (window.filterTasksByCategory) {
            window.filterTasksByCategory(currentCategory);
        } else {
            console.warn('filterTasksByCategory function not available');
        }
        
        // Filter notes
        if (window.filterNotesByCategory) {
            window.filterNotesByCategory(currentCategory);
        } else {
            console.warn('filterNotesByCategory function not available');
        }
        
        // Update category counts
        renderCategorySidebar();
    }
    
    // Populate category select dropdowns
    function populateCategorySelects() {
        const selects = [taskCategorySelect, noteCategorySelect];
        
        selects.forEach(select => {
            if (!select) return;
            
            // Keep the first option (None) and remove others
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add categories as options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }
    
    // Open category management dialog
    function openCategoryDialog() {
        renderCategoryManagementList();
        createIconSelector(); // Ensure icon selector is created and updated
        if (categoryDialog) categoryDialog.classList.add('active');
    }
    
    // Close category management dialog
    function closeCategoryDialog() {
        if (categoryDialog) categoryDialog.classList.remove('active');
    }
    
    // Render the category list in the management dialog
    function renderCategoryManagementList() {
        if (!categoryManagementList) return;
        
        // Clear current list
        categoryManagementList.innerHTML = '';
        
        // Create category items
        categories.forEach(category => {
            const categoryItem = document.createElement('li');
            categoryItem.className = 'category-management-item';
            categoryItem.innerHTML = `
                <span class="category-management-name">
                    <i class="fa-solid ${category.icon}"></i> ${category.name}
                </span>
                <div class="category-management-actions">
                    <button class="edit-category-icon-btn" data-id="${category.id}" title="Change Icon">
                        <i class="fa-solid fa-palette"></i>
                    </button>
                    <button class="delete-category-btn" data-id="${category.id}" title="Delete Category">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            categoryManagementList.appendChild(categoryItem);
        });
        
        // Add event listeners to buttons
        const deleteButtons = categoryManagementList.querySelectorAll('.delete-category-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-id');
                deleteCategory(categoryId);
            });
        });
        
        // Add event listeners to edit icon buttons
        const editIconButtons = categoryManagementList.querySelectorAll('.edit-category-icon-btn');
        editIconButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-id');
                openIconSelectorForCategory(categoryId);
            });
        });
    }
    
    // Open icon selector modal for a specific category
    function openIconSelectorForCategory(categoryId) {
        // Find the category
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) return;
        
        // Create modal for icon selection
        const modal = document.createElement('div');
        modal.className = 'icon-selector-modal';
        
        // Create modal content
        modal.innerHTML = `
            <div class="icon-selector-modal-content">
                <div class="icon-selector-modal-header">
                    <h4>Select Icon for "${category.name}"</h4>
                    <button class="close-icon-selector-modal">&times;</button>
                </div>
                <div class="icon-selector-modal-body">
                    <div class="icon-grid" id="categoryIconGrid"></div>
                </div>
                <div class="icon-selector-modal-footer">
                    <button class="cancel-icon-selection">Cancel</button>
                    <button class="save-icon-selection">Save</button>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Populate icon grid
        const iconGrid = modal.querySelector('#categoryIconGrid');
        let tempSelectedIcon = category.icon;
        
        availableIcons.forEach(iconItem => {
            const iconElement = document.createElement('div');
            iconElement.className = 'icon-option' + (iconItem.icon === category.icon ? ' selected' : '');
            iconElement.setAttribute('data-icon', iconItem.icon);
            iconElement.innerHTML = `<i class="fa-solid ${iconItem.icon}" title="${iconItem.name}"></i>`;
            
            // Add click event to select icon
            iconElement.addEventListener('click', () => {
                // Remove selected class from all icons
                iconGrid.querySelectorAll('.icon-option').forEach(icon => {
                    icon.classList.remove('selected');
                });
                
                // Add selected class to clicked icon
                iconElement.classList.add('selected');
                
                // Update temp selected icon
                tempSelectedIcon = iconItem.icon;
            });
            
            iconGrid.appendChild(iconElement);
        });
        
        // Add event listeners to modal buttons
        modal.querySelector('.close-icon-selector-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.cancel-icon-selection').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.save-icon-selection').addEventListener('click', () => {
            // Update category icon
            updateCategoryIcon(categoryId, tempSelectedIcon);
            document.body.removeChild(modal);
        });
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
    
    // Update a category's icon
    function updateCategoryIcon(categoryId, newIcon) {
        categories = categories.map(category => {
            if (category.id === categoryId) {
                return { ...category, icon: newIcon };
            }
            return category;
        });
        
        saveCategories();
        renderCategoryManagementList();
        renderCategorySidebar();
    }
    
    // Add a new category
    function addCategory() {
        if (!newCategoryName) return;
        
        const name = newCategoryName.value.trim();
        if (name === '') return;
        
        // Check if category already exists
        if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            alert('A category with this name already exists');
            return;
        }
        
        // Create a new category with the selected icon
        const newCategory = {
            id: 'cat_' + Date.now(),
            name: name,
            icon: selectedIcon
        };
        
        categories.push(newCategory);
        saveCategories();
        
        // Clear input field and reset selected icon
        newCategoryName.value = '';
        selectedIcon = 'fa-folder';
        
        // Update UI
        renderCategoryManagementList();
        renderCategorySidebar();
        populateCategorySelects();
        createIconSelector(); // Reset icon selection UI
    }
    
    // Delete a category
    function deleteCategory(categoryId) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this category? Items in this category will not be deleted but will no longer be categorized.')) {
            return;
        }
        
        // Remove category
        categories = categories.filter(cat => cat.id !== categoryId);
        saveCategories();
        
        // Update tasks and notes to remove this category
        updateItemsAfterCategoryDelete(categoryId);
        
        // Update UI
        renderCategoryManagementList();
        renderCategorySidebar();
        populateCategorySelects();
        
        // If current category is deleted, switch to "All"
        if (currentCategory === categoryId) {
            selectCategory(null);
        }
    }
    
    // Update tasks and notes after a category is deleted
    function updateItemsAfterCategoryDelete(categoryId) {
        // For now, we'll just refresh the UI
        // In a full implementation, we'd need to update the Firebase documents
        // to remove the category from all affected tasks and notes
        
        if (window.renderTasks) {
            window.renderTasks();
        }
        
        if (window.renderNotes) {
            window.renderNotes();
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        if (manageCategoriesBtn) {
            manageCategoriesBtn.addEventListener('click', openCategoryDialog);
        }
        
        if (closeCategoryDialogBtn) {
            closeCategoryDialogBtn.addEventListener('click', closeCategoryDialog);
        }
        
        if (saveCategoryChanges) {
            saveCategoryChanges.addEventListener('click', () => {
                closeCategoryDialog();
                // Re-render everything
                renderCategorySidebar();
                if (window.renderTasks) window.renderTasks();
                if (window.renderNotes) window.renderNotes();
            });
        }
        
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addCategory();
            });
        }
        
        if (newCategoryName) {
            newCategoryName.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addCategory();
                }
            });
        }
        
        if (categoryDialog) {
            categoryDialog.addEventListener('click', (e) => {
                if (e.target === categoryDialog) {
                    closeCategoryDialog();
                }
            });
        }

        // Listen for when tasks and notes are loaded
        document.addEventListener('tasksLoaded', () => {
            console.log('Tasks loaded event received');
            renderCategorySidebar();
        });

        document.addEventListener('notesLoaded', () => {
            console.log('Notes loaded event received');
            renderCategorySidebar();
        });

        // Listen for user data
        window.addEventListener('userInitialized', () => {
            console.log('User initialized, rendering categories sidebar');
            renderCategorySidebar();
            populateCategorySelects();
        });
    }
    
    // Export functions to window for main app integration
    window.categoryManager = {
        renderCategorySidebar,
        populateCategorySelects,
        selectCategory,
        getCategories: () => categories,
        getCategoryById: (id) => categories.find(cat => cat.id === id) || null,
        getCurrentCategory: () => currentCategory,
        setDefaultCategoryInForm: (selectElement) => {
            if (!selectElement) return;
            // If a category is currently selected, use it as default
            if (currentCategory) {
                selectElement.value = currentCategory;
            }
        }
    };
    
    // Register filtering functions for use by main app
    window.filterTasksByCategory = function(categoryId) {
        if (!window.tasks) return;
        
        if (categoryId) {
            window.filteredTasks = window.tasks.filter(task => task.category === categoryId);
        } else {
            window.filteredTasks = [...window.tasks];
        }
        
        if (window.renderTasks) {
            window.renderTasks(window.filteredTasks);
        }
    };
    
    window.filterNotesByCategory = function(categoryId) {
        if (!window.notes) return;
        
        if (categoryId) {
            window.filteredNotes = window.notes.filter(note => note.category === categoryId);
        } else {
            window.filteredNotes = [...window.notes];
        }
        
        if (window.renderNotes) {
            window.renderNotes(window.filteredNotes);
        }
    };
    
    // Initialize when DOM is fully loaded
    init();
});