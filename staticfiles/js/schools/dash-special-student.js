const assessmentForm = document.querySelector('.section-make-assessment form');
const generateButton = assessmentForm.querySelector('.generate-assessment-button');
const confirmButton = assessmentForm.querySelector('.confirm-assessment-button');
const assessmentFormComp = document.querySelector('.section-make-competition-assessment form');
const generateButtonComp = assessmentFormComp.querySelector('.generate-assessment-button-comp');
const confirmButtonComp = assessmentFormComp.querySelector('.confirm-assessment-button-comp');

let assessmentDataComp = null;
let assessmentDetailsComp = null;
let assessmentData = null;
let assessmentDetails = null;

document.querySelector('.assessment-info').style.display = 'none';
document.querySelector('.confirm-assessment-button').style.display = 'none';
document.querySelector('.generate-assessment-button').innerHTML = 'Generate';
document.querySelector('.confirm-assessment-button-comp').style.display = 'none';
document.querySelector('.generate-assessment-button-comp').innerHTML = 'Generate';
document.querySelector('.assessment-info-comp').style.display = 'none';
document.querySelector('.confirm-create-assessment-button').style.display = "none";
confirmButtonComp.style.display = 'none';
confirmButton.style.display = 'none';


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

function renderEditableQuestions(assessmentData, containerId, assessmentDetails, infoContainerId = '.assessment-info') {
    const container = document.getElementById(containerId);
    // Clear previous questions
    container.innerHTML = '';

    if (assessmentDetails) {
        const assessmentInfo = document.querySelector(infoContainerId);
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

    // Create the editable questions container with class for styling
    const editableContainer = document.createElement('div');
    editableContainer.className = 'editable-assessment-container';

    assessmentData.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = `question-card editable-question ${question['question-type'].toLowerCase()}-question`;
        questionElement.dataset.questionIndex = index;
        questionElement.dataset.questionType = question['question-type'];

        // Create the question content structure
        let questionHTML = `
        <div class="question-header">
            <span class="question-number">Question ${index + 1}</span>
            <span class="question-type-label">${question['question-type']}</span>
        </div>
        <div class="question-content">
            <div class="question-text-container">
                <label>Question:</label>
                <div class="editable-field question-text" contenteditable="true" data-field="question">${question.question}</div>
            </div>
        `;

        if (question['question-type'] === 'MCQ') {
            questionHTML += `<div class="options-container">
                <label>Options:</label>
                <ul class="editable-options">`;

            question.options.forEach((option, optIndex) => {
                questionHTML += `
                <li class="option-item">
                    <span class="option-label">${String.fromCharCode(65 + optIndex)}.</span>
                    <div class="editable-field option-text" contenteditable="true" data-option-index="${optIndex}">${option}</div>
                </li>`;
            });

            // Add more options if less than 4
            for (let i = question.options.length; i < 4; i++) {
                questionHTML += `
                <li class="option-item">
                    <span class="option-label">${String.fromCharCode(65 + i)}.</span>
                    <div class="editable-field option-text" contenteditable="true" data-option-index="${i}">Option ${i + 1}</div>
                </li>`;
            }

            questionHTML += `</ul>
                <div class="answer-selection">
                    <label>Correct Answer:</label>
                    <select class="mcq-answer-select">`;

            for (let i = 0; i < 4; i++) {
                const selected = question.answer === i ? 'selected' : '';
                questionHTML += `<option value="${i}" ${selected}>${String.fromCharCode(65 + i)}</option>`;
            }

            questionHTML += `</select>
                </div>
            </div>`;
        } else if (question['question-type'] === 'Written') {
            questionHTML += `<div class="answer-container">
                <label>Answer:</label>
                <div class="editable-field answer-text" contenteditable="true" data-field="answer">${question.answer || ''}</div>
            </div>`;
        }

        // Add question control buttons
        questionHTML += `
        <div class="question-controls">
            <button type="button" class="question-control-btn delete-question-btn">Delete Question</button>
        </div>
        </div>`;

        questionElement.innerHTML = questionHTML;
        editableContainer.appendChild(questionElement);
    });

    // Add button to add a new question
    const addQuestionContainer = document.createElement('div');
    addQuestionContainer.className = 'add-question-container';
    addQuestionContainer.innerHTML = `
        <button type="button" class="add-question-btn">+ Add New Question</button>
        <div class="add-question-type-selector" style="display: none;">
            <button type="button" class="add-mcq-btn">Multiple Choice</button>
            <button type="button" class="add-written-btn">Written Answer</button>
        </div>
    `;
    editableContainer.appendChild(addQuestionContainer);

    // Append the editable container to the main container
    container.appendChild(editableContainer);

    // Attach event listeners for editable assessment
    attachEditableAssessmentListeners(container);
}

function renderQuestions(assessmentData, containerId, assessmentDetails, infoContainerId = '.assessment-info') {
    const container = document.getElementById(containerId);
    // Clear previous questions
    container.innerHTML = '';
    if (assessmentDetails) {
        const assessmentInfo = document.querySelector(infoContainerId);
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

document.querySelector('.sb-assessment').addEventListener("click", async function () {
    try {
        const data = await fetch('/assessment/api/get_assessments_student', {
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
            button.addEventListener('click', function () {
                const assessmentId = this.classList[1];
                const selectedAssessment = data.find(a => a.id === parseInt(assessmentId));
                const previewAssessment = document.querySelector('#preview-assessment');

                renderQuestions(selectedAssessment.assessment, 'preview-assessment', null);
                previewAssessment.innerHTML = `<h1>Assessment Preview: ${selectedAssessment.name}</h1>` + previewAssessment.innerHTML;
            });
        });

        document.querySelectorAll('.view-result').forEach(button => {
            button.addEventListener('click', function () {
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
                closeButton.addEventListener('click', function () {
                    assessmentResult.style.display = 'none';
                    previewAssessment.innerHTML = '';
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

document.querySelector('.sb-assessment-comp').addEventListener("click", async function () {
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
                <p>${(() => {
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
            button.addEventListener('click', function () {
                const assessmentId = this.classList[1];
                const selectedAssessment = data.find(a => a.id === parseInt(assessmentId));

                const previewAssessment = document.querySelector('#preview-assessment-comp');

                renderQuestions(selectedAssessment, 'preview-assessment-comp', null);
                previewAssessment.innerHTML = `<h1>Assessment Preview: ${selectedAssessment.name}</h1>` + previewAssessment.innerHTML;
            });
        });

        document.querySelectorAll('.section-assessment-comp .view-result').forEach(button => {
            button.addEventListener('click', function () {
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
                closeButton.addEventListener('click', function () {
                    assessmentResult.style.display = 'none';
                    previewAssessment.innerHTML = '';
                });
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

document.querySelector('.sb-events').addEventListener("click", async function () {
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

document.querySelector('.sb-attendance').addEventListener("click", async function () {
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

generateButton.addEventListener('click', async function (event) {
    event.preventDefault();
    console.log("hua bhai kuch to")
    // Disable button and show loading animation
    generateButton.disabled = true;
    let loadingText = "Generating";
    let dotCount = 0;
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        generateButton.innerHTML = loadingText + ".".repeat(dotCount);
    }, 400);

    const assessmentName = assessmentForm.querySelector('[name="assessment_name"]').value;
    let description = assessmentForm.querySelector('[name="description"]').value;
    const dueDate = assessmentForm.querySelector('[name="due_date"]').value;
    const maxTime = assessmentForm.querySelector('[name="max_time"]').value;
    const difficulty = assessmentForm.querySelector('[name="difficulty"]').value;
    const questionTypes = assessmentForm.querySelector('[name="question_types"]').value;
    const numQuestions = assessmentForm.querySelector('[name="num_questions"]').value;

    description += "\n" + "The difficulty level of the questions should be " + difficulty;

    try {
        const data = await fetch('/assessment/api/generate_assessment_student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                assessment_name: assessmentName,
                assessment_description: description,
                question_types: questionTypes,
                num_questions: numQuestions,
                duration: maxTime,
            })
        }).then(handleResponse);

        // Clear loading animation
        clearInterval(loadingInterval);
        generateButton.disabled = false;

        assessmentData = data.assessment;
        assessmentDetails = data.details;
        renderEditableQuestions(assessmentData, 'questions-container', assessmentDetails);
        confirmButton.style.display = 'block';
        generateButton.innerHTML = 'Regenerate';
    } catch (error) {
        // Clear loading animation on error too
        clearInterval(loadingInterval);
        generateButton.disabled = false;
        generateButton.innerHTML = 'Generate';
        console.error('Error:', error);
        alert('Error generating assessment: ' + (error.message || 'Unknown error'));
    }
});

generateButtonComp.addEventListener('click', async function (event) {
    event.preventDefault();

    // Disable button and show loading animation
    generateButtonComp.disabled = true;
    let loadingText = "Generating";
    let dotCount = 0;
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        generateButtonComp.innerHTML = loadingText + ".".repeat(dotCount);
    }, 400);

    const assessmentName = assessmentFormComp.querySelector('[name="assessment_name"]').value;
    const competitionType = assessmentFormComp.querySelector('[name="competition_type"]').value;
    const subject = assessmentFormComp.querySelector('[name="subject"]').value;
    const fullSyllabus = assessmentFormComp.querySelector('input[name="fullSyllabus"]:checked').value;
    const topic = assessmentFormComp.querySelector('[name="topic"]').value;
    const dueDate = assessmentFormComp.querySelector('[name="due_date"]').value;
    const maxTime = assessmentFormComp.querySelector('[name="max_time"]').value;
    const difficulty = assessmentFormComp.querySelector('[name="difficulty"]').value;
    const questionTypes = assessmentFormComp.querySelector('[name="question_types"]').value;
    const numQuestions = assessmentFormComp.querySelector('[name="num_questions"]').value;
    let description = ""
    if (fullSyllabus === 'n') {
        description = `The assessment is for Indian competitive exam ${competitionType} for subject ${subject} on the topic ${topic}. The difficulty level of the questions should be ${difficulty}.`;
        description += "\n" + "Please create good and correct assessment, only add questions you are sure of and those which you yourself can answer.";
    } else {
        description = `The assessment is for Indian competitive exam ${competitionType} for subject ${subject} consisting of full syllabus (having most of the topics from whole general syllabus). The difficulty level of the questions should be ${difficulty}.`;
        description += "\n" + "Please create good and correct assessment, only add questions you are sure of and those which you yourself can answer.";
    }

    try {
        const data = await fetch('/assessment/api/generate_assessment_student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                assessment_name: assessmentName,
                assessment_description: description,
                question_types: questionTypes,
                num_questions: numQuestions,
                duration: maxTime,
            })
        }).then(handleResponse);

        // Clear loading animation
        clearInterval(loadingInterval);
        generateButtonComp.disabled = false;

        assessmentDataComp = data.assessment;
        assessmentDetails = data.details;
        assessmentDetails.assessment_description = assessmentDetails.assessment_description.split('Please create good and correct assessment, only add questions you')[0];
        renderEditableQuestions(assessmentDataComp, 'questions-container-comp', assessmentDetails, ".assessment-info-comp");
        confirmButtonComp.style.display = 'block';
        generateButtonComp.innerHTML = 'Regenerate';
    } catch (error) {
        // Clear loading animation on error too
        clearInterval(loadingInterval);
        generateButtonComp.disabled = false;
        generateButtonComp.innerHTML = 'Generate';
        console.error('Error:', error);
        alert('Error generating assessment: ' + (error.message || 'Unknown error'));
    }
});


function attachEditableAssessmentListeners(container) {
    // Delete question button
    container.querySelectorAll('.delete-question-btn').forEach(button => {
        button.addEventListener('click', function () {
            if (confirm('Are you sure you want to delete this question?')) {
                const questionCard = this.closest('.question-card');
                questionCard.remove();
                updateQuestionNumbers(container);
            }
        });
    });

    // Add new question button
    const addQuestionBtn = container.querySelector('.add-question-btn');
    const typeSelectorDiv = container.querySelector('.add-question-type-selector');

    addQuestionBtn.addEventListener('click', function () {
        typeSelectorDiv.style.display = typeSelectorDiv.style.display === 'none' ? 'flex' : 'none';
    });

    // Add MCQ question button
    container.querySelector('.add-mcq-btn').addEventListener('click', function () {
        addNewQuestion(container, 'MCQ');
        typeSelectorDiv.style.display = 'none';
    });

    // Add Written question button
    container.querySelector('.add-written-btn').addEventListener('click', function () {
        addNewQuestion(container, 'Written');
        typeSelectorDiv.style.display = 'none';
    });
}

function updateQuestionNumbers(container) {
    container.querySelectorAll('.question-card').forEach((card, index) => {
        card.querySelector('.question-number').textContent = `Question ${index + 1}`;
        card.dataset.questionIndex = index;
    });
}

function addNewQuestion(container, questionType) {
    // Important fix: Get the editable container, not the outer container
    const editableContainer = container.querySelector('.editable-assessment-container');
    const questions = editableContainer.querySelectorAll('.question-card');
    const newIndex = questions.length;

    const newQuestion = document.createElement('div');
    newQuestion.className = `question-card editable-question ${questionType.toLowerCase()}-question`;
    newQuestion.dataset.questionIndex = newIndex;
    newQuestion.dataset.questionType = questionType;

    let questionHTML = `
    <div class="question-header">
        <span class="question-number">Question ${newIndex + 1}</span>
        <span class="question-type-label">${questionType}</span>
    </div>
    <div class="question-content">
        <div class="question-text-container">
            <label>Question:</label>
            <div class="editable-field question-text" contenteditable="true" data-field="question">Enter your question here</div>
        </div>
    `;

    if (questionType === 'MCQ') {
        questionHTML += `<div class="options-container">
            <label>Options:</label>
            <ul class="editable-options">
                <li class="option-item">
                    <span class="option-label">A.</span>
                    <div class="editable-field option-text" contenteditable="true" data-option-index="0">Option 1</div>
                </li>
                <li class="option-item">
                    <span class="option-label">B.</span>
                    <div class="editable-field option-text" contenteditable="true" data-option-index="1">Option 2</div>
                </li>
                <li class="option-item">
                    <span class="option-label">C.</span>
                    <div class="editable-field option-text" contenteditable="true" data-option-index="2">Option 3</div>
                </li>
                <li class="option-item">
                    <span class="option-label">D.</span>
                    <div class="editable-field option-text" contenteditable="true" data-option-index="3">Option 4</div>
                </li>
            </ul>
            <div class="answer-selection">
                <label>Correct Answer:</label>
                <select class="mcq-answer-select">
                    <option value="0">A</option>
                    <option value="1">B</option>
                    <option value="2">C</option>
                    <option value="3">D</option>
                </select>
            </div>
        </div>`;
    } else if (questionType === 'Written') {
        questionHTML += `<div class="answer-container">
            <label>Answer:</label>
            <div class="editable-field answer-text" contenteditable="true" data-field="answer"></div>
        </div>`;
    }

    // Add question control buttons
    questionHTML += `
    <div class="question-controls">
        <button type="button" class="question-control-btn delete-question-btn">Delete Question</button>
    </div>
    </div>`;

    newQuestion.innerHTML = questionHTML;

    // Insert the new question before the add-question container
    const addQuestionContainer = editableContainer.querySelector('.add-question-container');
    editableContainer.insertBefore(newQuestion, addQuestionContainer);

    // We no longer need to update move buttons

    // Attach event listeners to the new question
    attachEditableQuestionListeners(newQuestion);
}

function attachEditableQuestionListeners(questionElement) {
    // Delete question button
    questionElement.querySelector('.delete-question-btn').addEventListener('click', function () {
        if (confirm('Are you sure you want to delete this question?')) {
            const container = questionElement.closest('.editable-assessment-container');
            questionElement.remove();
            updateQuestionNumbers(container.closest('[id^="questions-container"]'));
        }
    });
}

function collectAssessmentDataFromDOM(containerId) {
    const container = document.getElementById(containerId);
    const questionCards = container.querySelectorAll('.question-card');

    const assessmentData = [];

    questionCards.forEach((card) => {
        const questionType = card.dataset.questionType;
        const questionText = card.querySelector('.question-text').textContent.trim();

        const questionData = {
            'question-type': questionType,
            'question': questionText
        };

        if (questionType === 'MCQ') {
            const options = [];
            card.querySelectorAll('.option-text').forEach(option => {
                options.push(option.textContent.trim());
            });
            questionData.options = options;

            // Get selected answer
            const answerSelect = card.querySelector('.mcq-answer-select');
            questionData.answer = parseInt(answerSelect.value) + 1;
        } else if (questionType === 'Written') {
            const answerText = card.querySelector('.answer-text');
            if (answerText && answerText.textContent.trim()) {
                questionData.answer = answerText.textContent.trim();
            }
        }

        assessmentData.push(questionData);
    });

    return assessmentData;
}

document.querySelector('.create-assessment-button').addEventListener('click', async function (event) {
    event.preventDefault()
    document.querySelector('.create-assessment-button').style.display = "none";
    document.querySelector('.confirm-create-assessment-button').style.display = "block";
    assessmentData = [];
    renderEditableQuestions(assessmentData, 'questions-container-create', assessmentDetails);
});

document.querySelector('.confirm-assessment-button').addEventListener('click', async function (event) {
    event.preventDefault();

    // Check if there are questions in the assessment
    const questionsContainer = document.getElementById('questions-container');
    if (!questionsContainer.querySelector('.question-card')) {
        alert('Please generate an assessment first');
        return;
    }

    // Disable button and show loading animation
    this.disabled = true;
    let loadingText = "Saving";
    let dotCount = 0;
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        this.innerHTML = loadingText + ".".repeat(dotCount);
    }, 400);

    // Gather form data
    const assessmentForm = document.querySelector('.section-make-assessment form');
    const assessmentName = assessmentForm.querySelector('[name="assessment_name"]').value;
    const description = assessmentForm.querySelector('[name="description"]').value;
    const dueDate = assessmentForm.querySelector('[name="due_date"]').value;
    const maxTime = assessmentForm.querySelector('[name="max_time"]').value;

    // Collect assessment data from the DOM
    const assessmentData = collectAssessmentDataFromDOM('questions-container');

    try {
        const data = await fetch('/assessment/api/save_assessment_student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                assessment_name: assessmentName,
                assessment_description: description,
                assessment: assessmentData,
                due_date: dueDate,
                duration: maxTime
            })
        }).then(handleResponse);

        clearInterval(loadingInterval);
        this.disabled = false;
        this.innerHTML = 'Confirm';
        alert('Assessment created successfully');
        window.location.reload();
    } catch (error) {
        clearInterval(loadingInterval);
        this.disabled = false;
        this.innerHTML = 'Confirm';
        console.error('Error:', error);
        alert('Error saving assessment: ' + (error.message || 'Unknown error'));
    }
});

document.querySelector('.confirm-create-assessment-button').addEventListener('click', async function (event) {
    event.preventDefault();

    // Check if there are questions in the assessment
    const questionsContainer = document.getElementById('questions-container-create');
    if (!questionsContainer.querySelector('.question-card')) {
        alert('Please generate an assessment first');
        return;
    }

    // Disable button and show loading animation
    this.disabled = true;
    let loadingText = "Saving";
    let dotCount = 0;
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        this.innerHTML = loadingText + ".".repeat(dotCount);
    }, 400);

    // Gather form data
    const assessmentForm = document.querySelector('.section-create-assessment form');
    const assessmentName = assessmentForm.querySelector('[name="assessment_name"]').value;
    const description = assessmentForm.querySelector('[name="description"]').value;
    const dueDate = assessmentForm.querySelector('[name="due_date"]').value;
    const maxTime = assessmentForm.querySelector('[name="max_time"]').value;

    // Collect assessment data from the DOM
    const assessmentData = collectAssessmentDataFromDOM('questions-container-create');

    try {
        const data = await fetch('/assessment/api/save_assessment_student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                assessment_name: assessmentName,
                assessment_description: description,
                assessment: assessmentData,
                due_date: dueDate,
                duration: maxTime
            })
        }).then(handleResponse);

        clearInterval(loadingInterval);
        this.disabled = false;
        this.innerHTML = 'Confirm';
        alert('Assessment created successfully');
        window.location.reload();
    } catch (error) {
        clearInterval(loadingInterval);
        this.disabled = false;
        this.innerHTML = 'Confirm';
        console.error('Error:', error);
        alert('Error saving assessment: ' + (error.message || 'Unknown error'));
    }
});

document.querySelector('.confirm-assessment-button-comp').addEventListener('click', async function (event) {
    event.preventDefault();

    // Check if there are questions in the assessment
    const questionsContainer = document.getElementById('questions-container-comp');
    if (!questionsContainer.querySelector('.question-card')) {
        alert('Please generate an assessment first');
        return;
    }

    // Disable button and show loading animation
    this.disabled = true;
    let loadingText = "Saving";
    let dotCount = 0;
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        this.innerHTML = loadingText + ".".repeat(dotCount);
    }, 400);

    // Gather form data
    const assessmentFormComp = document.querySelector('.section-make-competition-assessment form');
    const assessmentName = assessmentFormComp.querySelector('[name="assessment_name"]').value;
    const competitionType = assessmentFormComp.querySelector('[name="competition_type"]').value;
    const subject = assessmentFormComp.querySelector('[name="subject"]').value;
    const fullSyllabus = assessmentFormComp.querySelector('input[name="fullSyllabus"]:checked').value;
    const topic = assessmentFormComp.querySelector('[name="topic"]').value;
    const dueDate = assessmentFormComp.querySelector('[name="due_date"]').value;
    const maxTime = assessmentFormComp.querySelector('[name="max_time"]').value;
    const difficulty = assessmentFormComp.querySelector('[name="difficulty"]').value;

    // Prepare description
    let description = "";
    if (fullSyllabus === 'n') {
        description = `The assessment is for Indian competitive exam ${competitionType} for subject ${subject} on the topic ${topic}. The difficulty level of the questions should be ${difficulty}.`;
        description += "\n" + "Please create good and correct assessment, only add questions you are sure of and those which you yourself can answer.";
    } else {
        description = `The assessment is for Indian competitive exam ${competitionType} for subject ${subject} consisting of full syllabus (having most of the topics from whole general syllabus). The difficulty level of the questions should be ${difficulty}.`;
        description += "\n" + "Please create good and correct assessment, only add questions you are sure of and those which you yourself can answer.";
    }

    // Collect assessment data from the DOM
    const assessmentData = collectAssessmentDataFromDOM('questions-container-comp');

    try {
        const data = await fetch('/assessment/api/save_assessment_student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                assessment_name: assessmentName,
                assessment_description: description,
                competition: competitionType,
                assessment: assessmentData,
                due_date: dueDate,
                duration: maxTime
            })
        }).then(handleResponse);

        clearInterval(loadingInterval);
        this.disabled = false;
        this.innerHTML = 'Confirm';
        alert('Assessment created successfully');
        window.location.reload();
    } catch (error) {
        clearInterval(loadingInterval);
        this.disabled = false;
        this.innerHTML = 'Confirm';
        console.error('Error:', error);
        alert('Error saving assessment: ' + (error.message || 'Unknown error'));
    }
});
