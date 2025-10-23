let createdExamId = null;

        
        // Show success popup
        function showSuccessPopup(examId) {
            createdExamId = examId;
            document.getElementById('successPopup').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Show error popup
        function showErrorPopup(errorMessage = 'Failed to create exam. Please try again.') {
            document.getElementById('errorMessage').textContent = errorMessage;
            document.getElementById('errorPopup').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Close popup
        function closePopup(popupId) {
            document.getElementById(popupId).classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // Redirect to allocation page
       function redirectToAllocation() {
    if (createdExamId) {
        // Using Express router path parameter: /allocations/:id
        window.location.href = `/coe/allocations/${createdExamId}`;
        
        // Note: Since you're using Express router with path: '/allocations/:id'
        // and the route is under '/coe' prefix (based on your createExam endpoint),
        // the full URL will be: /coe/allocations/{examId}
        
    } else {
        console.error('No exam ID available for redirection');
        // Fallback: redirect to home or exam list page
        showErrorPopup('Unable to redirect. Exam ID not found.');
    }
}

        // Retry exam creation
        function retryExamCreation() {
            closePopup('errorPopup');
            // Trigger your form submission again or focus back on the form
            // document.getElementById('examForm').requestSubmit();
        }

        // Close popup when clicking outside
        document.querySelectorAll('.popup-overlay').forEach(overlay => {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    closePopup(this.id);
                }
            });
        });

        // Close popup with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.popup-overlay.active').forEach(popup => {
                    closePopup(popup.id);
                });
            }
        });

const home = document.getElementById('home');
        if (home) {
            home.addEventListener('click', () => {
                window.location.href = '/coeHome.html';
            });
        }

        const classrooms = {};
        let selectedClassrooms = [];
        let tempSelectedClassrooms = [];
        let teacherList = [];
        let unavailableTeachers = [];
        let currentBlock = '';
        let selectedDatesWithSessions = {};
        let tempSelectedDatesWithSessions = {};
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        let activeDate = null;

        // Modal elements
        const classroomModal = document.getElementById('classroomModal');
        const unavailabilityModal = document.getElementById('unavailabilityModal');
        const datePickerModal = document.getElementById('datePickerModal');

        // Fetch classrooms from database
        fetch("/coe/getClassrooms")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Classrooms from server:", data);

                // Group classrooms by building
                data.forEach(item => {
                    const building = item.building;
                    const name = item.name;

                    if (!classrooms[building]) {
                        classrooms[building] = [];
                    }
                    classrooms[building].push(name);
                });

                console.log("Organized classrooms:", classrooms);
                createButtons();
            })
            .catch(err => {
                console.error("Error fetching classrooms:", err);
                classrooms['Block A'] = ['A101', 'A102', 'A103', 'A104'];
                classrooms['Block B'] = ['B101', 'B102', 'B103', 'B104'];
                classrooms['Block C'] = ['C101', 'C102', 'C103', 'C104'];
                createButtons();
            });

        // Fetch teachers from database
        fetch("/coe/getTeachers")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Teachers from server:", data);
                teacherList = data.map(teacher => teacher.name);
                console.log("Loaded teachers:", teacherList);
                displayTeachers();
            })
            .catch(err => {
                console.error("Error fetching teachers:", err);
                teacherList = ['Dr. Smith', 'Prof. Johnson', 'Ms. Davis', 'Mr. Wilson', 'Dr. Brown'];
                console.log("Using sample teachers");
                displayTeachers();
            });

        function createButtons() {
            const blockSelector = document.getElementById('blockSelector');
            blockSelector.innerHTML = '';

            const allBtn = document.createElement('button');
            allBtn.id = 'selectAllBtn';
            allBtn.textContent = 'Select All';
            allBtn.style.marginLeft = 'auto';
            allBtn.style.background = '#28a745';
            allBtn.className = 'block-btn';
            allBtn.onclick = selectAllClassrooms;
            blockSelector.appendChild(allBtn);

            let index = 0;
            Object.keys(classrooms).forEach((building) => {
                const btn = document.createElement('button');
                btn.className = 'block-btn';
                btn.dataset.block = building;
                btn.textContent = building;

                if (index === 0) {
                    btn.classList.add('active');
                    index++;
                }
                
                btn.onclick = () => {
                    document.querySelectorAll('.block-btn').forEach(b => {
                        if (b.id !== 'selectAllBtn') {
                            b.classList.remove('active');
                        }
                    });
                    btn.classList.add('active');
                    currentBlock = building;
                    loadClassrooms(building);
                };
                
                blockSelector.insertBefore(btn, allBtn);
            });

            if (Object.keys(classrooms).length > 0) {
                currentBlock = Object.keys(classrooms)[0];
                loadClassrooms(currentBlock);
            }
        }

        // Date Picker Functions
        const datePickerBtn = document.getElementById('datePickerBtn');
        const closeDatePicker = document.getElementById('closeDatePicker');
        const cancelDatePicker = document.getElementById('cancelDatePicker');
        const confirmDates = document.getElementById('confirmDates');
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        const sessionSelector = document.getElementById('sessionSelector');
        const selectedDateDisplay = document.getElementById('selectedDateDisplay');

        if (datePickerBtn) {
            datePickerBtn.addEventListener('click', function() {
                tempSelectedDatesWithSessions = JSON.parse(JSON.stringify(selectedDatesWithSessions));
                datePickerModal.style.display = 'block';
                renderCalendar();
            });
        }

        if (closeDatePicker) {
            closeDatePicker.onclick = function() {
                datePickerModal.style.display = 'none';
                sessionSelector.style.display = 'none';
                activeDate = null;
            };
        }

        if (cancelDatePicker) {
            cancelDatePicker.onclick = function() {
                datePickerModal.style.display = 'none';
                sessionSelector.style.display = 'none';
                activeDate = null;
            };
        }

        if (confirmDates) {
            confirmDates.onclick = function() {
                selectedDatesWithSessions = JSON.parse(JSON.stringify(tempSelectedDatesWithSessions));
                updateSelectedDates();
                datePickerModal.style.display = 'none';
                sessionSelector.style.display = 'none';
                activeDate = null;
            };
        }

        if (prevMonth) {
            prevMonth.addEventListener('click', function() {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendar();
            });
        }

        if (nextMonth) {
            nextMonth.addEventListener('click', function() {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                renderCalendar();
            });
        }

        // Session button handlers
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('session-btn')) {
                const session = e.target.dataset.session;
                if (!activeDate) return;

                if (!tempSelectedDatesWithSessions[activeDate]) {
                    tempSelectedDatesWithSessions[activeDate] = {};
                }

                const sessionData = tempSelectedDatesWithSessions[activeDate];
                const capacityInput = document.getElementById(`capacity-${session.toLowerCase()}`);
                const sessionItem = document.getElementById(`session-${session.toLowerCase()}-item`);

                if (sessionData[session]) {
                    delete sessionData[session];
                    e.target.classList.remove('active');
                    sessionItem.classList.remove('active');
                    capacityInput.disabled = true;
                    capacityInput.value = '';
                    if (Object.keys(sessionData).length === 0) {
                        delete tempSelectedDatesWithSessions[activeDate];
                    }
                } else {
                    const capacity = capacityInput.value ? parseInt(capacityInput.value) : null;
                    sessionData[session] = { capacity: capacity };
                    e.target.classList.add('active');
                    sessionItem.classList.add('active');
                    capacityInput.disabled = false;
                    capacityInput.focus();
                }

                renderCalendar();
                updatePreviewDates();
            }
        });

        // Capacity input handlers
        document.addEventListener('input', function(e) {
            if (e.target.id === 'capacity-fn' || e.target.id === 'capacity-an') {
                if (!activeDate) return;
                
                const session = e.target.id === 'capacity-fn' ? 'FN' : 'AN';
                const capacity = e.target.value ? parseInt(e.target.value) : null;
                
                if (tempSelectedDatesWithSessions[activeDate] && 
                    tempSelectedDatesWithSessions[activeDate][session]) {
                    tempSelectedDatesWithSessions[activeDate][session].capacity = capacity;
                    updatePreviewDates();
                }
            }
        });

        function renderCalendar() {
            const monthYear = document.getElementById('monthYear');
            const calendarDays = document.getElementById('calendarDays');
            
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
            
            monthYear.textContent = `${months[currentMonth]} ${currentYear}`;
            
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
            
            calendarDays.innerHTML = '';
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Previous month days
            for (let i = firstDay - 1; i >= 0; i--) {
                const day = daysInPrevMonth - i;
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day other-month';
                dayDiv.innerHTML = `<span class="day-number">${day}</span>`;
                calendarDays.appendChild(dayDiv);
            }
            
            // Current month days
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(currentYear, currentMonth, day);
                dateObj.setHours(0, 0, 0, 0);
                
                if (dateObj.getTime() === today.getTime()) {
                    dayDiv.classList.add('today');
                }
                
                const dayContent = `<span class="day-number">${day}</span>`;
                let sessionContent = '';
                
                if (dateObj < today) {
                    dayDiv.classList.add('past');
                    dayDiv.innerHTML = dayContent;
                } else {
                    if (tempSelectedDatesWithSessions[dateStr]) {
                        dayDiv.classList.add('selected');
                        const sessionData = tempSelectedDatesWithSessions[dateStr];
                        const sessions = Object.keys(sessionData);
                        sessionContent = `<div class="day-sessions">` +
                            sessions.map(s => `<span class="day-session-indicator">${s}</span>`).join('') +
                            `</div>`;
                    }
                    
                    dayDiv.innerHTML = dayContent + sessionContent;
                    
                    dayDiv.onclick = function() {
                        activeDate = dateStr;
                        selectedDateDisplay.textContent = new Date(dateStr).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        
                        sessionSelector.style.display = 'block';
                        
                        // Update session button states and capacity values
                        document.querySelectorAll('.session-btn').forEach(btn => {
                            const session = btn.dataset.session;
                            const capacityInput = document.getElementById(`capacity-${session.toLowerCase()}`);
                            const sessionItem = document.getElementById(`session-${session.toLowerCase()}-item`);
                            
                            if (tempSelectedDatesWithSessions[dateStr] && 
                                tempSelectedDatesWithSessions[dateStr][session]) {
                                btn.classList.add('active');
                                sessionItem.classList.add('active');
                                capacityInput.disabled = false;
                                capacityInput.value = tempSelectedDatesWithSessions[dateStr][session].capacity || '';
                            } else {
                                btn.classList.remove('active');
                                sessionItem.classList.remove('active');
                                capacityInput.disabled = true;
                                capacityInput.value = '';
                            }
                        });

                        sessionSelector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    };
                }
                
                calendarDays.appendChild(dayDiv);
            }
            
            // Next month days
            const totalCells = calendarDays.children.length;
            const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
            for (let i = 1; i <= remainingCells; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day other-month';
                dayDiv.innerHTML = `<span class="day-number">${i}</span>`;
                calendarDays.appendChild(dayDiv);
            }
            
            updatePreviewDates();
        }

        function updatePreviewDates() {
            const container = document.getElementById('previewDates');
            const dates = Object.keys(tempSelectedDatesWithSessions).sort();
            
            if (dates.length === 0) {
                container.innerHTML = '<small style="color: #666;">No dates selected</small>';
            } else {
                container.innerHTML = dates.map(date => {
                    const formatted = new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    const sessionData = tempSelectedDatesWithSessions[date];
                    const sessions = Object.keys(sessionData);
                    return `<div class="preview-date-item">
                        <span>${formatted}</span>
                        <div class="preview-date-sessions">
                            ${sessions.map(s => {
                                const capacity = sessionData[s].capacity;
                                const capacityText = capacity ? ` (${capacity})` : '';
                                return `<span class="preview-session-badge">${s}${capacityText}</span>`;
                            }).join('')}
                        </div>
                    </div>`;
                }).join('');
            }
        }

        

        function updateSelectedDates() {
            const container = document.getElementById('selectedDates');
            const dates = Object.keys(selectedDatesWithSessions).sort();
            
            if (dates.length === 0) {
                container.innerHTML = '<small style="color: #666;">No dates selected</small>';
            } else {
                container.innerHTML = dates.map(date => {
                    const formatted = new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    const sessionData = selectedDatesWithSessions[date];
                    const sessions = Object.keys(sessionData);
                    return `<div class="date-chip">
                        <span>${formatted}</span>
                        <div class="session-badges">
                            ${sessions.map(s => {
                                const capacity = sessionData[s].capacity;
                                const capacityText = capacity ? ` (${capacity})` : '';
                                return `<span class="session-badge">${s}${capacityText}</span>`;
                            }).join('')}
                        </div>
                        <span class="remove-date" onclick="removeDate('${date}')">&times;</span>
                    </div>`;
                }).join('');
            }
        }

        function removeDate(date) {
            delete selectedDatesWithSessions[date];
            updateSelectedDates();
        }

        // Open classroom modal
        const classroomBtn = document.getElementById('classroomBtn');
        if (classroomBtn) {
            classroomBtn.onclick = function() {
                tempSelectedClassrooms = [...selectedClassrooms];
                classroomModal.style.display = 'block';
                
                if (currentBlock && classrooms[currentBlock]) {
                    loadClassrooms(currentBlock);
                }
            };
        }

        // Open unavailability modal
        const unavailabilityBtn = document.getElementById('unavailabilityBtn');
        if (unavailabilityBtn) {
            unavailabilityBtn.onclick = function() {
                unavailabilityModal.style.display = 'block';
                displayTeachers();
            };
        }

        // Close modals
        const closeClassroom = document.getElementById('closeClassroom');
        if (closeClassroom) {
            closeClassroom.onclick = function() {
                classroomModal.style.display = 'none';
            };
        }

        const closeUnavailability = document.getElementById('closeUnavailability');
        if (closeUnavailability) {
            closeUnavailability.onclick = function() {
                unavailabilityModal.style.display = 'none';
            };
        }

        const cancelClassroom = document.getElementById('cancelClassroom');
        if (cancelClassroom) {
            cancelClassroom.onclick = function() {
                classroomModal.style.display = 'none';
            };
        }

        const cancelUnavailability = document.getElementById('cancelUnavailability');
        if (cancelUnavailability) {
            cancelUnavailability.onclick = function() {
                unavailabilityModal.style.display = 'none';
            };
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target === classroomModal) {
                classroomModal.style.display = 'none';
            }
            if (event.target === unavailabilityModal) {
                unavailabilityModal.style.display = 'none';
            }
            if (event.target === datePickerModal) {
                datePickerModal.style.display = 'none';
                sessionSelector.style.display = 'none';
                activeDate = null;
            }
        };

        // Select all classrooms in current block
        function selectAllClassrooms() {
            const currentClassrooms = classrooms[currentBlock] || [];
            currentClassrooms.forEach(room => {
                if (!tempSelectedClassrooms.includes(room)) {
                    tempSelectedClassrooms.push(room);
                }
            });
            loadClassrooms(currentBlock);
        }

        // Load classrooms for selected block
        function loadClassrooms(building) {
            const grid = document.getElementById('classroomGrid');
            grid.innerHTML = '';

            const rooms = classrooms[building] || [];
            rooms.forEach(room => {
                const div = document.createElement('div');
                div.className = 'classroom-item';
                if (tempSelectedClassrooms.includes(room)) {
                    div.classList.add('selected');
                }
                div.textContent = room;

                div.onclick = function() {
                    this.classList.toggle('selected');
                    if (tempSelectedClassrooms.includes(room)) {
                        tempSelectedClassrooms = tempSelectedClassrooms.filter(r => r !== room);
                    } else {
                        tempSelectedClassrooms.push(room);
                    }
                };

                grid.appendChild(div);
            });
        }

        // Confirm classroom selection
        const confirmClassroom = document.getElementById('confirmClassroom');
        if (confirmClassroom) {
            confirmClassroom.onclick = function() {
                selectedClassrooms = [...tempSelectedClassrooms];
                updateSelectedClassrooms();
                classroomModal.style.display = 'none';
            };
        }

        // Update selected classrooms display
        function updateSelectedClassrooms() {
            const container = document.getElementById('selectedClassrooms');
            if (selectedClassrooms.length === 0) {
                container.innerHTML = '<small>No classrooms selected</small>';
            } else {
                container.innerHTML = selectedClassrooms.map(classroom => 
                    `<span class="selected-item">${classroom}<span class="remove-item" onclick="removeClassroom('${classroom}')">&times;</span></span>`
                ).join('');
            }
        }

        // Remove classroom
        function removeClassroom(classroom) {
            selectedClassrooms = selectedClassrooms.filter(c => c !== classroom);
            updateSelectedClassrooms();
        }

        // Add teacher
        const addTeacherBtn = document.getElementById('addTeacher');
        if (addTeacherBtn) {
            addTeacherBtn.onclick = function() {
                const input = document.getElementById('teacherSearch');
                const teacherName = input.value.trim();
                if (teacherName && !teacherList.includes(teacherName)) {
                    teacherList.push(teacherName);
                    input.value = '';
                    displayTeachers();
                }
            };
        }

        // Display teachers
        function displayTeachers() {
            const container = document.getElementById('teacherList');
            container.innerHTML = '';
            
            teacherList.forEach(teacher => {
                const div = document.createElement('div');
                div.className = 'teacher-item';
                if (unavailableTeachers.includes(teacher)) {
                    div.classList.add('unavailable');
                }
                
                div.innerHTML = `
                    <span>${teacher}</span>
                    <button class="toggle-btn" onclick="toggleTeacherAvailability('${teacher}')">
                        ${unavailableTeachers.includes(teacher) ? 'Mark Available' : 'Mark Unavailable'}
                    </button>
                `;
                container.appendChild(div);
            });
        }

        // Toggle teacher availability
        function toggleTeacherAvailability(teacher) {
            if (unavailableTeachers.includes(teacher)) {
                unavailableTeachers = unavailableTeachers.filter(t => t !== teacher);
            } else {
                unavailableTeachers.push(teacher);
            }
            displayTeachers();
        }

        // Confirm unavailability changes
        const confirmUnavailability = document.getElementById('confirmUnavailability');
        if (confirmUnavailability) {
            confirmUnavailability.onclick = function() {
                updateUnavailableTeachers();
                unavailabilityModal.style.display = 'none';
            };
        }

        // Update unavailable teachers display
        function updateUnavailableTeachers() {
            const container = document.getElementById('unavailableTeachers');
            if (unavailableTeachers.length === 0) {
                container.innerHTML = '<small>No teachers marked unavailable</small>';
            } else {
                container.innerHTML = unavailableTeachers.map(teacher => 
                    `<span class="selected-item">${teacher}<span class="remove-item" onclick="removeUnavailableTeacher('${teacher}')">&times;</span></span>`
                ).join('');
            }
        }

        // Remove unavailable teacher
        function removeUnavailableTeacher(teacher) {
            unavailableTeachers = unavailableTeachers.filter(t => t !== teacher);
            updateUnavailableTeachers();
        }

        // Form submission
        // Form submission
// Form submission
const examForm = document.getElementById('examForm');
if (examForm) {
    examForm.onsubmit = async function(e) {
        e.preventDefault();
        
        if (Object.keys(selectedDatesWithSessions).length === 0) {
            showErrorPopup('Please select at least one exam date with sessions!');
            return;
        }

        const formData = {
            examName: document.getElementById('examName').value,
            examDatesWithSessions: selectedDatesWithSessions,
            selectedClassrooms: selectedClassrooms,
            unavailableTeachers: unavailableTeachers
        };
        
        console.log('Exam Data:', formData);
        
        try {
            const response = await fetch('/coe/createExam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log('Full Server Response:', result);

            if (response.ok && result.success) {
                // Extract exam ID from response - your backend returns it in result.exam._id
                const examId = result.exam?._id || result.examId || result.id;
                
                console.log('Extracted Exam ID:', examId);
                
                if (examId) {
                    showSuccessPopup(examId);
                } else {
                    console.error('No exam ID in response:', result);
                    showErrorPopup('Exam created but ID not found. Please refresh and check exam list.');
                }
            } else {
                showErrorPopup(result.message || 'Failed to create exam. Please try again.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showErrorPopup('Network error. Please check your connection and try again.');
        }
    };
}

function confirmLogout() {
        fetch('/login/logout', { credentials: 'include' });
        window.location.href = 'http://localhost:3000';
    }

        // Initialize calendar on load
        renderCalendar();