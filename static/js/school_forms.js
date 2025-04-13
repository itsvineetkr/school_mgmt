// Utility function to handle API responses
const handleResponse = (response) => {
  if (response.ok) {
    return response.json().then((data) => {
      alert(data.message || "Operation successful");
      return data;
    });
  }
  return response.json().then((error) => {
    alert(error.message || "An error occurred");
    throw new Error(error.message);
  });
};

// Add Teacher Form Handler
document
  .querySelector(".section-add-teacher form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const teacherData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phoneno: parseInt(formData.get("phone")),
      gender: formData.get("gender"),
      dob: new Date().toISOString().split("T")[0], // Current date as default
    };

    try {
      const response = await fetch("schools/api/add_teacher/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(teacherData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Add Student Form Handler
document
  .querySelector(".section-add-student form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const studentData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phoneno: parseInt(formData.get("phone")),
      gender: formData.get("gender"),
      standard: parseInt(formData.get("class")),
      section: formData.get("section"),
      dob: new Date().toISOString().split("T")[0], // Current date as default
    };

    try {
      const response = await fetch("schools/api/add_student/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(studentData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Bulk Add Student Form Handler
document
  .querySelector(".section-bulk-add-student form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch("schools/api/bulk_add_student/", {
        method: "POST",
        body: formData, // Send form data directly for file upload
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Remove Student Form Handler
document
  .querySelector(".section-remove-student form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const studentData = {
      name: formData.get("name"),
      email: formData.get("email"),
    };

    try {
      const response = await fetch("schools/api/delete_student/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(studentData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Remove Teacher Form Handler
document
  .querySelector(".section-remove-teacher form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const teacherData = {
      name: formData.get("name"),
      email: formData.get("email"),
    };

    try {
      const response = await fetch("schools/api/delete_teacher/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(teacherData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Update Student Form Handler
document
  .querySelector(".section-update-student form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const updateData = {
      email: formData.get("email"),
      updates: {
        username: formData.get("name"),
        phoneno: formData.get("phone"),
      },
    };

    try {
      const response = await fetch("schools/api/update_student/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(updateData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Update Teacher Form Handler
document
  .querySelector(".section-update-teacher form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const updateData = {
      email: formData.get("email"),
      updates: {
        username: formData.get("name"),
        phoneno: formData.get("phone"),
      },
    };

    try {
      const response = await fetch("schools/api/update_teacher/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(updateData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Assign Class Form Handler
document
  .querySelector(".section-assign-class form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const assignData = {
      email: formData.get("email"),
      standard: parseInt(formData.get("class")),
      section: formData.get("section"),
    };

    try {
      const response = await fetch("schools/api/assign_class_to_teacher/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(assignData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

document.querySelector(".sb-event").addEventListener("click", async (e) => {
  try {
    const response = await fetch("schools/api/event", {
      method: "GET",
    });
    const data = await response.json();

    const eventSelect = document.querySelector(".event-select");
    data.data.forEach((event) => {
      const option = document.createElement("option");
      option.value = event.id;
      option.textContent = event.eventName;
      eventSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error:", error);
  }
});

// Add Event Form Handler
document
  .querySelector(".section-add-event form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const noticeData = {
      eventName: formData.get("eventName"),
      venue: formData.get("venue"),
      description: formData.get("description"),
      date: formData.get("date"),
    };

    try {
      const response = await fetch("schools/api/add_event/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(noticeData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });

// Delete Event Form Handler
document
  .querySelector(".section-delete-event form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const deleteData = {
      event_id: formData.get("event"),
    };

    try {
      const response = await fetch("schools/api/delete_event/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": JSON.stringify(deleteData),
        },
      });
      await handleResponse(response);
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
    }
  });
