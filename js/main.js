/**
 * main.js
 * Shared interactions for all pages
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation if needed in future
    initMobileNav();
    
    // Smooth scrolling for anchor links
    initSmoothScroll();
});

function initMobileNav() {
    // To be implemented if a toggle button is added to navbar
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}
