/**
 * Custom Calendar Implementation for To-Do App
 * Inspired by shadcn UI Calendar Component
 * With added Clear Date functionality
 * Modified to show calendar to the side and improve click behavior
 */
class CustomCalendar {
    constructor(inputElement) {
        this.inputElement = inputElement;
        this.selectedDate = inputElement.value ? new Date(inputElement.value) : new Date();
        this.currentMonth = this.selectedDate.getMonth();
        this.currentYear = this.selectedDate.getFullYear();
        this.calendarTemplate = `
            <div class="calendar-dropdown">
                <div class="calendar-header">
                    <button type="button" class="nav-btn prev-month"><i class="fa-solid fa-chevron-left"></i></button>
                    <div class="month-year"></div>
                    <button type="button" class="nav-btn next-month"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <div class="calendar-grid">
                    <!-- Weekday headers -->
                    <div class="weekday">Su</div>
                    <div class="weekday">Mo</div>
                    <div class="weekday">Tu</div>
                    <div class="weekday">We</div>
                    <div class="weekday">Th</div>
                    <div class="weekday">Fr</div>
                    <div class="weekday">Sa</div>
                    
                    <!-- Calendar days will be dynamically inserted here -->
                </div>
                <div class="calendar-footer">
                    <button type="button" class="clear-date-btn">Clear Date</button>
                </div>
            </div>
        `;
        this.calendarDropdown = null;
        this.calendarWrapper = null;
        this.isOpen = false;
        this.hasDate = !!inputElement.value;
        
        this.init();
    }
    
    init() {
        // Create calendar wrapper
        this.calendarWrapper = document.createElement('div');
        this.calendarWrapper.className = 'calendar-wrapper';
        
        // Create date input container
        const dateInputContainer = document.createElement('div');
        dateInputContainer.className = 'date-input-container';
        
        // Create calendar icon
        const calendarIcon = document.createElement('span');
        calendarIcon.className = 'calendar-icon';
        calendarIcon.innerHTML = '<i class="fa-regular fa-calendar"></i>';
        
        // Clone the input element and replace it with our custom input
        const clonedInput = this.inputElement.cloneNode(true);
        clonedInput.className += ' custom-date-input';
        clonedInput.type = 'text';
        clonedInput.readOnly = true;
        
        // Update display value
        this.updateInputDisplay(clonedInput);
        
        // Replace the original input
        this.inputElement.parentNode.replaceChild(this.calendarWrapper, this.inputElement);
        
        // Add elements to the wrapper
        dateInputContainer.appendChild(clonedInput);
        dateInputContainer.appendChild(calendarIcon);
        this.calendarWrapper.appendChild(dateInputContainer);
        
        // Parse calendar template and append to wrapper
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.calendarTemplate.trim();
        this.calendarDropdown = tempDiv.firstChild;
        this.calendarWrapper.appendChild(this.calendarDropdown);
        
        // Set up event listeners - MODIFIED: directly on the input itself
        clonedInput.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCalendar();
        });
        
        // Set up event listeners for navigation
        const prevMonthBtn = this.calendarDropdown.querySelector('.prev-month');
        const nextMonthBtn = this.calendarDropdown.querySelector('.next-month');
        
        prevMonthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            this.navigateMonth(-1);
        });
        
        nextMonthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            this.navigateMonth(1);
        });
        
        // Set up event listener for clear date button
        const clearDateBtn = this.calendarDropdown.querySelector('.clear-date-btn');
        clearDateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.clearDate();
        });
        
        // Close calendar when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.calendarWrapper.contains(e.target)) {
                this.closeCalendar();
            }
        });
        
        // Prevent clicks within the calendar from bubbling up
        this.calendarDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Store the original input's name
        this.originalName = this.inputElement.name;
        
        // Create hidden input to store actual value
        this.hiddenInput = document.createElement('input');
        this.hiddenInput.type = 'hidden';
        this.hiddenInput.name = this.originalName;
        this.hiddenInput.value = this.hasDate ? this.formatDate(this.selectedDate, 'yyyy-mm-dd') : '';
        this.calendarWrapper.appendChild(this.hiddenInput);
        
        // Keep a reference to our custom input
        this.customInput = clonedInput;
        
        // Render initial calendar
        this.renderCalendar();
    }
    
    formatDate(date, format) {
        if (!date) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        if (format === 'yyyy-mm-dd') {
            return `${year}-${month}-${day}`;
        } else {
            // Default display format
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            return `${monthNames[date.getMonth()]} ${day}, ${year}`;
        }
    }
    
    updateInputDisplay(inputElement) {
        const input = inputElement || this.customInput;
        if (input) {
            if (this.hasDate && this.selectedDate) {
                input.value = this.formatDate(this.selectedDate);
                input.classList.remove('empty-date');
            } else {
                input.value = 'No due date';
                input.classList.add('empty-date');
            }
        }
    }
    
    toggleCalendar() {
        if (this.isOpen) {
            this.closeCalendar();
        } else {
            this.openCalendar();
        }
    }
    
    openCalendar() {
        // Position the calendar to the side instead of below
        this.positionCalendarToSide();
        
        this.calendarDropdown.classList.add('active');
        this.isOpen = true;
        this.renderCalendar();
    }
    
    // New method to position the calendar to the side
    positionCalendarToSide() {
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        
        // Reset any previous positioning
        this.calendarDropdown.style.left = '';
        this.calendarDropdown.style.right = '';
        this.calendarDropdown.style.top = '';
        
        // Get input dimensions and position
        const inputRect = this.customInput.getBoundingClientRect();
        
        // Check if there's room on the right side
        if (inputRect.right + 320 < viewportWidth) {
            // Position to the right
            this.calendarDropdown.style.left = '105%';
            this.calendarDropdown.style.top = '0';
        } else {
            // Position to the left if not enough space on right
            this.calendarDropdown.style.right = '105%';
            this.calendarDropdown.style.left = 'auto';
            this.calendarDropdown.style.top = '0';
        }
    }
    
    closeCalendar() {
        this.calendarDropdown.classList.remove('active');
        this.isOpen = false;
    }
    
    navigateMonth(direction) {
        this.currentMonth += direction;
        
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        
        this.renderCalendar();
    }
    
    renderCalendar() {
        const monthYearElement = this.calendarDropdown.querySelector('.month-year');
        const calendarGrid = this.calendarDropdown.querySelector('.calendar-grid');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Update month and year display
        monthYearElement.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Clear previous days
        const dayElements = calendarGrid.querySelectorAll('.day');
        dayElements.forEach(day => day.remove());
        
        // Get the first day of the month
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Get the number of days in the month
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        
        // Get the number of days in the previous month
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
        
        // Get current date for highlighting
        const today = new Date();
        const todayDateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        
        // Get selected date for highlighting
        const selectedDateString = this.hasDate && this.selectedDate ? 
            `${this.selectedDate.getFullYear()}-${this.selectedDate.getMonth()}-${this.selectedDate.getDate()}` : null;
        
        // Create grid cells for days in previous month
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day out-of-month';
            dayElement.textContent = daysInPrevMonth - i;
            calendarGrid.appendChild(dayElement);
        }
        
        // Create grid cells for days in current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = i;
            
            // Check if this day is today
            const dayDateString = `${this.currentYear}-${this.currentMonth}-${i}`;
            if (dayDateString === todayDateString) {
                dayElement.classList.add('today');
            }
            
            // Check if this day is selected
            if (this.hasDate && selectedDateString && 
                dayDateString === selectedDateString &&
                this.currentMonth === this.selectedDate.getMonth() &&
                this.currentYear === this.selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }
            
            // Add click event to select date
            dayElement.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                this.selectDate(i);
            });
            
            calendarGrid.appendChild(dayElement);
        }
        
        // Calculate days needed from next month to fill the grid
        const totalCells = Math.ceil((startingDay + daysInMonth) / 7) * 7;
        const nextMonthDays = totalCells - (startingDay + daysInMonth);
        
        // Create grid cells for days in next month
        for (let i = 1; i <= nextMonthDays; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day out-of-month';
            dayElement.textContent = i;
            calendarGrid.appendChild(dayElement);
        }
    }
    
    selectDate(day) {
        // Create new date object for selected date
        this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
        this.hasDate = true;
        
        // Update the input value
        this.updateInputDisplay();
        
        // Update the hidden input
        this.hiddenInput.value = this.formatDate(this.selectedDate, 'yyyy-mm-dd');
        
        // Re-render calendar to update selected state
        this.renderCalendar();
        
        // Close calendar
        this.closeCalendar();
        
        // Dispatch change event for the hidden input
        const event = new Event('change', { bubbles: true });
        this.hiddenInput.dispatchEvent(event);
    }
    
    clearDate() {
        // Clear the date
        this.hasDate = false;
        this.selectedDate = new Date(); // Keep current month/year for the calendar view
        
        // Update the input display
        this.updateInputDisplay();
        
        // Clear the hidden input value
        this.hiddenInput.value = '';
        
        // Re-render calendar
        this.renderCalendar();
        
        // Close calendar
        this.closeCalendar();
        
        // Dispatch change event
        const event = new Event('change', { bubbles: true });
        this.hiddenInput.dispatchEvent(event);
    }
    
    // Get the current selected date value
    getValue() {
        return this.hiddenInput.value;
    }
    
    // Check if a date is selected
    hasValue() {
        return this.hasDate;
    }
    
    // Set the date programmatically
    setValue(dateString) {
        if (dateString) {
            this.selectedDate = new Date(dateString);
            this.currentMonth = this.selectedDate.getMonth();
            this.currentYear = this.selectedDate.getFullYear();
            this.hasDate = true;
            this.updateInputDisplay();
            this.hiddenInput.value = this.formatDate(this.selectedDate, 'yyyy-mm-dd');
        } else {
            this.clearDate();
        }
    }
}

// Function to initialize custom calendar for a date input
function initCustomCalendar(dateInputElement) {
    return new CustomCalendar(dateInputElement);
}

// Update the main javascript to use the custom calendar
document.addEventListener('DOMContentLoaded', function() {
    // Initialize custom calendar for the task due date input
    const taskDueDateInput = document.getElementById('taskDueDate');
    if (taskDueDateInput) {
        window.taskCalendar = initCustomCalendar(taskDueDateInput);
        
        // Global reference to access the calendar from other contexts
        window.customCalendar = window.taskCalendar;
    }
});