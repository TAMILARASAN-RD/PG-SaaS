// shared-snippets.js

document.addEventListener("DOMContentLoaded", () => {
    const isLocalFile = window.location.protocol === 'file:';

    function getBasePath() {
        if (!isLocalFile) return '';

        let path = window.location.pathname;
        let pIndex = path.indexOf('/pages/');
        if (pIndex !== -1) {
            return path.substring(0, pIndex);
        }

        let iIndex = path.indexOf('/index.html');
        if (iIndex !== -1) {
            return path.substring(0, iIndex);
        }

        // Handle exact directory path locally
        let lastSlashIndex = path.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            return path.substring(0, lastSlashIndex);
        }

        return '';
    }

    const basePath = getBasePath();

    // Embedded HTML to bypass strict browser CORS policies on file:// protocol 
    const headerHTML = `
<style>
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    border-bottom: 1px solid var(--border, #e2e8f0);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}
.navbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 4.25rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}
.navbar .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text, #0f172a);
    text-decoration: none;
}
.navbar .logo-icon {
    width: 2.25rem;
    height: 2.25rem;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px 0 rgba(29, 91, 235, 0.39);
}
.navbar .nav-links {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
}
.navbar .nav-link {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--muted, #64748b);
    transition: color 0.2s ease-in-out;
    position: relative;
    text-decoration: none;
}
.navbar .nav-link:hover,
.navbar .nav-link.active {
    color: var(--text, #0f172a);
}
.navbar .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -0.4rem;
    left: 0;
    right: 0;
    height: 2px;
    background: #3b82f6;
    border-radius: 1px;
}
.navbar .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}
@media (max-width: 768px) {
    .navbar .nav-links {
        display: none;
    }
    .navbar .nav-actions .nav-link {
        display: none;
    }
}
</style>
<nav class="navbar">
    <div class="container">
        <a href="index.html" class="logo">
            <div class="logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
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

    const footerHTML = `
<div class="container grid" style="text-align: left;">
    <div class="col-12 col-md-12 col-4 mb-4">
        <h3 class="mb-4" style="color: var(--text);">StayWise</h3>
        <p class="text-muted" style="margin-bottom: 24px;">Operational control for rental spaces. Track occupancy, rent,
            and deposits from one dashboard.</p>
    </div>
    <div class="col-12 col-md-12 col-2 mb-4">
        <h4 class="mb-4" style="color: var(--text); font-size: 1.1rem;">Product</h4>
        <ul style="list-style: none; padding: 0;">
            <li class="mb-2"><a href="features.html"
                    style="color: var(--muted); text-decoration: none;">Features</a></li>
            <li class="mb-2"><a href="pricing.html"
                    style="color: var(--muted); text-decoration: none;">Pricing</a></li>
        </ul>
    </div>
    <div class="col-12 col-md-12 col-2 mb-4">
        <h4 class="mb-4" style="color: var(--text); font-size: 1.1rem;">Company</h4>
        <ul style="list-style: none; padding: 0;">
            <li class="mb-2"><a href="about.html" style="color: var(--muted); text-decoration: none;">About</a>
            </li>
            <li class="mb-2"><a href="blogs.html" style="color: var(--muted); text-decoration: none;">Blogs</a>
            </li>
        </ul>
    </div>
    <div class="col-12 col-md-12 col-4 mb-4">
        <h4 class="mb-4" style="color: var(--text); font-size: 1.1rem;">Contact</h4>
        <p class="text-muted mb-2">Email: hello@staywise.com</p>
        <p class="text-muted mb-4">Phone: +91 98765 43210</p>
    </div>
</div>
<div class="container mt-8"
    style="padding-top: 32px; border-top: 1px solid var(--border); display: flex; flex-direction: column; align-items: center;">
    <p>&copy; 2026 StayWise. All rights reserved.</p>
</div>`;

    const formatHtmlLinks = (html) => {
        if (!isLocalFile) return html;
        return html; 
    };

    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        let processedData = headerHTML;

        // Extremely simple active class toggling
        processedData = processedData.replace(/class="nav-link active"/g, 'class="nav-link"');

        const currentPath = window.location.pathname;
        if (currentPath.includes('features.html')) {
            processedData = processedData.replace('href="features.html" class="nav-link"', 'href="features.html" class="nav-link active"');
        } else if (currentPath.includes('pricing.html')) {
            processedData = processedData.replace('href="pricing.html" class="nav-link"', 'href="pricing.html" class="nav-link active"');
        } else if (currentPath.includes('about.html')) {
            processedData = processedData.replace('href="about.html" class="nav-link"', 'href="about.html" class="nav-link active"');
        } else if (currentPath.includes('blogs.html')) {
            processedData = processedData.replace('href="blogs.html" class="nav-link"', 'href="blogs.html" class="nav-link active"');
        } else if (currentPath.includes('contact.html')) {
            processedData = processedData.replace('href="contact.html" class="nav-link"', 'href="contact.html" class="nav-link active"');
        } else {
            // No home page active
        }

        headerPlaceholder.innerHTML = formatHtmlLinks(processedData);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = formatHtmlLinks(footerHTML);
    }
});
