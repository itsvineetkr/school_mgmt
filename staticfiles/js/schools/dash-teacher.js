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


function getCsrfToken() {
	return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

const handleResponse = async (response) => {
	console.log('Response:', response);
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

	console.log(assessmentData)

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
				if (optIndex + 1 == question.answer) {
					questionHTML += `<li class="option correct">${String.fromCharCode(65 + optIndex)}. ${option}</li>`;
				}
				else {
					questionHTML += `<li class="option">${String.fromCharCode(65 + optIndex)}. ${option}</li>`;
				}
			});
			questionHTML += `</ul>`;
		} else if (question['question-type'] === 'Written') {
			questionHTML += `<div class="answer-area">${question.answer}</div>`;
		}

		questionElement.innerHTML = questionHTML;
		container.appendChild(questionElement);
	});
}

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

assessmentForm.addEventListener('submit', function (event) {
	event.preventDefault();
});

assessmentFormComp.addEventListener('submit', function (event) {
	event.preventDefault();
});

document.querySelector('.section-fee-status-update form').addEventListener('submit', async function (event) {
	event.preventDefault();
	const form = event.target;
	const studentEmail = form.querySelector('[name="student_email"]').value;
	const feeAmount = form.querySelector('[name="fee_amount"]').value;
	const dueDate = form.querySelector('[name="due_date"]').value;
	const paymentDate = form.querySelector('[name="payment_date"]').value;
	const status = form.querySelector('[name="status"]').value;

	try {
		const data = await fetch('api/update_fee_status', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			},
			body: JSON.stringify({
				student_email: studentEmail,
				fee_amount: feeAmount,
				due_date: dueDate,
				payment_date: paymentDate,
				status: status
			})
		}).then(handleResponse);
	} catch (error) {
		console.error('Error:', error);
	}
});

document.querySelector('.section-fee-status-check form').addEventListener('submit', async function (event) {
	event.preventDefault();
	const form = event.target;
	// Get inputs; map 'class' input to standard parameter.
	const standard = form.querySelector('[name="class"]').value;
	const section = form.querySelector('[name="section"]').value;

	try {
		const data = await fetch('api/get_fee_status/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			},
			body: JSON.stringify({ standard: standard, section: section })
		}).then(handleResponse);

		// Locate the fee status check section.
		const feeSection = document.querySelector('.section-fee-status-check');
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

document.querySelector('.section-add-attendance form').addEventListener('submit', async function (event) {
	event.preventDefault();
	const form = event.target;
	const classSelect = form.querySelector('select[name="class"]');
	const value = classSelect.value;
	if (!value) {
		alert('Please select a class.');
		return;
	}
	const [standard, section] = value.split('-');

	try {
		const data = await fetch('api/fetch_class_data/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			},
			body: JSON.stringify({ standard: Number(standard), section: section })
		}).then(handleResponse);

		const studentsListDiv = form.querySelector('.students-list');
		studentsListDiv.innerHTML = '';

		// Build a clean attendance table with separate Absent and Present columns.
		const table = document.createElement('table');
		table.classList.add('attendance-table');
		const thead = document.createElement('thead');
		const headerRow = document.createElement('tr');
		['Email', 'Username', 'Absent', 'Present'].forEach(text => {
			const th = document.createElement('th');
			th.textContent = text;
			headerRow.appendChild(th);
		});
		thead.appendChild(headerRow);
		table.appendChild(thead);

		const tbody = document.createElement('tbody');
		data.data.forEach(student => {
			const row = document.createElement('tr');

			// Email cell
			const emailCell = document.createElement('td');
			emailCell.textContent = student.account_id || '';
			row.appendChild(emailCell);

			// Username cell
			const usernameCell = document.createElement('td');
			usernameCell.textContent = student.username || '';
			row.appendChild(usernameCell);

			// Absent cell with radio button
			const absentCell = document.createElement('td');
			const absentRadio = document.createElement('input');
			absentRadio.type = 'radio';
			absentRadio.name = student.account_id;
			absentRadio.value = 'A';
			absentCell.appendChild(absentRadio);
			row.appendChild(absentCell);

			// Present cell with radio button
			const presentCell = document.createElement('td');
			const presentRadio = document.createElement('input');
			presentRadio.type = 'radio';
			presentRadio.name = student.account_id;
			presentRadio.value = 'P';
			presentCell.appendChild(presentRadio);
			row.appendChild(presentCell);

			tbody.appendChild(row);
		});
		table.appendChild(tbody);
		studentsListDiv.appendChild(table);

		// Add a Submit Attendance button if not already present.
		let submitBtn = form.querySelector('#submit-attendance-btn');
		if (!submitBtn) {
			submitBtn = document.createElement('button');
			submitBtn.type = 'button';
			submitBtn.id = 'submit-attendance-btn';
			submitBtn.textContent = 'Submit Attendance';
			form.appendChild(submitBtn);

			submitBtn.addEventListener('click', async function () {
				const attendanceData = {};
				let allAnswered = true;
				data.data.forEach(student => {
					const radios = form.querySelectorAll(`input[name="${student.account_id}"]`);
					let status = '';
					radios.forEach(radio => {
						if (radio.checked) {
							status = radio.value;
						}
					});
					// Validate that each student has a selected radio button.
					if (!status) {
						allAnswered = false;
					} else {
						attendanceData[student.account_id] = status;
					}
				});

				if (!allAnswered) {
					alert('Please mark attendance for each student.');
					return;
				}

				console.log('Attendance Data:', attendanceData);

				try {
					const responseData = await fetch('api/add_attendance', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-CSRFToken': getCsrfToken()
						},
						body: JSON.stringify(attendanceData)
					}).then(handleResponse);

					console.log('Attendance added successfully:', responseData);
					alert('Attendance submitted successfully');
				} catch (error) {
					console.error('Error:', error);
				}
			});
		}
	} catch (error) {
		console.error('Error:', error);
	}
});

document.querySelector('.section-attendance-summary form').addEventListener('submit', async function (event) {
	event.preventDefault();
	const form = event.target;
	const standard = form.querySelector('[name="class"]').value;
	const section = form.querySelector('[name="section"]').value;
	const currentDate = new Date();
	const currentMonth = currentDate.getMonth() + 1;

	try {
		const data = await fetch(`/schools/api/get_attendance?month=${currentMonth}&standard=${standard}&section=${section}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			}
		}).then(handleResponse);

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

document.querySelector('.sb-see-assessment').addEventListener("click", async function () {
	try {
		const data = await fetch('/assessment/api/get_assessment', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			}
		}).then(handleResponse);

		if (data.length === 0) {
			const container = document.querySelector('.see-assessment-container');
			container.innerHTML = '<p>No assignments present</p>';
			return;
		}
		const container = document.querySelector('.see-assessment-container');
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
				<button class="delete-assessment ${assessment.id}">Delete Assessment</button>
				<button class="view-assessment ${assessment.id}">View Assessment</button>
			`;
			container.appendChild(assessmentDiv);

			document.querySelectorAll('.delete-assessment').forEach(button => {
				button.addEventListener('click', async function () {
					const assessmentId = this.classList[1];
					try {
						const responseData = await fetch('/assessment/api/delete_assessment', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'X-CSRFToken': getCsrfToken()
							},
							body: JSON.stringify({ id: assessmentId })
						}).then(handleResponse);

						alert('Assessment deleted successfully');
						window.location.reload();
					} catch (error) {
						console.error('Error:', error);
					}
				});
			});

			document.querySelectorAll('.view-assessment').forEach(button => {
				button.addEventListener('click', function () {
					const assessmentId = this.classList[1];
					const assessmentObj = data.find(obj => String(obj.id) === assessmentId);

					if (assessmentObj) {
						const previewAssessment = document.querySelector('#preview-assessment');
						renderQuestions(assessmentObj.assessment, 'preview-assessment', null);
						previewAssessment.innerHTML = `<h1>Assessment Preview: ${assessmentObj.name}</h1>` + previewAssessment.innerHTML;
					} else {
						alert('Assessment not found');
					}
				});
			});
		});
	} catch (error) {
		console.error('Error:', error);
	}
})

document.querySelector('.sb-see-assessment-comp').addEventListener("click", async function () {
	try {
		const data = await fetch('/assessment/api/get_assessment?competition=ALL_COMPETITIONS', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			}
		}).then(handleResponse);

		if (data.length === 0) {
			const container = document.querySelector('.see-assessment-container-comp');
			container.innerHTML = '<p>No assignments present</p>';
			return;
		}
		const container = document.querySelector('.see-assessment-container-comp');
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
				<button class="delete-assessment ${assessment.id}">Delete Assessment</button>
				<button class="view-assessment ${assessment.id}">View Assessment</button>
			`;
			container.appendChild(assessmentDiv);

			document.querySelectorAll('.see-assessment-container-comp .delete-assessment').forEach(button => {
				button.addEventListener('click', async function () {
					const assessmentId = this.classList[1];
					try {
						const responseData = await fetch('/assessment/api/delete_assessment', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'X-CSRFToken': getCsrfToken()
							},
							body: JSON.stringify({ id: assessmentId })
						}).then(handleResponse);

						alert('Assessment deleted successfully');
						window.location.reload();
					} catch (error) {
						console.error('Error:', error);
					}
				});
			});

			document.querySelectorAll('.see-assessment-container-comp .view-assessment').forEach(button => {
				button.addEventListener('click', function () {
					const assessmentId = this.classList[1];
					const assessmentObj = data.find(obj => String(obj.id) === assessmentId);

					if (assessmentObj) {
						const previewAssessment = document.querySelector('#preview-assessment-comp');
						renderQuestions(assessmentObj.assessment, 'preview-assessment-comp', null);
						previewAssessment.innerHTML = `<h1>Assessment Preview: ${assessmentObj.name}</h1>` + previewAssessment.innerHTML;
					} else {
						alert('Assessment not found');
					}
				});
			});
		});
	} catch (error) {
		console.error('Error:', error);
	}
})

document.querySelectorAll('input[name="fullSyllabus"]').forEach(radio => {
	radio.addEventListener('change', function () {
		const topicInput = document.querySelector('input[name="topic"]');
		if (this.value === 'y') {
			topicInput.style.display = 'none';
			topicInput.value = 'Full Syllabus';
		} else {
			topicInput.style.display = 'block';
			topicInput.value = '';
		}
	});
});

document.querySelector('.sb-see-assessment-results').addEventListener('click', async function () {
	try {
		const data = await fetch('/assessment/api/get_assessment_list', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			}
		}).then(handleResponse);

		const select = document.querySelector('select[name="assessment-id"]');
		data.forEach(assessment => {
			const option = document.createElement('option');
			option.value = assessment.id;
			option.textContent = assessment.name;
			select.appendChild(option);
		});
	} catch (error) {
		console.error('Error:', error);
	}
});

document.querySelector('.section-see-assessment-results form').addEventListener('submit', async function (event) {
	event.preventDefault();
	const assessmentId = this.querySelector('select[name="assessment-id"]').value;

	if (!assessmentId) {
		alert('Please select an assessment');
		return;
	}

	try {
		const data = await fetch(`/assessment/api/get_assessment_submissions?assessment_id=${assessmentId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			}
		}).then(handleResponse);

		const container = document.querySelector('.section-see-assessment-results .students-list');
		container.innerHTML = '';

		const table = document.createElement('table');
		const thead = document.createElement('thead');
		const headerRow = document.createElement('tr');
		['Student Name', 'Email', 'Status', 'Score', 'Maximum Score', 'Remarks'].forEach(header => {
			const th = document.createElement('th');
			th.textContent = header;
			headerRow.appendChild(th);
		});
		thead.appendChild(headerRow);
		table.appendChild(thead);

		const tbody = document.createElement('tbody');
		data.forEach(result => {
			const row = document.createElement('tr');

			const cells = [
				result.student_name,
				result.student_email,
				result.status,
				result.score || '-',
				result.max_score || '-',
				result.remark || '-'
			];

			// Add styles to each cell, with special handling for remarks
			row.childNodes.forEach((td, index) => {
				if (index === 5) { // Remarks column
					td.style.width = '300px';
					td.style.fontSize = '0.9em';
				}
			});

			cells.forEach(cellText => {
				const td = document.createElement('td');
				td.textContent = cellText;
				row.appendChild(td);
			});

			tbody.appendChild(row);
		});

		table.appendChild(tbody);
		container.appendChild(table);
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
	const standard = assessmentForm.querySelector('[name="standard"]').value;
	const dueDate = assessmentForm.querySelector('[name="due_date"]').value;
	const maxTime = assessmentForm.querySelector('[name="max_time"]').value;
	const difficulty = assessmentForm.querySelector('[name="difficulty"]').value;
	const questionTypes = assessmentForm.querySelector('[name="question_types"]').value;
	const numQuestions = assessmentForm.querySelector('[name="num_questions"]').value;

	description += "\n" + "The difficulty level of the questions should be " + difficulty;

	try {
		const data = await fetch('/assessment/api/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			},
			body: JSON.stringify({
				assessment_name: assessmentName,
				assessment_description: description,
				question_types: questionTypes,
				standard: standard,
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
	const standard = assessmentFormComp.querySelector('[name="standard"]').value;
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
		const data = await fetch('/assessment/api/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			},
			body: JSON.stringify({
				assessment_name: assessmentName,
				assessment_description: description,
				question_types: questionTypes,
				standard: standard,
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
	const standard = assessmentForm.querySelector('[name="standard"]').value;
	const dueDate = assessmentForm.querySelector('[name="due_date"]').value;
	const maxTime = assessmentForm.querySelector('[name="max_time"]').value;

	// Collect assessment data from the DOM
	const assessmentData = collectAssessmentDataFromDOM('questions-container');

	try {
		const data = await fetch('/assessment/api/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			},
			body: JSON.stringify({
				assessment_name: assessmentName,
				assessment_description: description,
				standard: standard.split('-')[0],
				section: standard.split('-')[1],
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
	const standard = assessmentForm.querySelector('[name="standard"]').value;
	const dueDate = assessmentForm.querySelector('[name="due_date"]').value;
	const maxTime = assessmentForm.querySelector('[name="max_time"]').value;

	// Collect assessment data from the DOM
	const assessmentData = collectAssessmentDataFromDOM('questions-container-create');

	try {
		const data = await fetch('/assessment/api/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			},
			body: JSON.stringify({
				assessment_name: assessmentName,
				assessment_description: description,
				standard: standard.split('-')[0],
				section: standard.split('-')[1],
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
	const standard = assessmentFormComp.querySelector('[name="standard"]').value;
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
		const data = await fetch('/assessment/api/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCsrfToken()
			},
			body: JSON.stringify({
				assessment_name: assessmentName,
				assessment_description: description,
				standard: standard.split('-')[0],
				section: standard.split('-')[1],
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

document.querySelector('.create-assessment-button').addEventListener('click', async function (event) {
	event.preventDefault()
	document.querySelector('.create-assessment-button').style.display = "none";
	document.querySelector('.confirm-create-assessment-button').style.display = "block";
	assessmentData = [];
	renderEditableQuestions(assessmentData, 'questions-container-create', assessmentDetails);
});