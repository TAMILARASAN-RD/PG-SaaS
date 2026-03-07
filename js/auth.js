/**
 * auth.js
 * Logic for Login, Signup, and Google Auth
 * Stores user session in localStorage for cross-page identity
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const signupTenantForm = document.getElementById('signup-tenant-form');
    const googleBtn = document.getElementById('google-login-btn');

    if (loginForm) {
        // Pre-fill email and check if remembered
        const rememberedEmail = localStorage.getItem('staywise_remember_me');
        if (rememberedEmail) {
            const emailInput = document.getElementById('email');
            const rememberCheckbox = document.getElementById('remember-me');
            if (emailInput && rememberCheckbox) {
                emailInput.value = rememberedEmail;
                rememberCheckbox.checked = true;
            }
        }

        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    if (signupTenantForm) {
        signupTenantForm.addEventListener('submit', handleTenantSignup);
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleAuth);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    console.log('Logging in with:', data);

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Please fill in all fields.');
        return;
    }

    // Handle Remember Me
    const rememberCheckbox = document.getElementById('remember-me');
    if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('staywise_remember_me', email);
    } else {
        localStorage.removeItem('staywise_remember_me');
    }

    // Retrieve the profile bound to this email
    const profileKey = `staywise_profile_${email}`;
    let profile = JSON.parse(localStorage.getItem(profileKey));

    if (!profile) {
        // For demonstration, if no profile exists, let's assume it's an owner logging in for the first time
        // In a real app, this would query a database.
        if (email.includes('tenant')) {
            alert('Tenant account not found. Please wait for your property owner to assign you and provide credentials.');
            return;
        }

        profile = {
            email: email,
            name: email.split('@')[0],
            role: 'owner', // Defaulting missing to owner for demo
            kycStatus: 'Pending',
            joinedDate: new Date().toISOString()
        };
        localStorage.setItem(profileKey, JSON.stringify(profile));
    }

    // --- ENFORCE PASSWORD RULES ---
    // If it's a tenant, strictly enforce the auto-generated password check
    if (profile.role === 'tenant') {
        const generatedPassword = profile.generatedPassword;
        if (!generatedPassword) {
            alert('Your account is not fully set up. Please contact your property owner for your login credentials.');
            return;
        }
        if (password !== generatedPassword) {
            alert('Incorrect password. Please use the exact credential PIN provided by your property owner.');
            return;
        }
    } else {
        // Owner logic: Accept any password for the demo
        console.log("Owner login accepted for demo purposes.");
    }

    // Login successful
    localStorage.setItem('staywise_user', JSON.stringify({
        ...profile,
        loginTime: new Date().toISOString()
    }));

    // Simulate role-based redirection
    if (profile.role === 'owner') {
        window.location.href = '../owners-pages/index.html';
    } else {
        window.location.href = '../tenant-pages/index.html';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const email = data.email || 'owner@staywise.com';
    const name = data.name || 'Admin User';

    // Create persistent profile
    const profile = {
        email: email,
        name: name,
        role: 'owner',
        kycStatus: 'Pending',
        joinedDate: new Date().toISOString()
    };
    localStorage.setItem(`staywise_profile_${email}`, JSON.stringify(profile));

    // Store user session
    localStorage.setItem('staywise_user', JSON.stringify({
        ...profile,
        loginTime: new Date().toISOString()
    }));

    window.location.href = '../owners-pages/index.html';
}

// Tenant signup is disabled by design. They must be invited.
// async function handleTenantSignup(e) { ... }

// Global callback for Official Google Identity Services
window.handleGoogleCredential = function (response) {
    console.log("Google JWT Token:", response.credential);

    // Default to owner for demo
    const email = 'user@gmail.com';
    const profileKey = `staywise_profile_${email}`;
    let profile = JSON.parse(localStorage.getItem(profileKey)) || {
        email: email,
        name: 'Google User',
        role: 'owner',
        kycStatus: 'Pending',
        joinedDate: new Date().toISOString()
    };
    localStorage.setItem(profileKey, JSON.stringify(profile));

    localStorage.setItem('staywise_user', JSON.stringify({
        ...profile,
        loginTime: new Date().toISOString()
    }));

    window.location.href = '../owners-pages/index.html';
};

/**
 * Extract a display name from an email address.
 * e.g. "ravi.kumar@gmail.com" → "Ravi Kumar"
 */
function extractNameFromEmail(email) {
    const local = email.split('@')[0];
    return local
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
