document.addEventListener('DOMContentLoaded', async function () {
    const sidebarButtons = document.querySelectorAll('.sidebar-button')
    const contentSections = document.querySelectorAll('.content-section')

    contentSections.forEach((section) => (section.style.display = 'none'))

    sidebarButtons.forEach((button) => {
        button.addEventListener('click', function () {
            contentSections.forEach((section) => (section.style.display = 'none'))
            sidebarButtons.forEach((btn) => btn.classList.remove('active'))
            const targetClass = this.getAttribute('data-target')
            const targetSection = document.querySelector(`.${targetClass}`)
            if (targetSection) {
                targetSection.style.display = 'block'
            }
            this.classList.add('active')
        })
    })
})

function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Utility function to handle API responses
const handleResponse = async (response) => {
    if (response.ok) {
        return await response.json()
    }
    const error = await response.json()
    alert(error.message || 'An error occurred')
    throw new Error(error.message)
}

// Add Teacher Form Handler
document.querySelector('.section-add-teacher form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const teacherData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phoneno: parseInt(formData.get('phone')),
        gender: formData.get('gender'),
        dob: new Date().toISOString().split('T')[0] // Current date as default
    }

    try {
        const response = await fetch('api/add_teacher', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(teacherData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Add Student Form Handler
document.querySelector('.section-add-student form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const studentData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phoneno: parseInt(formData.get('phone')),
        gender: formData.get('gender'),
        standard: parseInt(formData.get('class')),
        section: formData.get('section'),
        dob: new Date().toISOString().split('T')[0] // Current date as default
    }

    try {
        const response = await fetch('api/add_student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(studentData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Bulk Add Student Form Handler
document.querySelector('.section-bulk-add-student form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
        const response = await fetch('api/bulk_add_student', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: formData // Send form data directly for file upload
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Remove Student Form Handler
document.querySelector('.section-remove-student form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const studentData = {
        name: formData.get('name'),
        email: formData.get('email')
    }

    try {
        const response = await fetch('api/delete_student', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(studentData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Remove Teacher Form Handler
document.querySelector('.section-remove-teacher form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const teacherData = {
        name: formData.get('name'),
        email: formData.get('email')
    }

    try {
        const response = await fetch('api/delete_teacher', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(teacherData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Update Student Form Handler
document.querySelector('.section-update-student form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const updateData = {
        email: formData.get('email'),
        updates: {}
    };

    const username = formData.get('username').trim();
    if (username) {
        updateData.updates.username = username;
    }

    const standard = formData.get('standard').trim();
    if (standard) {
        updateData.updates.standard = parseInt(standard);
    }

    const section = formData.get('section').trim();
    if (section) {
        updateData.updates.section = section;
    }

    const gender = formData.get('gender').trim();
    if (gender) {
        updateData.updates.gender = gender;
    }

    const dobRaw = formData.get('dob').trim();
    if (dobRaw) {
        const dob = new Date(dobRaw);
        updateData.updates.dob = dob.toISOString().split('T')[0];
    }

    const phoneno = formData.get('phoneno').trim();
    if (phoneno) {
        updateData.updates.phoneno = parseInt(phoneno);
    }

    try {
        const response = await fetch('api/update_student', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Update Teacher Form Handler
document.querySelector('.section-update-teacher form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const updateData = {
        email: formData.get('email'),
        updates: {}
    };

    const username = formData.get('username').trim();
    if (username) {
        updateData.updates.username = username;
    }

    const gender = formData.get('gender').trim();
    if (gender) {
        updateData.updates.gender = gender;
    }

    const dobRaw = formData.get('dob').trim();
    if (dobRaw) {
        const dob = new Date(dobRaw);
        updateData.updates.dob = dob.toISOString().split('T')[0];
    }

    const phoneno = formData.get('phoneno').trim();
    if (phoneno) {
        updateData.updates.phoneno = parseInt(phoneno);
    }

    try {
        const response = await fetch('api/update_teacher', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Assign Class Form Handler
document.querySelector('.section-assign-class form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const assignData = {
        email: formData.get('email'),
        standard: parseInt(formData.get('class')),
        section: formData.get('section')
    }

    try {
        const response = await fetch('api/assign_class_to_teacher', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(assignData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

document.querySelector('.sb-event').addEventListener('click', async (e) => {
    try {
        const response = await fetch('api/event', {
            method: 'GET'
        })
        const data = await response.json()

        const eventSelect = document.querySelector('.event-select')
        eventSelect.innerHTML = ''; // Clear existing options
        data.data.forEach((event) => {
            const option = document.createElement('option')
            option.value = event.id
            option.textContent = event.eventName
            eventSelect.appendChild(option)
        })
    } catch (error) {
        console.error('Error:', error)
    }
})

// Add Event Form Handler
document.querySelector('.section-add-event form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const noticeData = {
        eventName: formData.get('eventName'),
        venue: formData.get('venue'),
        description: formData.get('description'),
        date: formData.get('date')
    }

    try {
        const response = await fetch('api/add_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(noticeData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Delete Event Form Handler
document.querySelector('.section-delete-event form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const deleteData = {
        event_id: formData.get('event')
    }

    try {
        const response = await fetch('api/delete_event', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(deleteData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Fee Status Form Handler
document.querySelector('.section-fee-status form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const form = event.target;
    const standard = form.querySelector('[name="class"]').value;
    const section = form.querySelector('[name="section"]').value;

    try {
        const response = await fetch('api/get_fee_status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ standard: standard, section: section })
        });
        const data = await handleResponse(response);
        
        // Locate the fee status check section.
        const feeSection = document.querySelector('.section-fee-status');
        // Remove any existing table.
        const existingTable = feeSection.querySelector('table');
        if (existingTable) {
            existingTable.remove();
        }

        // Create table elements.
        const studentsListDiv = feeSection.querySelector('.students-list');
        studentsListDiv.innerHTML = '';

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Student', 'Email', 'Fee Amount', 'Due Date', 'Payment Date', 'Status', 'Message'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        // Iterate over the result data
        data.data.forEach(item => {
            const row = document.createElement('tr');
            
            const studentCell = document.createElement('td');
            studentCell.textContent = item.student || '';
            row.appendChild(studentCell);
            
            const emailCell = document.createElement('td');
            emailCell.textContent = item.email || '';
            row.appendChild(emailCell);
            
            const feeAmountCell = document.createElement('td');
            feeAmountCell.textContent = item.fee_amount || '';
            row.appendChild(feeAmountCell);
            
            const dueDateCell = document.createElement('td');
            dueDateCell.textContent = item.due_date || '';
            row.appendChild(dueDateCell);
            
            const paymentDateCell = document.createElement('td');
            paymentDateCell.textContent = item.payment_date || '';
            row.appendChild(paymentDateCell);
            
            const statusCell = document.createElement('td');
            statusCell.textContent = item.status || '';
            row.appendChild(statusCell);
            
            const messageCell = document.createElement('td');
            messageCell.textContent = item.message || '';
            row.appendChild(messageCell);
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        studentsListDiv.appendChild(table);
    } catch (error) {
        console.error('Error:', error);
    }
});

document.querySelector('.sb-unassign').addEventListener('click', async (e) => {
    try {
        const response = await fetch('api/assigned_classes', {
            method: 'GET'
        })
        const data = await response.json()

        const teacherSelect = document.querySelector('.uc-teacher-select')
        const standardSelect = document.querySelector('.uc-standard-select')

        teacherSelect.innerHTML = '<option value="">Select Teacher</option>'
        for (let teacher in data.data){
            const option = document.createElement('option')
            option.value = teacher
            option.textContent = teacher
            teacherSelect.appendChild(option)
        }

        teacherSelect.addEventListener('change', function () {
            const selectedTeacher = this.value
            const classes = data.data[selectedTeacher]

            standardSelect.innerHTML = '<option value="">Select Standard</option>'
            classes.forEach((classItem) => {
                const option = document.createElement('option')
                option.value = classItem
                option.textContent = classItem
                standardSelect.appendChild(option)
            })
        })

    } catch (error) {
        console.error('Error:', error)
    }
})

// Unassign Class Form Handler
document.querySelector('.section-unassign-class form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    let teacherEmail = formData.get('teacher').split('~')[1]
    let standard = formData.get('standard')
    const parts = standard.split('-');
    standard = parts[0];
    const section = parts[1];

    const deleteData = {
        email: teacherEmail,
        standard: standard,
        section: section
    }

    try {
        const response = await fetch('api/unassign_class', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include',
            body: JSON.stringify(deleteData)
        })
        await handleResponse(response)
        e.target.reset()
    } catch (error) {
        console.error('Error:', error)
    }
})

// Attendance Summary Form Handler
document.querySelector('.section-attendance-summary form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const form = event.target;
    const standard = form.querySelector('[name="class"]').value;
    const section = form.querySelector('[name="section"]').value;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;

    try {
        const response = await fetch(`/schools/api/get_attendance?month=${currentMonth}&standard=${standard}&section=${section}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        });
        const data = await handleResponse(response);
        
        const summarySection = document.querySelector('.attendance-summary');
        const existingTable = summarySection.querySelector('table');
        if (existingTable) {
            existingTable.remove();
        }

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Student Name', 'Email', 'Present Days', 'Absent Days'];
        
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.data.forEach(item => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = item.student_name;
            row.appendChild(nameCell);
            
            const emailCell = document.createElement('td');
            emailCell.textContent = item.email;
            row.appendChild(emailCell);
            
            const presentCell = document.createElement('td');
            presentCell.textContent = item.present_days;
            row.appendChild(presentCell);
            
            const absentCell = document.createElement('td');
            absentCell.textContent = item.absent_days;
            row.appendChild(absentCell);
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        summarySection.appendChild(table);
    } catch (error) {
        console.error('Error:', error);
    }
});

// View All Form Handler
document.querySelector('.section-view-all form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const form = event.target;
    const viewType = form.querySelector('[name="view_type"]').value;
    const standard = form.querySelector('[name="standard"]')?.value || '';
    const section = form.querySelector('[name="section"]')?.value || '';

    try {
        let url = viewType === 'students' 
            ? `api/get_all_students?standard=${standard}&section=${section}`
            : 'api/get_all_teachers';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        });
        const data = await handleResponse(response);
        
        const resultsSection = document.querySelector('.results-list');
        resultsSection.innerHTML = '';

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Define headers based on view type
        const headers = viewType === 'students' 
            ? ['Name', 'Email', 'Phone', 'Gender', 'DOB', 'Class', 'Section']
            : ['Name', 'Email', 'Phone', 'Gender', 'DOB'];
        
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.data.forEach(item => {
            const row = document.createElement('tr');
            
            const cells = viewType === 'students' 
                ? [item.username, item.email, item.phoneno, item.gender, item.dob, item.standard, item.section]
                : [item.username, item.email, item.phoneno, item.gender, item.dob];
            
            cells.forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText || '';
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        resultsSection.appendChild(table);
    } catch (error) {
        console.error('Error:', error);
    }
});

// Show/hide student filters based on view type selection
document.querySelector('[name="view_type"]').addEventListener('change', function() {
    const studentFilters = document.querySelector('.student-filters');
    studentFilters.style.display = this.value === 'students' ? 'flex' : 'none';
});

// Send Monthly Attendance Email Handler
document.querySelector('.sb-send-attendance-mail').addEventListener('click', async () => {
    try {
        const response = await fetch('api/send_montly_attendance_mail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'include'
        })
        await handleResponse(response)
        alert('Monthly attendance email sent successfully')
    } catch (error) {
        console.error('Error:', error)
    }
})