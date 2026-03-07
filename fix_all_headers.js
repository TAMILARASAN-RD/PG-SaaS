const fs = require('fs');
const path = require('path');

const BASE = 'e:\\projects\\pg saas';

// The exact navbar HTML from index.html (lines 28-51)
const navbarHTML = `    <!-- Navbar -->
    <nav class="navbar">
        <div class="container">
            <a href="index.html" class="logo">
                <div class="logo-icon">
                    <i data-lucide="building-2" style="color: white; width: 24px; height: 24px;"></i>
                </div>
                <span>StayWise</span>
            </a>

            <ul class="nav-links">
                <li><a href="features.html" class="nav-link">Features</a></li>
                <li><a href="pricing.html" class="nav-link">Pricing</a></li>
                <li><a href="about.html" class="nav-link">About</a></li>
                <li><a href="blogs.html" class="nav-link">Blogs</a></li>
                <li><a href="contact.html" class="nav-link">Contact</a></li>
            </ul>

            <div class="nav-actions">
                <a href="auth/login.html" class="nav-link">Log in</a>
                <a href="auth/signup.html" class="btn btn-primary">Start as Owner</a>
            </div>
        </div>
    </nav>`;

// The CSS links and Lucide script that index.html uses
const indexHeadDeps = `    <!-- Lucide Icons (via CDN for simplicity, or SVG) -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- Project Styles (same as index.html for consistent header) -->
    <link rel="stylesheet" href="css/variables.css">
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/staywise-imported.css">`;

// Pages to fix and their active link
const pages = [
    { file: 'features.html', activeLink: 'features.html' },
    { file: 'pricing.html', activeLink: 'pricing.html' },
    { file: 'about.html', activeLink: 'about.html' },
    { file: 'blogs.html', activeLink: 'blogs.html' },
    { file: 'contact.html', activeLink: 'contact.html' },
];

pages.forEach(({ file, activeLink }) => {
    const filePath = path.join(BASE, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    console.log(`\n--- Processing ${file} ---`);

    // 1. Add index.html CSS + Lucide to <head> (after the Google Fonts link)
    // Check if already has lucide
    if (!content.includes('unpkg.com/lucide')) {
        // Insert after the Google Fonts link line
        const fontsLine = `family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
        const fontsIdx = content.indexOf(fontsLine);
        if (fontsIdx !== -1) {
            const insertPos = fontsIdx + fontsLine.length;
            content = content.slice(0, insertPos) + '\n\n' + indexHeadDeps + '\n' + content.slice(insertPos);
            console.log('  Added CSS + Lucide deps to <head>');
        } else {
            console.log('  WARNING: Could not find Google Fonts line to insert after');
        }
    } else {
        console.log('  Lucide already present, skipping head deps');
    }

    // 2. Replace <header id="header-placeholder" class="header"></header> with exact navbar
    // Set the active link for this page
    let pageNavbar = navbarHTML.replace(
        `href="${activeLink}" class="nav-link"`,
        `href="${activeLink}" class="nav-link active"`
    );

    const headerPlaceholder = `<header id="header-placeholder" class="header"></header>`;
    if (content.includes(headerPlaceholder)) {
        content = content.replace(headerPlaceholder, pageNavbar);
        console.log('  Replaced header-placeholder with exact navbar HTML');
    } else {
        console.log('  WARNING: header-placeholder not found');
    }

    // 3. Add lucide.createIcons() before </body> if not already present
    if (!content.includes('lucide.createIcons()')) {
        content = content.replace('</body>', `    <script>lucide.createIcons();</script>\n</body>`);
        console.log('  Added lucide.createIcons() call');
    } else {
        console.log('  lucide.createIcons() already present');
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  Saved ${file}`);
});

// 4. Update staywise-shared-snippets.js to skip header injection if navbar already exists
const snippetsPath = path.join(BASE, 'js', 'staywise-shared-snippets.js');
let snippets = fs.readFileSync(snippetsPath, 'utf-8');

// Replace the header placeholder section to check if navbar exists first
const oldHeaderCheck = `const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {`;
const newHeaderCheck = `const headerPlaceholder = document.getElementById('header-placeholder');
    // Skip header injection if navbar is already hardcoded in the page
    if (headerPlaceholder && !document.querySelector('nav.navbar')) {`;

if (snippets.includes(oldHeaderCheck)) {
    snippets = snippets.replace(oldHeaderCheck, newHeaderCheck);
    fs.writeFileSync(snippetsPath, snippets, 'utf-8');
    console.log('\nUpdated staywise-shared-snippets.js to skip header if navbar exists');
} else {
    console.log('\nWARNING: Could not find header check pattern in shared-snippets.js');
}

console.log('\nDone! All pages now have the exact same header as index.html.');
