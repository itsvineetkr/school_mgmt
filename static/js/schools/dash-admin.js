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

document.querySelector(".profile-toggle").style.display = "none";