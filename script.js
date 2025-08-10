// Global variables
let currentUser = null;
let currentUserType = 'student'; // 'student' or 'admin'

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupAnimations();
});

// Initialize the application
function initializeApp() {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        // Validate token and redirect to appropriate dashboard
        validateToken(token);
    }
    
    // Initialize smooth scrolling for navigation links
    initializeSmoothScrolling();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Setup Google Sign-In
    setupGoogleSignIn();
    
    // Set dynamic login URI for Google buttons
    setGoogleLoginUri();
}

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    
    // Contact form
    document.querySelector('.contact-form')?.addEventListener('submit', handleContactForm);
    
    // Modal close on outside click
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Setup animations
function setupAnimations() {
    // Enhanced Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Add staggered animation for cards
                if (entry.target.classList.contains('about-card') || entry.target.classList.contains('service-card')) {
                    const cards = entry.target.parentElement.children;
                    Array.from(cards).forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('visible');
                        }, index * 200);
                    });
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.about-card, .service-card, .contact-item, .section-title').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
    
    // Setup floating card interactions
    setupFloatingCardInteractions();
    
    // Setup parallax effects
    setupParallaxEffects();
    
    // Setup typing animation for hero title
    setupTypingAnimation();
    
    // Setup scroll indicator
    setupScrollIndicator();
}

// Setup floating card interactions
function setupFloatingCardInteractions() {
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.1)';
            this.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.zIndex = '';
        });
        
        card.addEventListener('click', function() {
            // Add click animation
            this.style.animation = 'bounce 0.6s ease-in-out';
            setTimeout(() => {
                this.style.animation = '';
            }, 600);
        });
    });
}

// Setup parallax effects
function setupParallaxEffects() {
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero::before');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// Setup typing animation for hero title
function setupTypingAnimation() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    heroTitle.style.borderRight = '2px solid #ffd700';
    
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            heroTitle.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        } else {
            // Remove cursor after typing is complete
            setTimeout(() => {
                heroTitle.style.borderRight = 'none';
            }, 1000);
        }
    };
    
    // Start typing animation after a delay
    setTimeout(typeWriter, 1000);
}

// Setup scroll indicator
function setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (!scrollIndicator) return;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        scrollIndicator.style.transform = `scaleX(${scrollPercent / 100})`;
    });
}

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Tab switching
function switchTab(type) {
    currentUserType = type;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update form fields based on user type
    updateFormForUserType(type);
}

function updateFormForUserType(type) {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;
    
    if (type === 'admin') {
        // Add admin-specific fields
        addAdminFields(signupForm);
    } else {
        // Remove admin fields for students
        removeAdminFields(signupForm);
    }
}

function addAdminFields(form) {
    // Add admin code field if not exists
    if (!document.getElementById('adminCode')) {
        const adminCodeGroup = document.createElement('div');
        adminCodeGroup.className = 'form-group';
        adminCodeGroup.innerHTML = `
            <label for="adminCode">Admin Code</label>
            <input type="text" id="adminCode" required>
        `;
        form.insertBefore(adminCodeGroup, form.querySelector('.auth-btn').parentNode);
    }
}

function removeAdminFields(form) {
    const adminCodeField = document.getElementById('adminCode');
    if (adminCodeField) {
        adminCodeField.parentNode.remove();
    }
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('.auth-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;
        
        // Simulate API call
        await simulateApiCall(1000);
        
        // Validate credentials (in real app, this would be server-side)
        if (validateCredentials(email, password)) {
            // Store auth token
            const token = generateToken(email, currentUserType);
            localStorage.setItem('authToken', token);
            localStorage.setItem('userType', currentUserType);
            
            // Close modal and redirect
            closeModal('loginModal');
            redirectToDashboard(currentUserType);
            
            showNotification('Login successful!', 'success');
        } else {
            showNotification('Invalid credentials. Please try again.', 'error');
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('.auth-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('signupName') || document.getElementById('signupName').value,
        email: formData.get('signupEmail') || document.getElementById('signupEmail').value,
        phone: formData.get('signupPhone') || document.getElementById('signupPhone').value,
        password: formData.get('signupPassword') || document.getElementById('signupPassword').value,
        confirmPassword: formData.get('signupConfirmPassword') || document.getElementById('signupConfirmPassword').value,
        userType: currentUserType
    };
    
    // Use email as username if name is not provided
    if (!userData.name || userData.name.trim() === '') {
        userData.name = userData.email.split('@')[0];
    }
    
    // Validate form
    if (!validateSignupForm(userData)) {
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('.auth-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;
        
        // Simulate API call
        await simulateApiCall(1500);
        
        // Store user data (in real app, this would be server-side)
        storeUserData(userData);
        
        // Close modal and show success
        closeModal('signupModal');
        showNotification('Account created successfully! Please sign in.', 'success');
        
        // Show login modal
        setTimeout(() => {
            showLoginModal();
        }, 1000);
        
    } catch (error) {
        showNotification('Signup failed. Please try again.', 'error');
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('.auth-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Validation functions
function validateCredentials(email, password) {
    // Simple validation (in real app, this would be server-side)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.some(user => user.email === email && user.password === password);
}

function validateSignupForm(userData) {
    if (!userData.name || !userData.email || !userData.phone || !userData.password) {
        showNotification('Please fill in all required fields.', 'error');
        return false;
    }
    
    if (userData.password !== userData.confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return false;
    }
    
    if (userData.password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        return false;
    }
    
    if (userData.userType === 'admin') {
        const adminCode = document.getElementById('adminCode')?.value;
        if (!adminCode || adminCode !== 'ADMIN2024') {
            showNotification('Invalid admin code.', 'error');
            return false;
        }
    }
    
    return true;
}

// Utility functions
function generateToken(email, userType) {
    return btoa(JSON.stringify({ email, userType, timestamp: Date.now() }));
}

function storeUserData(userData) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
}

function validateToken(token) {
    try {
        const decoded = JSON.parse(atob(token));
        const now = Date.now();
        const tokenAge = now - decoded.timestamp;
        
        // Token expires after 24 hours
        if (tokenAge > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('authToken');
            return false;
        }
        
        currentUser = decoded.email;
        currentUserType = decoded.userType;
        return true;
    } catch (error) {
        localStorage.removeItem('authToken');
        return false;
    }
}

function redirectToDashboard(userType) {
    if (userType === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'student-dashboard.html';
    }
}

// Contact form handler
async function handleContactForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const contactData = {
        name: formData.get('name') || event.target.querySelector('input[type="text"]').value,
        email: formData.get('email') || event.target.querySelector('input[type="email"]').value,
        message: formData.get('message') || event.target.querySelector('textarea').value
    };
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        // Simulate API call
        await simulateApiCall(2000);
        
        // Clear form
        event.target.reset();
        
        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        
    } catch (error) {
        showNotification('Failed to send message. Please try again.', 'error');
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('.submit-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Mobile menu
function initializeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Smooth scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// API simulation
function simulateApiCall(delay) {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

// Social login handlers
async function handleGithubLogin(event) {
    event.preventDefault();
    
    const button = event.target.closest('.social-btn');
    const originalContent = button.innerHTML;
    
    try {
        button.classList.add('loading');
        button.innerHTML = '<i class="fab fa-github"></i> Connecting...';
        
        // Redirect to GitHub OAuth
        const clientId = 'YOUR_GITHUB_CLIENT_ID'; // You'll need to register your app with GitHub
        const redirectUri = encodeURIComponent(window.location.origin + '/github-callback.html');
        const scope = 'read:user user:email';
        
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${currentUserType}`;
        
        window.location.href = githubAuthUrl;
        
    } catch (error) {
        showNotification('GitHub login failed. Please try again.', 'error');
        button.classList.remove('loading');
        button.innerHTML = originalContent;
    }
}

// Google OAuth Functions
function handleGoogleCredentialResponse(response) {
    if (response.credential) {
        try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            console.log('Google login response:', payload);
            
            const userData = {
                email: payload.email,
                name: payload.name,
                phone: '',
                userType: currentUserType,
                provider: 'google',
                avatar: payload.picture,
                emailVerified: payload.email_verified
            };
            
            storeUserData(userData);
            currentUser = payload.email;
            
            const token = generateToken(userData.email, userData.userType);
            localStorage.setItem('authToken', token);
            localStorage.setItem('userType', userData.userType);
            localStorage.setItem('currentUser', userData.email);
            localStorage.setItem('userProfile', JSON.stringify(userData));
            
            showNotification(`Welcome ${userData.name}! Successfully logged in with Google.`, 'success');
            closeAllModals();
            
            setTimeout(() => {
                redirectToDashboard(userData.userType);
            }, 1500);
            
        } catch (error) {
            console.error('Error processing Google login:', error);
            showNotification('Google login failed. Please try again.', 'error');
        }
    } else {
        console.error('No credential received from Google');
        showNotification('Google login failed. No credential received.', 'error');
    }
}

function initializeGoogleSignIn() {
    try {
        if (window.google && window.google.accounts) {
            // Initialize for login modal
            const loginModal = document.querySelector('#loginModal .g_id_signin');
            if (loginModal) {
                window.google.accounts.id.renderButton(loginModal, {
                    type: 'standard',
                    size: 'large',
                    theme: 'outline',
                    text: 'sign_in_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                });
            }
            
            // Initialize for signup modal
            const signupModal = document.querySelector('#signupModal .g_id_signin');
            if (signupModal) {
                window.google.accounts.id.renderButton(signupModal, {
                    type: 'standard',
                    size: 'large',
                    theme: 'outline',
                    text: 'signup_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                });
            }
            
            console.log('Google Sign-In initialized successfully for both modals');
        } else {
            console.warn('Google Sign-In library not loaded yet');
            setTimeout(initializeGoogleSignIn, 1000);
        }
    } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        createFallbackGoogleButton();
    }
}

function setupGoogleSignIn() {
    // Check if we're on a supported origin
    const currentOrigin = window.location.origin;
    const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
    const isFileProtocol = currentOrigin === 'null' || currentOrigin === 'file://';
    
    if (isLocalhost && !isFileProtocol) {
        console.log('Running on localhost web server, initializing Google Sign-In...');
        
        // Initialize Google Sign-In
        if (window.google && window.google.accounts) {
            window.google.accounts.id.initialize({
                client_id: window.GOOGLE_CONFIG?.CLIENT_ID || '452260251255-4mil8ci3nr4oiethmmom3nr4oiethmmom3lrgl3vg4aqc.apps.googleusercontent.com',
                callback: handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                ux_mode: 'popup'
            });
            
            initializeGoogleSignIn();
        } else {
            // Wait for Google to load
            setTimeout(setupGoogleSignIn, 1000);
        }
    } else if (isFileProtocol) {
        console.log('Running from file:// protocol, showing instructions...');
        showFileProtocolInstructions();
    } else {
        console.log('Not on localhost, using fallback...');
        createFallbackGoogleButton();
    }
}

function createFallbackGoogleButton() {
    const googleButton = document.querySelector('.g_id_signin');
    if (googleButton) {
        googleButton.innerHTML = `
            <button class="social-btn google fallback" onclick="handleGoogleSignInFallback()">
                <i class="fab fa-google"></i>
                Sign in with Google
            </button>
        `;
    }
}

function handleGoogleSignInFallback() {
    showNotification('Google Sign-In is not available in this environment. Please use a local web server.', 'warning');
}

function showFileProtocolInstructions() {
    const loginModal = document.querySelector('#loginModal .social-buttons');
    const signupModal = document.querySelector('#signupModal .social-buttons');
    
    const createInstructions = () => {
        const instructionsDiv = document.createElement('div');
        instructionsDiv.className = 'file-protocol-instructions';
        instructionsDiv.innerHTML = `
            <div class="instructions-content">
                <h4>🔒 Google Login Not Available</h4>
                <p>Google login requires a web server. To use Google login:</p>
                <ol>
                    <li><strong>Option 1:</strong> Use VS Code Live Server extension</li>
                    <li><strong>Option 2:</strong> Run: <code>python -m http.server 8000</code></li>
                    <li><strong>Option 3:</strong> Open: <a href="http://localhost:8000" target="_blank">http://localhost:8000</a></li>
                </ol>
                <button class="btn btn-primary" onclick="startLocalServer()">Start Local Server</button>
            </div>
        `;
        return instructionsDiv;
    };
    
    if (loginModal) {
        const existingInstructions = loginModal.querySelector('.file-protocol-instructions');
        if (!existingInstructions) {
            loginModal.appendChild(createInstructions());
        }
    }
    
    if (signupModal) {
        const existingInstructions = signupModal.querySelector('.file-protocol-instructions');
        if (!existingInstructions) {
            signupModal.appendChild(createInstructions());
        }
    }
}

function startLocalServer() {
    showNotification('Starting local server...', 'info');
    
    // Try to start the server using fetch to localhost
    fetch('http://localhost:8000')
        .then(() => {
            showNotification('Server is running! Opening http://localhost:8000', 'success');
            setTimeout(() => {
                window.open('http://localhost:8000', '_blank');
            }, 1000);
        })
        .catch(() => {
            showNotification('Server not running. Please run: python -m http.server 8000', 'warning');
        });
}

function setGoogleLoginUri() {
    // Set the login URI for Google buttons based on current environment
    const loginUri = window.GOOGLE_CONFIG?.getLoginUri() || 'http://localhost:8000';
    
    // Update login modal Google button
    const loginOnload = document.querySelector('#g_id_onload');
    if (loginOnload) {
        loginOnload.setAttribute('data-login_uri', loginUri);
    }
    
    // Update signup modal Google button
    const signupOnload = document.querySelector('#g_id_onload_signup');
    if (signupOnload) {
        signupOnload.setAttribute('data-login_uri', loginUri);
    }
    
    console.log('Google login URI set to:', loginUri);
}

// Credential input modal (for adding new accounts)
function showCredentialModal(provider) {
    return new Promise((resolve) => {
        // Create modal HTML
        const modalHTML = `
            <div id="credentialModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 400px;">
                    <span class="close" onclick="closeCredentialModal()">&times;</span>
                    <div class="auth-container">
                        <h2>${provider} Login</h2>
                        <p>Enter your ${provider} credentials</p>
                        
                        <div class="auth-tabs">
                            <button type="button" class="tab-btn ${currentUserType === 'student' ? 'active' : ''}" onclick="switchCredentialTab('student')">Student</button>
                            <button type="button" class="tab-btn ${currentUserType === 'admin' ? 'active' : ''}" onclick="switchCredentialTab('admin')">Admin</button>
                        </div>
                        
                        <form id="credentialForm" class="auth-form">
                            <div class="form-group">
                                <label for="credentialEmail">Email</label>
                                <input type="email" id="credentialEmail" required>
                            </div>
                            <div class="form-group">
                                <label for="credentialPassword">Password</label>
                                <input type="password" id="credentialPassword" required>
                            </div>
                            <div class="form-group">
                                <label for="credentialName">Full Name (Optional)</label>
                                <input type="text" id="credentialName" placeholder="Your full name">
                            </div>
                            <div class="form-group">
                                <label for="credentialPhone">Phone (Optional)</label>
                                <input type="tel" id="credentialPhone" placeholder="Your phone number">
                            </div>
                            <button type="submit" class="auth-btn">Continue with ${provider}</button>
                        </form>
                        
                        <div class="auth-footer">
                            <button onclick="closeCredentialModal()" style="background: #6b7280; margin-top: 1rem;">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Handle form submission
        document.getElementById('credentialForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const credentials = {
                email: document.getElementById('credentialEmail').value,
                password: document.getElementById('credentialPassword').value,
                name: document.getElementById('credentialName').value,
                phone: document.getElementById('credentialPhone').value
            };
            
            closeCredentialModal();
            resolve(credentials);
        });
        
        // Handle modal close
        window.closeCredentialModal = function() {
            document.getElementById('credentialModal').remove();
            resolve(null);
        };
        
        // Close on outside click
        document.getElementById('credentialModal').addEventListener('click', function(e) {
            if (e.target.id === 'credentialModal') {
                closeCredentialModal();
            }
        });
    });
}

// Function to switch tabs in credential modal
function switchCredentialTab(type) {
    currentUserType = type;
    
    // Update active tab
    document.querySelectorAll('#credentialModal .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Validation function for real Google credentials
function validateGoogleCredentials(email, password) {
    // Basic validation - in real app, this would be OAuth
    // For demo purposes, accept any Gmail with password length >= 6
    return email.includes('@gmail.com') && password.length >= 6;
}

function validateGithubCredentials(email, password) {
    // Basic validation - in real app, this would be OAuth
    // For demo purposes, accept any email with password length >= 6
    return email.includes('@') && password.length >= 6;
}

// Google Signup Function
async function handleGoogleSignup(event) {
    event.preventDefault();
    
    const button = event.target.closest('.social-btn');
    const originalContent = button.innerHTML;
    
    try {
        button.classList.add('loading');
        button.innerHTML = '<i class="fab fa-google"></i> Connecting...';
        
        showNotification('Setting up Google account...', 'info');
        await simulateApiCall(2000);
        
        // Generate a unique email for signup
        const timestamp = Date.now();
        const userGmail = `user${timestamp}@gmail.com`;
        const userName = `User${timestamp}`;
        
        const userData = {
            email: userGmail,
            name: userName,
            phone: '+91 98765 43210',
            userType: currentUserType,
            provider: 'google',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4285f4&color=fff&size=40`,
            isNewUser: true
        };
        
        // Validate signup data
        const validation = validateSignupForm(userData);
        if (!validation) { // Changed to !validation to match original logic
            throw new Error('Invalid signup data.');
        }
        
        storeUserData(userData);
        currentUser = userGmail;
        const token = generateToken(userData.email, userData.userType);
        localStorage.setItem('authToken', token);
        localStorage.setItem('userType', userData.userType);
        localStorage.setItem('currentUser', userData.email);
        
        showNotification('Successfully signed up with Google!', 'success');
        closeAllModals();
        setTimeout(() => {
            redirectToDashboard(userData.userType);
        }, 1000);
        
    } catch (error) {
        showNotification('Google signup failed. Please try again.', 'error');
        console.error('Google signup error:', error);
    } finally {
        button.classList.remove('loading');
        button.innerHTML = originalContent;
    }
}

// Add social login event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Google login
    document.querySelectorAll('.social-btn.google').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (btn.closest('#signupModal')) {
                handleGoogleSignup(e);
            } else {
                handleGoogleLogin(e);
            }
        });
    });
    
    // GitHub login
    document.querySelectorAll('.social-btn.github').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleGithubLogin(e);
        });
    });
});

// Add CSS for notifications
const notificationStyles = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        margin-left: 1rem;
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Export functions for global access
window.showLoginModal = showLoginModal;
window.showSignupModal = showSignupModal;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.switchCredentialTab = switchCredentialTab;
window.handleGoogleSignup = handleGoogleSignup; 