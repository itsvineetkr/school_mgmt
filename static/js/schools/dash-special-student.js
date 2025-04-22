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

document.querySelector('.assessment-info').style.display = 'none';
document.querySelector('.confirm-assessment-button').style.display = 'none';
document.querySelector('.generate-assessment-button').innerHTML = 'Generate';

const assessmentForm = document.querySelector('.section-make-assessment form');
const generateButton = assessmentForm.querySelector('.generate-assessment-button');
const confirmButton = assessmentForm.querySelector('.confirm-assessment-button');

// Store assessment data at a higher scope so it's available to both functions
let assessmentData = null;
let assessmentDetails = null;

// Prevent the form from submitting on Enter key or general submission
assessmentForm.addEventListener('submit', function (event) {
    event.preventDefault();
});

// Add click handler specifically for the generate button
generateButton.addEventListener('click', async function (event) {
    event.preventDefault();
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
        renderQuestions(assessmentData, 'questions-container', assessmentDetails);
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

// Add click handler specifically for the confirm button
confirmButton.addEventListener('click', async function (event) {
    event.preventDefault();

    // Only proceed if we have assessment data
    if (!assessmentData) {
        alert('Please generate an assessment first');
        return;
    }

    // Disable button and show loading animation
    confirmButton.disabled = true;
    let loadingText = "Saving";
    let dotCount = 0;
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        confirmButton.innerHTML = loadingText + ".".repeat(dotCount);
    }, 400);

    const assessmentName = assessmentForm.querySelector('[name="assessment_name"]').value;
    const description = assessmentForm.querySelector('[name="description"]').value;
    const dueDate = assessmentForm.querySelector('[name="due_date"]').value;
    const maxTime = assessmentForm.querySelector('[name="max_time"]').value;

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
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Confirm';
        alert('Assessment created successfully');
        window.location.reload();
    } catch (error) {
        clearInterval(loadingInterval);
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Confirm';
        console.error('Error:', error);
        alert('Error saving assessment: ' + (error.message || 'Unknown error'));
    }
});

// Hide confirm button initially
confirmButton.style.display = 'none';