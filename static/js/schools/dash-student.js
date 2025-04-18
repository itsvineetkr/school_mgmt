document.addEventListener('DOMContentLoaded', function () {
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

const handleResponse = async (response) => {
    if (response.ok) {
        const data = await response.json();
        return data;
    }
    const error = await response.json();
    throw new Error(error.message);
}

function renderQuestions(assessment, containerId, assessmentDetails) {
    const assessmentData = assessment.assessment;

    const container = document.getElementById(containerId);
    // Clear previous questions
    container.innerHTML = '';
    if (assessmentDetails) {
        const assessmentInfo = document.querySelector('.assessment-info');
        assessmentInfo.style.display = 'block';
        // Clear previous assessment details
        assessmentInfo.innerHTML = '';
        // Display assessment details
        assessmentInfo.innerHTML = `
            <h1>Assessment Preview</h1>
            <h2>${assessmentDetails.assessment_name}</h2>
            <p><strong>Description:</strong> ${assessmentDetails.assessment_description}</p>
            <p><strong>Question Types:</strong> ${assessmentDetails.question_types}</p>
            <p><strong>Duration:</strong> ${assessmentDetails.duration} minutes</p>
            <p><strong>Standard:</strong> ${assessmentDetails.standard}</p>
            <p><strong>Number of Questions:</strong> ${assessmentDetails.num_questions}</p>
        `;
    }
    
    assessmentData.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = `question-card ${question['question-type'].toLowerCase()}-question`;
        
        let questionHTML = `
            <div class="question-header">
                <span>Question ${index + 1}</span>
                <span class="question-type">${question['question-type']}</span>
            </div>
            <div class="question-text">${question.question}</div>
        `;
        
        if (question['question-type'] === 'MCQ') {
            questionHTML += `<ul class="options">`;
            question.options.forEach((option, optIndex) => {
                questionHTML += `<li class="option">${String.fromCharCode(65 + optIndex)}. ${option}</li>`;
            });
            questionHTML += `</ul>`;
        } else if (question['question-type'] === 'Written') {
            questionHTML += `<div class="answer-area">Answer area will be available in test mode</div>`;
        }
        
        questionElement.innerHTML = questionHTML;
        container.appendChild(questionElement);
    });
}

document.querySelector('.sb-assessment').addEventListener("click", async function(){
    try {
        const data = await fetch('/assessment/api/get_assessment', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        }).then(handleResponse);
        
        const container = document.querySelector('.see-assessment-container');
        
        if (data.length === 0) {
            container.innerHTML = '<p>No assignments present</p>';
            return;
        }
        
        container.innerHTML = '';
        data.forEach(assessment => {
            const assessmentDiv = document.createElement('div');
            assessmentDiv.className = 'assessment-card';
            assessmentDiv.innerHTML = `
                <div class="assessment-title">${assessment.name}</div>
                <p class="assessment-description">${assessment.description.length > 70 ? assessment.description.substring(0, 70) + '...' : assessment.description}</p>
                <p class="assessment-id">Assessment Id: ${assessment.id}</p>
                <p>Due Date: ${assessment.due_date}</p>
                <p>Standard: ${assessment.standard}</p>
                <p>Section: ${assessment.section}</p>
                <p>Duration: ${assessment.duration} minutes</p>
            `;
            if (assessment.status === 'submitted') {
                assessmentDiv.innerHTML += `<button class="view-assessment ${assessment.id}">View Assessment</button>`;
                assessmentDiv.innerHTML += `<button class="view-result ${assessment.id}">View Result</button>`;
            } else if (assessment.status === 'not_submitted') {
                assessmentDiv.innerHTML += `<a href="/assessment/take-assessment/${assessment.id}">Give Assessment</a>`;
            } else if (assessment.status === 'missed') {
                assessmentDiv.innerHTML += `<button class="view-assessment ${assessment.id}">View Assessment</button>`;
                assessmentDiv.innerHTML += `<div class="missed-assessment">Missed Assessment</div>`;
            }

            container.appendChild(assessmentDiv);
        });

        document.querySelectorAll('.view-assessment').forEach(button => {
            button.addEventListener('click', function() {
                const assessmentId = this.classList[1];
                const selectedAssessment = data.find(a => a.id === parseInt(assessmentId));

                const previewAssessment = document.querySelector('#preview-assessment');

                renderQuestions(selectedAssessment, 'preview-assessment', null);
                previewAssessment.innerHTML = `<h1>Assessment Preview: ${selectedAssessment.name}</h1>` + previewAssessment.innerHTML;
            });
        });

        document.querySelectorAll('.view-result').forEach(button => {
            button.addEventListener('click', function() {
                const assessmentId = this.classList[1];
                const selectedAssessment = data.find(a => a.id === parseInt(assessmentId));

                const previewAssessment = document.querySelector('#preview-assessment');
                previewAssessment.innerHTML = '';
                
                const assessmentResult = document.querySelector('.assessment-result');
                assessmentResult.style.display = 'flex';
                selectedAssessment.remark = selectedAssessment.remark.replace(/\n/g, '<br>');
                assessmentResult.innerHTML = `
                    <h1>Result</h1>
                    <p><span>Total Marks:</span> ${selectedAssessment.max_score}</p>
                    <p><span>Marks Obtained:</span> ${selectedAssessment.obtained_score}</p>
                    <p><span>Remarks:</span> ${selectedAssessment.remark}</p>
                    <button class="close-button">Close</button>
                `;

                const closeButton = document.querySelector('.close-button');
                closeButton.addEventListener('click', function() {
                    assessmentResult.style.display = 'none';
                    previewAssessment.innerHTML = '';
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

document.querySelector('.sb-assessment-comp').addEventListener("click", async function(){
    try {
        const data = await fetch("/assessment/api/get_assessment?competition=ALL_COMPETITIONS", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        }).then(handleResponse);
        
        const container = document.querySelector('.section-assessment-comp .see-assessment-container');
        
        if (data.length === 0) {
            container.innerHTML = '<p>No assignments present</p>';
            return;
        }
        
        container.innerHTML = '';
        data.forEach(assessment => {
            const assessmentDiv = document.createElement('div');
            assessmentDiv.className = 'assessment-card';
            assessmentDiv.innerHTML = `
                <div class="assessment-title">${assessment.name}</div>
                <p>${
                    (() => {
                        const desc = assessment.description;
                        const matches = desc.match(/exam (.*?) in (.*?) on the topic (.*?)\. The difficulty level.*?(easy|medium|hard)/i);
                        if (!matches) return assessment.description.length > 70 ? 
                            assessment.description.substring(0, 70) + '...' : 
                            assessment.description;
                        
                        return `Competition: ${matches[1]}<br>
                                Subject: ${matches[2]}<br>
                                Topic: ${matches[3]}<br>
                                Difficulty: ${matches[4].charAt(0).toUpperCase() + matches[4].slice(1)}`;
                    })()
                }</p>
                <p class="assessment-id">Assessment Id: ${assessment.id}</p>
                <p>Due Date: ${assessment.due_date}</p>
                <p>Standard: ${assessment.standard}</p>
                <p>Section: ${assessment.section}</p>
                <p>Duration: ${assessment.duration} minutes</p>
            `;
            
            console.log(assessment);

            if (assessment.status === 'submitted') {
                assessmentDiv.innerHTML += `<button class="view-assessment ${assessment.id}">View Assessment</button>`;
                assessmentDiv.innerHTML += `<button class="view-result ${assessment.id}">View Result</button>`;
            } else if (assessment.status === 'not_submitted') {
                assessmentDiv.innerHTML += `<a href="/assessment/take-assessment/${assessment.id}">Give Assessment</a>`;
            } else if (assessment.status === 'missed') {
                assessmentDiv.innerHTML += `<button class="view-assessment ${assessment.id}">View Assessment</button>`;
                assessmentDiv.innerHTML += `<div class="missed-assessment">Missed Assessment</div>`;
            }

            container.appendChild(assessmentDiv);
        });

        document.querySelectorAll('.section-assessment-comp .view-assessment').forEach(button => {
            button.addEventListener('click', function() {
                const assessmentId = this.classList[1];
                const selectedAssessment = data.find(a => a.id === parseInt(assessmentId));

                const previewAssessment = document.querySelector('#preview-assessment-comp');

                renderQuestions(selectedAssessment, 'preview-assessment-comp', null);
                previewAssessment.innerHTML = `<h1>Assessment Preview: ${selectedAssessment.name}</h1>` + previewAssessment.innerHTML;
            });
        });

        document.querySelectorAll('.section-assessment-comp .view-result').forEach(button => {
            button.addEventListener('click', function() {
                const assessmentId = this.classList[1];
                const selectedAssessment = data.find(a => a.id === parseInt(assessmentId));

                const previewAssessment = document.querySelector('.preview-assessment-comp');
                previewAssessment.innerHTML = '';
                
                const assessmentResult = document.querySelector('.section-assessment-comp .assessment-result');
                assessmentResult.style.display = 'flex';
                selectedAssessment.remark = selectedAssessment.remark.replace(/\n/g, '<br>');
                assessmentResult.innerHTML = `
                    <h1>Result</h1>
                    <p><span>Total Marks:</span> ${selectedAssessment.max_score}</p>
                    <p><span>Marks Obtained:</span> ${selectedAssessment.obtained_score}</p>
                    <p><span>Remarks:</span> ${selectedAssessment.remark}</p>
                    <button class="close-button">Close</button>
                `;

                const closeButton = document.querySelector('.section-assessment-comp .close-button');
                closeButton.addEventListener('click', function() {
                    assessmentResult.style.display = 'none';
                    previewAssessment.innerHTML = '';
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

document.querySelector('.sb-events').addEventListener("click", async function(){
    try {
        const response = await fetch('/schools/api/event', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        }).then(handleResponse);
        
        const container = document.querySelector('.see-events-container');
        
        if (response.length === 0) {
            container.innerHTML = '<p>No events present</p>';
            return;
        }
        
        container.innerHTML = '';
        const data = response.data;
        data.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'assessment-card';
            eventDiv.innerHTML = `
                <div class="assessment-title">${event.eventName}</div>
                <p class="assessment-description">${event.description}</p>
                <p>Event Date: ${event.date}</p>
                <p>Venue: ${event.venue}</p>
            `;
            container.appendChild(eventDiv);
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

document.querySelector('.sb-attendance').addEventListener("click", async function(){
    try {
        const currentMonth = new Date().getMonth() + 1;  // getMonth() returns 0-11
        
        const response = await fetch(`/schools/api/get_attendance?month=${currentMonth}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        }).then(handleResponse);
        
        console.log(response);
        if (response.status === 200) {
            const attendanceData = response.data;
            const attendanceSection = document.querySelector('.section-attendance');
            
            const attendanceCard = document.createElement('div');
            attendanceCard.className = 'attendance-card';
            
            const monthNames = ["January", "February", "March", "April", "May", "June",
                              "July", "August", "September", "October", "November", "December"];
            
            attendanceCard.innerHTML = `
                <div class="attendance-stats">
                    <h2>${monthNames[attendanceData.month - 1]} Attendance</h2>
                    <div class="stats-container">
                        <div class="stat-item present">
                            <span class="stat-value">${attendanceData.present_days}</span>
                            <span class="stat-label">Present Days</span>
                        </div>
                        <div class="stat-item absent">
                            <span class="stat-value">${attendanceData.absent_days}</span>
                            <span class="stat-label">Absent Days</span>
                        </div>
                        <div class="stat-item percentage">
                            <span class="stat-value">${Math.round((attendanceData.present_days / (attendanceData.present_days + attendanceData.absent_days)) * 100)}%</span>
                            <span class="stat-label">Attendance Rate</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Clear previous content and add new card
            const contentArea = attendanceSection.querySelector('.content-section-title').nextElementSibling;
            if (contentArea) {
                contentArea.innerHTML = '';
                contentArea.appendChild(attendanceCard);
            } else {
                attendanceSection.appendChild(attendanceCard);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
});