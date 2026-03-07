/**
 * dashboard.js
 * Logic for Dashboard interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // Dashboard initialization logic
    console.log('Dashboard loaded');

    // Add active state to sidebar links based on current URL
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.sidebar-link');

    links.forEach(link => {
        const linkPath = new URL(link.href, window.location.origin).pathname;

        // Exact match or directory index resolution match
        const isMatch = linkPath === currentPath ||
            linkPath === currentPath + '.html' ||
            linkPath === currentPath + '/index.html' ||
            (currentPath.endsWith('/') && linkPath === currentPath + 'index.html');

        if (isMatch) {
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });

    // Profile Dropdown Toggle
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('open');
            }
        });
    }

    // Mock data population if needed
});

function handleLogout() {
    window.location.href = '/auth/login.html';
}
