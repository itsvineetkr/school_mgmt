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

// Utility function to handle API responses
const handleResponse = async (response) => {
	console.log('Response:', response);
	if (response.ok) {
		const data = await response.json();
		return data;
	}
	const error = await response.json();
	throw new Error(error.message);
}

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

document.querySelector('.assessment-info').style.display = 'none';

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

document.querySelector('.confirm-assessment-button').style.display = 'none';
document.querySelector('.generate-assessment-button').innerHTML = 'Generate';

const assessmentForm = document.querySelector('.section-make-assessment form');
const generateButton = assessmentForm.querySelector('.generate-assessment-button');
const confirmButton = assessmentForm.querySelector('.confirm-assessment-button');

// Store assessment data at a higher scope so it's available to both functions
let assessmentData = null;
let assessmentDetails = null;

// Prevent the form from submitting on Enter key or general submission
assessmentForm.addEventListener('submit', function(event) {
	event.preventDefault();
});

// Add click handler specifically for the generate button
generateButton.addEventListener('click', async function(event) {
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
confirmButton.addEventListener('click', async function(event) {
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
	const standard = assessmentForm.querySelector('[name="standard"]').value;
	const dueDate = assessmentForm.querySelector('[name="due_date"]').value;
	const maxTime = assessmentForm.querySelector('[name="max_time"]').value;

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

document.querySelector('.sb-see-assessment').addEventListener("click", async function(){
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
				button.addEventListener('click', async function() {
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
				button.addEventListener('click', function() {
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


document.querySelector('.confirm-assessment-button-comp').style.display = 'none';
document.querySelector('.generate-assessment-button-comp').innerHTML = 'Generate';

const assessmentFormComp = document.querySelector('.section-make-competition-assessment form');
const generateButtonComp = assessmentFormComp.querySelector('.generate-assessment-button-comp');
const confirmButtonComp = assessmentFormComp.querySelector('.confirm-assessment-button-comp');

// Store assessment data at a higher scope so it's available to both functions
let assessmentDataComp = null;
let assessmentDetailsComp = null;

document.querySelector('.assessment-info-comp').style.display = 'none';
// Prevent the form from submitting on Enter key or general submission
assessmentFormComp.addEventListener('submit', function(event) {
	event.preventDefault();
});

// Add click handler specifically for the generate button
generateButtonComp.addEventListener('click', async function(event) {
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
	const topic = assessmentFormComp.querySelector('[name="topic"]').value;
	const standard = assessmentFormComp.querySelector('[name="standard"]').value;
	const dueDate = assessmentFormComp.querySelector('[name="due_date"]').value;
	const maxTime = assessmentFormComp.querySelector('[name="max_time"]').value;
	const difficulty = assessmentFormComp.querySelector('[name="difficulty"]').value;
	const questionTypes = assessmentFormComp.querySelector('[name="question_types"]').value;
	const numQuestions = assessmentFormComp.querySelector('[name="num_questions"]').value;

	let description = `The assessment is for Indian competitive exam ${competitionType} in ${subject} on the topic ${topic}. The difficulty level of the questions should be ${difficulty}.`;
	description += "\n" + "Please create good and correct assessment, only add questions you are sure of and those which you yourself can answer.";

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
		renderQuestions(assessmentDataComp, 'questions-container-comp', assessmentDetails, ".assessment-info-comp");
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

// Add click handler specifically for the confirm button
confirmButtonComp.addEventListener('click', async function(event) {
	event.preventDefault();
	
	// Only proceed if we have assessment data
	if (!assessmentDataComp) {
		alert('Please generate an assessment first');
		return;
	}
	
	// Disable button and show loading animation
	confirmButtonComp.disabled = true;
	let loadingText = "Saving";
	let dotCount = 0;
	const loadingInterval = setInterval(() => {
		dotCount = (dotCount + 1) % 4;
		confirmButtonComp.innerHTML = loadingText + ".".repeat(dotCount);
	}, 400);
	
	const assessmentName = assessmentFormComp.querySelector('[name="assessment_name"]').value;
	const competitionType = assessmentFormComp.querySelector('[name="competition_type"]').value;
	const subject = assessmentFormComp.querySelector('[name="subject"]').value;
	const topic = assessmentFormComp.querySelector('[name="topic"]').value;
	const standard = assessmentFormComp.querySelector('[name="standard"]').value;
	const dueDate = assessmentFormComp.querySelector('[name="due_date"]').value;
	const maxTime = assessmentFormComp.querySelector('[name="max_time"]').value;
	const difficulty = assessmentFormComp.querySelector('[name="difficulty"]').value;
	const questionTypes = assessmentFormComp.querySelector('[name="question_types"]').value;
	const numQuestions = assessmentFormComp.querySelector('[name="num_questions"]').value;

	let description = `The assessment is for Indian competitive exam ${competitionType} in ${subject} on the topic ${topic}. The difficulty level of the questions should be ${difficulty}.`;
	description += "\n" + "Please create good and correct assessment, only add questions you are sure of and those which you yourself can answer.";

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
				assessment: assessmentDataComp,
				due_date: dueDate,
				duration: maxTime
			})
		}).then(handleResponse);
		
		clearInterval(loadingInterval);
		confirmButtonComp.disabled = false;
		confirmButtonComp.innerHTML = 'Confirm';
		alert('Assessment created successfully');
		window.location.reload();
	} catch (error) {
		clearInterval(loadingInterval);
		confirmButtonComp.disabled = false;
		confirmButtonComp.innerHTML = 'Confirm';
		console.error('Error:', error);
		alert('Error saving assessment: ' + (error.message || 'Unknown error'));
	}
});

// Hide confirm button initially
confirmButtonComp.style.display = 'none';