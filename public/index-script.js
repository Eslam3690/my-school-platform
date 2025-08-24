document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.2 }); // Trigger when 20% of the section is visible

    sections.forEach(section => {
        section.classList.add('hidden');
        observer.observe(section);
    });
});