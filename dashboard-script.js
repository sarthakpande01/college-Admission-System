// Student Dashboard JavaScript
let currentStudent = null;
let studentData = {};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing dashboard...');
    initializeDashboard();
    setupEventListeners();
    loadStudentData();
});

// Initialize Dashboard
function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Check authentication
    const token = localStorage.getItem('authToken');
    console.log('Auth token found:', !!token);
    
    if (!token) {
        console.log('No auth token, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }

    // Validate token
    if (!validateToken(token)) {
        console.log('Invalid token, redirecting to index.html');
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
        return;
    }

    // Get current user
    currentStudent = getCurrentUser();
    console.log('Current student:', currentStudent);
    
    updateDashboardHeader();
    loadStudentStatus();
}

// Setup Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Form submissions
    const profileForm = document.getElementById('profileForm');
    const academicForm = document.getElementById('academicForm');
    const paymentForm = document.getElementById('paymentForm');
    
    console.log('Forms found:', {
        profileForm: !!profileForm,
        academicForm: !!academicForm,
        paymentForm: !!paymentForm
    });
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
        console.log('Profile form listener added');
    }
    
    if (academicForm) {
        academicForm.addEventListener('submit', handleAcademicSubmit);
        console.log('Academic form listener added');
    }
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
        console.log('Payment form listener added');
    }

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            updateActiveNav(this);
        });
    });

    // Modal close events
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Test if forms are found
    setTimeout(() => {
        console.log('=== FORM TEST ===');
        console.log('Profile form:', document.getElementById('profileForm'));
        console.log('Academic form:', document.getElementById('academicForm'));
        console.log('Payment form:', document.getElementById('paymentForm'));
        console.log('All submit buttons:', document.querySelectorAll('.submit-btn'));
        console.log('==================');
    }, 1000);
}

// Authentication Functions
function validateToken(token) {
    try {
        const decoded = JSON.parse(atob(token));
        const now = Date.now();
        const tokenAge = now - decoded.timestamp;
        
        // Token expires after 24 hours
        if (tokenAge > 24 * 60 * 60 * 1000) {
            return false;
        }
        
        return decoded.userType === 'student';
    } catch (error) {
        return false;
    }
}

function getCurrentUser() {
    const token = localStorage.getItem('authToken');
    if (token) {
        const decoded = JSON.parse(atob(token));
        return decoded.email;
    }
    return null;
}

// Dashboard Functions
function updateDashboardHeader() {
    const studentNameElement = document.getElementById('studentName');
    if (studentNameElement && currentStudent) {
        // Get student name from stored data
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const student = students.find(s => s.email === currentStudent);
        if (student && student.profile && student.profile.fullName) {
            studentNameElement.textContent = student.profile.fullName;
        } else {
            studentNameElement.textContent = currentStudent;
        }
    }
}

function loadStudentData() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.email === currentStudent);
    
    if (student) {
        studentData = student;
        
        // Populate profile form if data exists
        if (student.profile) {
            populateProfileForm(student.profile);
        }
        
        // Populate academic form if data exists
        if (student.academics) {
            populateAcademicForm(student.academics);
        }
        
        // Populate payment form if data exists
        if (student.payment) {
            populatePaymentForm(student.payment);
        }
    }
    
    // Update counseling status
    updateCounselingStatus();
}

function loadStudentStatus() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.email === currentStudent);
    
    if (student) {
        // Update profile status
        updateStatusCard('profileStatus', student.profile ? 'Complete' : 'Not Complete');
        
        // Calculate and update academic rank
        if (student.academics) {
            const rankedStudents = students
                .filter(s => s.academics)
                .map(s => ({
                    email: s.email,
                    totalMarks: calculateTotalMarks(s.academics)
                }))
                .sort((a, b) => b.totalMarks - a.totalMarks);
            
            const rank = rankedStudents.findIndex(s => s.email === currentStudent) + 1;
            const currentMarks = calculateTotalMarks(student.academics);
            
            if (rankedStudents.length === 1) {
                updateStatusCard('academicRank', `${currentMarks}/400 marks`);
            } else if (rank === 1) {
                updateStatusCard('academicRank', `Rank 1 - ${currentMarks}/400`);
            } else {
                const topMarks = rankedStudents[0].totalMarks;
                const difference = topMarks - currentMarks;
                updateStatusCard('academicRank', `Rank ${rank} - ${currentMarks}/400`);
            }
        } else {
            updateStatusCard('academicRank', 'Not Available');
        }
        
        // Update branch allocation status
        if (student.academics && student.academics.allocatedBranch) {
            const branchName = getBranchName(student.academics.allocatedBranch);
            updateStatusCard('branchAllocation', branchName);
        } else {
            updateStatusCard('branchAllocation', 'Pending');
        }
        
        // Update payment status
        if (student.payment && student.payment.verified) {
            updateStatusCard('paymentStatus', 'Verified');
        } else if (student.payment) {
            updateStatusCard('paymentStatus', 'Pending Verification');
        } else {
            updateStatusCard('paymentStatus', 'Not Paid');
        }
    }
}

function updateStatusCard(elementId, status) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = status;
        
        // Update styling based on status
        if (status === 'Complete' || status === 'Verified' || status.includes('Rank')) {
            element.style.color = '#10b981';
        } else if (status === 'Not Complete' || status === 'Not Paid' || status === 'Not Available') {
            element.style.color = '#ef4444';
        } else if (status === 'Pending' || status === 'Pending Verification') {
            element.style.color = '#f59e0b';
        } else {
            element.style.color = '#6366f1';
        }
    }
}

// Form Handling Functions
async function handleProfileSubmit(event) {
    console.log('Profile form submitted!');
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const profileData = {
        fullName: formData.get('fullName'),
        dateOfBirth: formData.get('dateOfBirth'),
        gender: formData.get('gender'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
        parentName: formData.get('parentName'),
        parentPhone: formData.get('parentPhone')
    };
    
    console.log('Profile data:', profileData);
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        // Simulate API call
        await simulateApiCall(1000);
        
        // Save profile data
        saveStudentData('profile', profileData);
        
        // Update status cards
        loadStudentStatus();
        
        showNotification('Profile saved successfully!', 'success');
        
    } catch (error) {
        console.error('Profile submission error:', error);
        showNotification('Failed to save profile. Please try again.', 'error');
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('.submit-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleAcademicSubmit(event) {
    console.log('Academic form submitted!');
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const academicData = {
        // High School marks
        math10: parseInt(formData.get('math10')),
        science10: parseInt(formData.get('science10')),
        english10: parseInt(formData.get('english10')),
        hindi10: parseInt(formData.get('hindi10')),
        social10: parseInt(formData.get('social10')),
        
        // 10+2 marks
        physics12: parseInt(formData.get('physics12')),
        chemistry12: parseInt(formData.get('chemistry12')),
        math12: parseInt(formData.get('math12')),
        english12: parseInt(formData.get('english12')),
        
        // Preferences
        preference1: formData.get('preference1'),
        preference2: formData.get('preference2')
    };
    
    console.log('Academic data:', academicData);
    
    // Calculate total marks for 10+2
    academicData.totalMarks12 = academicData.physics12 + academicData.chemistry12 + 
                                academicData.math12 + academicData.english12;
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        // Simulate API call
        await simulateApiCall(1500);
        
        // Save academic data
        saveStudentData('academics', academicData);
        
        // Update status cards
        loadStudentStatus();
        
        showNotification('Academic details submitted successfully!', 'success');
        
        // Request ranking update from admin
        requestRankingUpdate();
        
    } catch (error) {
        console.error('Academic submission error:', error);
        showNotification('Failed to submit academic details. Please try again.', 'error');
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('.submit-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handlePaymentSubmit(event) {
    console.log('Payment form submitted!');
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const paymentData = {
        bankName: formData.get('bankName'),
        accountNumber: formData.get('accountNumber'),
        transactionId: formData.get('transactionId'),
        amount: parseInt(formData.get('amount')),
        receiptFile: formData.get('receiptUpload'),
        submittedAt: new Date().toISOString()
    };
    
    console.log('Payment data:', paymentData);
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        // Simulate API call
        await simulateApiCall(2000);
        
        // Save payment data
        saveStudentData('payment', paymentData);
        
        // Update status cards
        loadStudentStatus();
        
        showNotification('Payment proof submitted successfully! Awaiting verification.', 'success');
        
    } catch (error) {
        console.error('Payment submission error:', error);
        showNotification('Failed to submit payment proof. Please try again.', 'error');
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('.submit-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Data Management Functions
function saveStudentData(type, data) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    let studentIndex = students.findIndex(s => s.email === currentStudent);
    
    if (studentIndex === -1) {
        // Create new student entry
        students.push({
            email: currentStudent,
            [type]: data
        });
    } else {
        // Update existing student
        students[studentIndex][type] = data;
    }
    
    localStorage.setItem('students', JSON.stringify(students));
    studentData = students.find(s => s.email === currentStudent);
}

function populateProfileForm(profileData) {
    Object.keys(profileData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = profileData[key];
        }
    });
}

function populateAcademicForm(academicData) {
    Object.keys(academicData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = academicData[key];
        }
    });
}

function populatePaymentForm(paymentData) {
    Object.keys(paymentData).forEach(key => {
        const element = document.getElementById(key);
        if (element && key !== 'receiptFile') {
            element.value = paymentData[key];
        }
    });
}

// Navigation Functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

function updateActiveNav(activeLink) {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    activeLink.classList.add('active');
}

// Quick Action Functions
function showProfileForm() {
    showSection('profile');
    updateActiveNav(document.querySelector('a[href="#profile"]'));
}

function showAcademicForm() {
    showSection('academics');
    updateActiveNav(document.querySelector('a[href="#academics"]'));
}

function showPaymentForm() {
    showSection('payments');
    updateActiveNav(document.querySelector('a[href="#payments"]'));
}

function viewOfferLetter() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.email === currentStudent);
    
    if (student && student.allocatedBranch) {
        populateOfferLetter(student);
        document.getElementById('offerLetterModal').style.display = 'block';
    } else {
        showNotification('No offer letter available yet. Please wait for branch allocation.', 'info');
    }
}

function populateOfferLetter(student) {
    const today = new Date().toLocaleDateString();
    
    document.getElementById('offerDate').textContent = today;
    document.getElementById('offerStudentName').textContent = student.profile?.fullName || currentStudent;
    document.getElementById('allocatedBranch').textContent = student.allocatedBranch;
    document.getElementById('totalMarks').textContent = student.academics?.totalMarks12 || 'N/A';
    document.getElementById('studentRank').textContent = student.rank || 'N/A';
    document.getElementById('letterStudentName').textContent = student.profile?.fullName || currentStudent;
    document.getElementById('letterBranch').textContent = student.allocatedBranch;
}

function closeOfferLetter() {
    document.getElementById('offerLetterModal').style.display = 'none';
}

function downloadOfferLetter() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.email === currentStudent);
    
    if (!student || !student.academics || !student.academics.allocatedBranch) {
        showNotification('No offer letter available yet. Please wait for branch allocation.', 'info');
        return;
    }
    
    // Create a beautiful HTML offer letter
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offer Letter - ${student.profile?.fullName || currentStudent}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .letter-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .letter-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .letter-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .letter-header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .letter-content {
            padding: 50px;
            font-size: 1.1rem;
        }
        
        .letter-date {
            text-align: right;
            margin-bottom: 30px;
            color: #666;
        }
        
        .student-info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            border-left: 5px solid #3b82f6;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #1e3a8a;
            min-width: 150px;
        }
        
        .info-value {
            font-weight: 500;
            color: #333;
        }
        
        .letter-body {
            margin: 40px 0;
            line-height: 1.8;
        }
        
        .letter-body p {
            margin-bottom: 20px;
            text-align: justify;
        }
        
        .congratulations {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .signature-box {
            text-align: center;
            flex: 1;
            margin: 0 20px;
        }
        
        .signature-line {
            width: 200px;
            height: 2px;
            background: #333;
            margin: 50px auto 10px;
        }
        
        .signature-name {
            font-weight: 600;
            color: #1e3a8a;
        }
        
        .signature-title {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
        }
        
        .footer p {
            color: #6c757d;
            margin-bottom: 10px;
        }
        
        .footer .date {
            font-weight: 600;
            color: #1e3a8a;
        }
        
        .stamp {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            background: #dc2626;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
            text-align: center;
            line-height: 1.2;
            border: 3px solid #991b1b;
        }
        
        @media print {
            body {
                background: white;
            }
            .letter-container {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="letter-container">
        <div class="stamp">OFFICIAL<br>DOCUMENT</div>
        
        <div class="letter-header">
            <h1>🎓 Offer Letter</h1>
            <p>Student Counseling Portal - Engineering Branch Allocation</p>
        </div>
        
        <div class="letter-content">
            <div class="letter-date">
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                })}
            </div>
            
            <div class="student-info">
                <div class="info-row">
                    <span class="info-label">Student Name:</span>
                    <span class="info-value">${student.profile?.fullName || currentStudent}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email Address:</span>
                    <span class="info-value">${student.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Allocated Branch:</span>
                    <span class="info-value">${getBranchName(student.academics.allocatedBranch)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Marks (12th):</span>
                    <span class="info-value">${calculateTotalMarks(student.academics)}/400</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Academic Rank:</span>
                    <span class="info-value">${student.rank || 'To be determined'}</span>
                </div>
            </div>
            
            <div class="letter-body">
                <p>Dear <strong>${student.profile?.fullName || currentStudent}</strong>,</p>
                
                <div class="congratulations">
                    🎉 Congratulations! 🎉
                </div>
                
                <p>We are pleased to inform you that you have been successfully allocated to <strong>${getBranchName(student.academics.allocatedBranch)}</strong> based on your outstanding academic performance and branch preferences.</p>
                
                <p>Your allocation has been determined through a comprehensive evaluation of your 10+2 examination results, where you achieved a total of <strong>${calculateTotalMarks(student.academics)} marks out of 400</strong>. This demonstrates your strong foundation in the core subjects required for engineering studies.</p>
                
                <p>Your branch preferences were carefully considered during the allocation process:</p>
                <ul style="margin: 20px 0; padding-left: 30px;">
                    <li><strong>First Preference:</strong> ${getBranchName(student.academics.preference1)}</li>
                    <li><strong>Second Preference:</strong> ${getBranchName(student.academics.preference2)}</li>
                </ul>
                
                <p>We are confident that <strong>${getBranchName(student.academics.allocatedBranch)}</strong> will provide you with excellent opportunities to develop your skills and pursue your academic and career goals.</p>
                
                <p><strong>Next Steps:</strong></p>
                <ol style="margin: 20px 0; padding-left: 30px;">
                    <li>Complete the payment process for the counseling fee (₹5,000)</li>
                    <li>Upload the payment receipt for verification</li>
                    <li>Await confirmation of your seat</li>
                    <li>Prepare for the upcoming academic session</li>
                </ol>
                
                <p>Please note that this offer is valid for 15 days from the date of allocation. Failure to complete the payment process within this timeframe may result in the cancellation of your allocation.</p>
                
                <p>If you have any questions regarding this offer or need assistance with the payment process, please do not hesitate to contact our counseling support team.</p>
                
                <p>We look forward to welcoming you to our institution and supporting you in your academic journey.</p>
            </div>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-name">Dr. Academic Director</div>
                    <div class="signature-title">Student Counseling Committee</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-name">Prof. Branch Coordinator</div>
                    <div class="signature-title">${getBranchName(student.academics.allocatedBranch)}</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This offer letter is generated by the Student Counseling Portal</p>
            <p class="date">Generated on: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>
    </div>
</body>
</html>`;
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offer_letter_${currentStudent}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Beautiful offer letter downloaded successfully!', 'success');
}

function closeOfferLetter() {
    document.getElementById('offerLetterModal').style.display = 'none';
}

function downloadOfferLetter() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.email === currentStudent);
    
    if (!student || !student.academics || !student.academics.allocatedBranch) {
        showNotification('No offer letter available yet. Please wait for branch allocation.', 'info');
        return;
    }
    
    // Create a beautiful HTML offer letter
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offer Letter - ${student.profile?.fullName || currentStudent}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .letter-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .letter-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .letter-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .letter-header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .letter-content {
            padding: 50px;
            font-size: 1.1rem;
        }
        
        .letter-date {
            text-align: right;
            margin-bottom: 30px;
            color: #666;
        }
        
        .student-info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            border-left: 5px solid #3b82f6;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #1e3a8a;
            min-width: 150px;
        }
        
        .info-value {
            font-weight: 500;
            color: #333;
        }
        
        .letter-body {
            margin: 40px 0;
            line-height: 1.8;
        }
        
        .letter-body p {
            margin-bottom: 20px;
            text-align: justify;
        }
        
        .congratulations {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .signature-box {
            text-align: center;
            flex: 1;
            margin: 0 20px;
        }
        
        .signature-line {
            width: 200px;
            height: 2px;
            background: #333;
            margin: 50px auto 10px;
        }
        
        .signature-name {
            font-weight: 600;
            color: #1e3a8a;
        }
        
        .signature-title {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
        }
        
        .footer p {
            color: #6c757d;
            margin-bottom: 10px;
        }
        
        .footer .date {
            font-weight: 600;
            color: #1e3a8a;
        }
        
        .stamp {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            background: #dc2626;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
            text-align: center;
            line-height: 1.2;
            border: 3px solid #991b1b;
        }
        
        @media print {
            body {
                background: white;
            }
            .letter-container {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="letter-container">
        <div class="stamp">OFFICIAL<br>DOCUMENT</div>
        
        <div class="letter-header">
            <h1>🎓 Offer Letter</h1>
            <p>Student Counseling Portal - Engineering Branch Allocation</p>
        </div>
        
        <div class="letter-content">
            <div class="letter-date">
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                })}
            </div>
            
            <div class="student-info">
                <div class="info-row">
                    <span class="info-label">Student Name:</span>
                    <span class="info-value">${student.profile?.fullName || currentStudent}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email Address:</span>
                    <span class="info-value">${student.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Allocated Branch:</span>
                    <span class="info-value">${getBranchName(student.academics.allocatedBranch)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Marks (12th):</span>
                    <span class="info-value">${calculateTotalMarks(student.academics)}/400</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Academic Rank:</span>
                    <span class="info-value">${student.rank || 'To be determined'}</span>
                </div>
            </div>
            
            <div class="letter-body">
                <p>Dear <strong>${student.profile?.fullName || currentStudent}</strong>,</p>
                
                <div class="congratulations">
                    🎉 Congratulations! 🎉
                </div>
                
                <p>We are pleased to inform you that you have been successfully allocated to <strong>${getBranchName(student.academics.allocatedBranch)}</strong> based on your outstanding academic performance and branch preferences.</p>
                
                <p>Your allocation has been determined through a comprehensive evaluation of your 10+2 examination results, where you achieved a total of <strong>${calculateTotalMarks(student.academics)} marks out of 400</strong>. This demonstrates your strong foundation in the core subjects required for engineering studies.</p>
                
                <p>Your branch preferences were carefully considered during the allocation process:</p>
                <ul style="margin: 20px 0; padding-left: 30px;">
                    <li><strong>First Preference:</strong> ${getBranchName(student.academics.preference1)}</li>
                    <li><strong>Second Preference:</strong> ${getBranchName(student.academics.preference2)}</li>
                </ul>
                
                <p>We are confident that <strong>${getBranchName(student.academics.allocatedBranch)}</strong> will provide you with excellent opportunities to develop your skills and pursue your academic and career goals.</p>
                
                <p><strong>Next Steps:</strong></p>
                <ol style="margin: 20px 0; padding-left: 30px;">
                    <li>Complete the payment process for the counseling fee (₹5,000)</li>
                    <li>Upload the payment receipt for verification</li>
                    <li>Await confirmation of your seat</li>
                    <li>Prepare for the upcoming academic session</li>
                </ol>
                
                <p>Please note that this offer is valid for 15 days from the date of allocation. Failure to complete the payment process within this timeframe may result in the cancellation of your allocation.</p>
                
                <p>If you have any questions regarding this offer or need assistance with the payment process, please do not hesitate to contact our counseling support team.</p>
                
                <p>We look forward to welcoming you to our institution and supporting you in your academic journey.</p>
            </div>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-name">Dr. Academic Director</div>
                    <div class="signature-title">Student Counseling Committee</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-name">Prof. Branch Coordinator</div>
                    <div class="signature-title">${getBranchName(student.academics.allocatedBranch)}</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This offer letter is generated by the Student Counseling Portal</p>
            <p class="date">Generated on: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>
    </div>
</body>
</html>`;
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offer_letter_${currentStudent}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Beautiful offer letter downloaded successfully!', 'success');
}

// Utility Functions
function requestRankingUpdate() {
    // This would typically send a request to the admin to update rankings
    console.log('Requesting ranking update for student:', currentStudent);
}

function simulateApiCall(delay) {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

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

// Logout Function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    window.location.href = 'index.html';
}

// Counseling Functions
function checkRank() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentStudentData = students.find(s => s.email === currentStudent);
    
    if (!currentStudentData || !currentStudentData.academics) {
        showNotification('Please submit your academic details first.', 'warning');
        return;
    }
    
    // Calculate rank based on 10+2 total marks
    const totalMarks = calculateTotalMarks(currentStudentData.academics);
    const rankedStudents = students
        .filter(s => s.academics)
        .map(s => ({
            email: s.email,
            totalMarks: calculateTotalMarks(s.academics)
        }))
        .sort((a, b) => b.totalMarks - a.totalMarks);
    
    const rank = rankedStudents.findIndex(s => s.email === currentStudent) + 1;
    
    let rankMessage = '';
    if (rankedStudents.length === 1) {
        rankMessage = `📊 You are the only student registered.\nYour total marks: ${totalMarks}/400 (100% of maximum)`;
    } else {
        const topMarks = rankedStudents[0].totalMarks;
        const percentage = ((totalMarks / 400) * 100).toFixed(1);
        const topPercentage = ((topMarks / 400) * 100).toFixed(1);
        
        if (rank === 1) {
            rankMessage = `🏆 CONGRATULATIONS! You are Rank 1 of ${rankedStudents.length} students!\n📈 Your marks: ${totalMarks}/400 (${percentage}%)\n🎯 You have the highest score!`;
        } else if (rank <= 3) {
            const difference = topMarks - totalMarks;
            rankMessage = `🥉 Great job! You are Rank ${rank} of ${rankedStudents.length} students!\n📈 Your marks: ${totalMarks}/400 (${percentage}%)\n📊 You are ${difference} marks behind the top score (${topMarks}/400 - ${topPercentage}%)`;
        } else if (rank <= 10) {
            const difference = topMarks - totalMarks;
            rankMessage = `👍 Good performance! You are Rank ${rank} of ${rankedStudents.length} students!\n📈 Your marks: ${totalMarks}/400 (${percentage}%)\n📊 You are ${difference} marks behind the top score (${topMarks}/400 - ${topPercentage}%)`;
        } else {
            const difference = topMarks - totalMarks;
            rankMessage = `📊 You are Rank ${rank} of ${rankedStudents.length} students.\n📈 Your marks: ${totalMarks}/400 (${percentage}%)\n📊 You are ${difference} marks behind the top score (${topMarks}/400 - ${topPercentage}%)`;
        }
    }
    
    showNotification(rankMessage, 'success');
    
    // Update counseling rank display
    const rankElement = document.getElementById('counselingRank');
    if (rankElement) {
        const currentMarks = calculateTotalMarks(currentStudentData.academics);
        
        if (rankedStudents.length === 1) {
            rankElement.textContent = `Marks: ${currentMarks}/400 (Only Student)`;
        } else if (rank === 1) {
            rankElement.textContent = `Rank 1 - ${currentMarks}/400 marks (Highest!)`;
        } else if (rank <= 3) {
            const topMarks = rankedStudents[0].totalMarks;
            const difference = topMarks - currentMarks;
            rankElement.textContent = `Rank ${rank} - ${currentMarks}/400 (${difference} marks behind top)`;
        } else if (rank <= 10) {
            const topMarks = rankedStudents[0].totalMarks;
            const difference = topMarks - currentMarks;
            rankElement.textContent = `Rank ${rank} - ${currentMarks}/400 (${difference} marks behind top)`;
        } else {
            const topMarks = rankedStudents[0].totalMarks;
            const difference = topMarks - currentMarks;
            rankElement.textContent = `Rank ${rank} - ${currentMarks}/400 (${difference} marks behind top)`;
        }
    }
}

function viewAllocation() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentStudentData = students.find(s => s.email === currentStudent);
    
    if (!currentStudentData || !currentStudentData.academics) {
        showNotification('Please submit your academic details first.', 'warning');
        return;
    }
    
    if (!currentStudentData.academics.allocatedBranch) {
        // Simulate branch allocation for demo purposes
        simulateBranchAllocation();
        return;
    }
    
    const branchName = getBranchName(currentStudentData.academics.allocatedBranch);
    showNotification(`You have been allocated to: ${branchName}`, 'success');
    
    // Update allocation display
    const allocationElement = document.getElementById('allocatedBranchStatus');
    if (allocationElement) {
        allocationElement.textContent = branchName;
    }
}

// Simulate branch allocation for demo purposes
function simulateBranchAllocation() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentStudentData = students.find(s => s.email === currentStudent);
    
    if (!currentStudentData || !currentStudentData.academics) {
        showNotification('Please submit your academic details first.', 'warning');
        return;
    }
    
    // Calculate rank
    const rankedStudents = students
        .filter(s => s.academics)
        .map(s => ({
            email: s.email,
            totalMarks: calculateTotalMarks(s.academics),
            preference1: s.academics.preference1,
            preference2: s.academics.preference2
        }))
        .sort((a, b) => b.totalMarks - a.totalMarks);
    
    const rank = rankedStudents.findIndex(s => s.email === currentStudent) + 1;
    
    // Simple allocation logic based on rank and preferences
    let allocatedBranch = currentStudentData.academics.preference1;
    
    // If rank is lower, might get second preference
    if (rank > 10) {
        allocatedBranch = currentStudentData.academics.preference2;
    }
    
    // Update student data with allocation
    const studentIndex = students.findIndex(s => s.email === currentStudent);
    if (studentIndex !== -1) {
        students[studentIndex].academics.allocatedBranch = allocatedBranch;
        localStorage.setItem('students', JSON.stringify(students));
    }
    
    const branchName = getBranchName(allocatedBranch);
    showNotification(`Branch allocated! You have been assigned to: ${branchName}`, 'success');
    
    // Update status cards
    loadStudentStatus();
    
    // Update counseling status
    updateCounselingStatus();
}

function downloadDocuments() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentStudentData = students.find(s => s.email === currentStudent);
    
    if (!currentStudentData || !currentStudentData.academics) {
        showNotification('Please submit your academic details first.', 'warning');
        return;
    }
    
    // Simulate document download
    showNotification('Preparing documents for download...', 'info');
    
    setTimeout(() => {
        // Create a beautifully formatted HTML document
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Counseling Documents - ${currentStudentData.profile?.fullName || currentStudent}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .document-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.5rem;
            color: #6366f1;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #6366f1;
            font-weight: 600;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #6366f1;
        }
        
        .info-label {
            font-weight: 600;
            color: #6366f1;
            margin-bottom: 5px;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-value {
            font-size: 1.1rem;
            color: #333;
            font-weight: 500;
        }
        
        .marks-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .marks-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .mark-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .mark-subject {
            font-weight: 600;
            color: #6366f1;
            margin-bottom: 5px;
        }
        
        .mark-score {
            font-size: 1.2rem;
            font-weight: 700;
            color: #333;
        }
        
        .total-marks {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-top: 20px;
        }
        
        .total-marks h3 {
            font-size: 1.3rem;
            margin-bottom: 10px;
        }
        
        .total-marks .score {
            font-size: 2rem;
            font-weight: 700;
        }
        
        .preferences-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .preference-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        
        .preference-number {
            background: #6366f1;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-right: 15px;
        }
        
        .status-section {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #bbdefb;
        }
        
        .status-item:last-child {
            border-bottom: none;
        }
        
        .status-label {
            font-weight: 600;
            color: #1976d2;
        }
        
        .status-value {
            font-weight: 600;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-allocated {
            background: #d4edda;
            color: #155724;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
        }
        
        .footer p {
            color: #6c757d;
            margin-bottom: 10px;
        }
        
        .footer .date {
            font-weight: 600;
            color: #6366f1;
        }
        
        @media print {
            body {
                background: white;
            }
            .document-container {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="document-container">
        <div class="header">
            <h1>🎓 Student Counseling Documents</h1>
            <p>Official Academic Record & Counseling Information</p>
        </div>
        
        <div class="content">
            <!-- Personal Information -->
            <div class="section">
                <h2 class="section-title">👤 Personal Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Full Name</div>
                        <div class="info-value">${currentStudentData.profile?.fullName || 'Not provided'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email Address</div>
                        <div class="info-value">${currentStudentData.email}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Phone Number</div>
                        <div class="info-value">${currentStudentData.profile?.phone || 'Not provided'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date of Birth</div>
                        <div class="info-value">${currentStudentData.profile?.dateOfBirth || 'Not provided'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Academic Details -->
            <div class="section">
                <h2 class="section-title">📚 Academic Performance</h2>
                
                <!-- 10th Standard Marks -->
                <div class="marks-section">
                    <h3 style="color: #6366f1; margin-bottom: 15px;">🏫 High School (10th Standard)</h3>
                    <div class="marks-grid">
                        <div class="mark-item">
                            <div class="mark-subject">Mathematics</div>
                            <div class="mark-score">${currentStudentData.academics.math10 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Science</div>
                            <div class="mark-score">${currentStudentData.academics.science10 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">English</div>
                            <div class="mark-score">${currentStudentData.academics.english10 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Hindi</div>
                            <div class="mark-score">${currentStudentData.academics.hindi10 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Social Studies</div>
                            <div class="mark-score">${currentStudentData.academics.social10 || 0}/100</div>
                        </div>
                    </div>
                    <div class="total-marks">
                        <h3>10th Standard Total</h3>
                        <div class="score">${calculate10thTotal(currentStudentData.academics)}/500</div>
                    </div>
                </div>
                
                <!-- 12th Standard Marks -->
                <div class="marks-section">
                    <h3 style="color: #6366f1; margin-bottom: 15px;">🎓 Higher Secondary (12th Standard)</h3>
                    <div class="marks-grid">
                        <div class="mark-item">
                            <div class="mark-subject">Physics</div>
                            <div class="mark-score">${currentStudentData.academics.physics12 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Chemistry</div>
                            <div class="mark-score">${currentStudentData.academics.chemistry12 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Mathematics</div>
                            <div class="mark-score">${currentStudentData.academics.math12 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">English</div>
                            <div class="mark-score">${currentStudentData.academics.english12 || 0}/100</div>
                        </div>
                    </div>
                    <div class="total-marks">
                        <h3>12th Standard Total</h3>
                        <div class="score">${calculateTotalMarks(currentStudentData.academics)}/400</div>
                    </div>
                </div>
            </div>
            
            <!-- Branch Preferences -->
            <div class="section">
                <h2 class="section-title">🎯 Branch Preferences</h2>
                <div class="preferences-section">
                    <div class="preference-item">
                        <div class="preference-number">1</div>
                        <div class="info-value">${getBranchName(currentStudentData.academics.preference1)}</div>
                    </div>
                    <div class="preference-item">
                        <div class="preference-number">2</div>
                        <div class="info-value">${getBranchName(currentStudentData.academics.preference2)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Counseling Status -->
            <div class="section">
                <h2 class="section-title">📋 Counseling Status</h2>
                <div class="status-section">
                    <div class="status-item">
                        <span class="status-label">Application Status</span>
                        <span class="status-value ${currentStudentData.profile && currentStudentData.academics ? 'status-allocated' : 'status-pending'}">
                            ${currentStudentData.profile && currentStudentData.academics ? 'Complete' : 'In Progress'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Allocated Branch</span>
                        <span class="status-value ${currentStudentData.academics.allocatedBranch ? 'status-allocated' : 'status-pending'}">
                            ${currentStudentData.academics.allocatedBranch ? getBranchName(currentStudentData.academics.allocatedBranch) : 'Not Allocated Yet'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Payment Status</span>
                        <span class="status-value ${currentStudentData.payment?.verified ? 'status-allocated' : 'status-pending'}">
                            ${currentStudentData.payment?.verified ? 'Verified' : currentStudentData.payment ? 'Pending Verification' : 'Not Paid'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This document was generated by the Student Counseling Portal</p>
            <p class="date">Generated on: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>
    </div>
</body>
</html>`;
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `counseling_documents_${currentStudent}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Beautiful documents downloaded successfully!', 'success');
    }, 2000);
}

function contactCounselor() {
    const counselorInfo = `
Counseling Support Team

📞 Phone: +91 98765 43210
📧 Email: counselor@studentcounsel.edu
🕒 Hours: Monday - Friday, 9:00 AM - 6:00 PM

For urgent queries, please call the helpline number.
    `;
    
    // Show counselor contact information
    alert(counselorInfo);
}

function calculateTotalMarks(academics) {
    if (!academics) return 0;
    return (academics.physics12 || 0) + 
           (academics.chemistry12 || 0) + 
           (academics.math12 || 0) + 
           (academics.english12 || 0);
}

function calculate10thTotal(academics) {
    if (!academics) return 0;
    return (academics.math10 || 0) + 
           (academics.science10 || 0) + 
           (academics.english10 || 0) + 
           (academics.hindi10 || 0) + 
           (academics.social10 || 0);
}

function getBranchName(branchCode) {
    const branches = {
        'computer-science': 'Computer Science Engineering',
        'mechanical': 'Mechanical Engineering',
        'electrical': 'Electrical Engineering',
        'civil': 'Civil Engineering',
        'electronics': 'Electronics & Communication',
        'chemical': 'Chemical Engineering',
        'biotechnology': 'Biotechnology',
        'information-technology': 'Information Technology'
    };
    return branches[branchCode] || branchCode;
}

// Update counseling status when student data changes
function updateCounselingStatus() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentStudentData = students.find(s => s.email === currentStudent);
    
    if (!currentStudentData) return;
    
    // Update application status
    const applicationStatus = document.getElementById('applicationStatus');
    if (applicationStatus) {
        if (currentStudentData.profile && currentStudentData.academics) {
            applicationStatus.textContent = 'Complete';
            applicationStatus.style.color = '#10b981';
        } else if (currentStudentData.profile || currentStudentData.academics) {
            applicationStatus.textContent = 'In Progress';
            applicationStatus.style.color = '#f59e0b';
        } else {
            applicationStatus.textContent = 'Not Started';
            applicationStatus.style.color = '#ef4444';
        }
    }
    
    // Update rank in counseling section
    const counselingRank = document.getElementById('counselingRank');
    if (counselingRank && currentStudentData.academics) {
        const rankedStudents = students
            .filter(s => s.academics)
            .map(s => ({
                email: s.email,
                totalMarks: calculateTotalMarks(s.academics)
            }))
            .sort((a, b) => b.totalMarks - a.totalMarks);
        
        const rank = rankedStudents.findIndex(s => s.email === currentStudent) + 1;
        const currentMarks = calculateTotalMarks(currentStudentData.academics);
        
        if (rankedStudents.length === 1) {
            counselingRank.textContent = `Marks: ${currentMarks}/400 (Only Student)`;
            counselingRank.style.color = '#10b981';
        } else if (rank === 1) {
            counselingRank.textContent = `Rank 1 - ${currentMarks}/400 marks (Highest!)`;
            counselingRank.style.color = '#10b981';
        } else if (rank <= 3) {
            const topMarks = rankedStudents[0].totalMarks;
            const difference = topMarks - currentMarks;
            counselingRank.textContent = `Rank ${rank} - ${currentMarks}/400 (${difference} marks behind top)`;
            counselingRank.style.color = '#10b981';
        } else if (rank <= 10) {
            const topMarks = rankedStudents[0].totalMarks;
            const difference = topMarks - currentMarks;
            counselingRank.textContent = `Rank ${rank} - ${currentMarks}/400 (${difference} marks behind top)`;
            counselingRank.style.color = '#f59e0b';
        } else {
            const topMarks = rankedStudents[0].totalMarks;
            const difference = topMarks - currentMarks;
            counselingRank.textContent = `Rank ${rank} - ${currentMarks}/400 (${difference} marks behind top)`;
            counselingRank.style.color = '#6b7280';
        }
    }
    
    // Update allocated branch in counseling section
    const allocatedBranchStatus = document.getElementById('allocatedBranchStatus');
    if (allocatedBranchStatus) {
        if (currentStudentData.academics && currentStudentData.academics.allocatedBranch) {
            const branchName = getBranchName(currentStudentData.academics.allocatedBranch);
            allocatedBranchStatus.textContent = branchName;
            allocatedBranchStatus.style.color = '#10b981';
        } else {
            allocatedBranchStatus.textContent = 'Not Allocated';
            allocatedBranchStatus.style.color = '#ef4444';
        }
    }
    
    // Update seat confirmation
    const seatConfirmation = document.getElementById('seatConfirmation');
    if (seatConfirmation) {
        if (currentStudentData.payment && currentStudentData.payment.verified) {
            seatConfirmation.textContent = 'Confirmed';
            seatConfirmation.style.color = '#10b981';
        } else if (currentStudentData.payment) {
            seatConfirmation.textContent = 'Payment Pending';
            seatConfirmation.style.color = '#f59e0b';
        } else {
            seatConfirmation.textContent = 'Pending';
            seatConfirmation.style.color = '#6b7280';
        }
    }
}

// Simulate payment verification for demo purposes
function simulatePaymentVerification() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentStudentData = students.find(s => s.email === currentStudent);
    
    if (!currentStudentData || !currentStudentData.payment) {
        showNotification('No payment data found. Please submit payment proof first.', 'warning');
        return;
    }
    
    if (currentStudentData.payment.verified) {
        showNotification('Payment is already verified!', 'info');
        return;
    }
    
    // Simulate admin verification
    const studentIndex = students.findIndex(s => s.email === currentStudent);
    if (studentIndex !== -1) {
        students[studentIndex].payment.verified = true;
        students[studentIndex].payment.verifiedAt = new Date().toISOString();
        localStorage.setItem('students', JSON.stringify(students));
    }
    
    showNotification('Payment verified successfully! Your seat is confirmed.', 'success');
    
    // Update status cards
    loadStudentStatus();
    
    // Update counseling status
    updateCounselingStatus();
}

// Add this to the quick actions
function verifyPayment() {
    simulatePaymentVerification();
}

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
window.logout = logout;
window.closeOfferLetter = closeOfferLetter;
window.downloadOfferLetter = downloadOfferLetter;
window.checkRank = checkRank;
window.viewAllocation = viewAllocation;
window.downloadDocuments = downloadDocuments;
window.contactCounselor = contactCounselor;
window.verifyPayment = verifyPayment;
window.simulateBranchAllocation = simulateBranchAllocation;
window.previewDocuments = previewDocuments;

// Preview documents in a new window
function previewDocuments() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentStudentData = students.find(s => s.email === currentStudent);
    
    if (!currentStudentData || !currentStudentData.academics) {
        showNotification('Please submit your academic details first.', 'warning');
        return;
    }
    
    // Create the same beautiful HTML content as downloadDocuments
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Counseling Documents - ${currentStudentData.profile?.fullName || currentStudent}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .document-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.5rem;
            color: #6366f1;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #6366f1;
            font-weight: 600;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #6366f1;
        }
        
        .info-label {
            font-weight: 600;
            color: #6366f1;
            margin-bottom: 5px;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-value {
            font-size: 1.1rem;
            color: #333;
            font-weight: 500;
        }
        
        .marks-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .marks-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .mark-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .mark-subject {
            font-weight: 600;
            color: #6366f1;
            margin-bottom: 5px;
        }
        
        .mark-score {
            font-size: 1.2rem;
            font-weight: 700;
            color: #333;
        }
        
        .total-marks {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-top: 20px;
        }
        
        .total-marks h3 {
            font-size: 1.3rem;
            margin-bottom: 10px;
        }
        
        .total-marks .score {
            font-size: 2rem;
            font-weight: 700;
        }
        
        .preferences-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .preference-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        
        .preference-number {
            background: #6366f1;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-right: 15px;
        }
        
        .status-section {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #bbdefb;
        }
        
        .status-item:last-child {
            border-bottom: none;
        }
        
        .status-label {
            font-weight: 600;
            color: #1976d2;
        }
        
        .status-value {
            font-weight: 600;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-allocated {
            background: #d4edda;
            color: #155724;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
        }
        
        .footer p {
            color: #6c757d;
            margin-bottom: 10px;
        }
        
        .footer .date {
            font-weight: 600;
            color: #6366f1;
        }
        
        .download-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #6366f1;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            transition: all 0.3s ease;
        }
        
        .download-btn:hover {
            background: #4f46e5;
            transform: translateY(-2px);
        }
        
        @media print {
            body {
                background: white;
            }
            .document-container {
                box-shadow: none;
                margin: 0;
            }
            .download-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <button class="download-btn" onclick="downloadDocument()">📥 Download PDF</button>
    
    <div class="document-container">
        <div class="header">
            <h1>🎓 Student Counseling Documents</h1>
            <p>Official Academic Record & Counseling Information</p>
        </div>
        
        <div class="content">
            <!-- Personal Information -->
            <div class="section">
                <h2 class="section-title">👤 Personal Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Full Name</div>
                        <div class="info-value">${currentStudentData.profile?.fullName || 'Not provided'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email Address</div>
                        <div class="info-value">${currentStudentData.email}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Phone Number</div>
                        <div class="info-value">${currentStudentData.profile?.phone || 'Not provided'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date of Birth</div>
                        <div class="info-value">${currentStudentData.profile?.dateOfBirth || 'Not provided'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Academic Details -->
            <div class="section">
                <h2 class="section-title">📚 Academic Performance</h2>
                
                <!-- 10th Standard Marks -->
                <div class="marks-section">
                    <h3 style="color: #6366f1; margin-bottom: 15px;">🏫 High School (10th Standard)</h3>
                    <div class="marks-grid">
                        <div class="mark-item">
                            <div class="mark-subject">Mathematics</div>
                            <div class="mark-score">${currentStudentData.academics.math10 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Science</div>
                            <div class="mark-score">${currentStudentData.academics.science10 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">English</div>
                            <div class="mark-score">${currentStudentData.academics.english10 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Hindi</div>
                            <div class="mark-score">${currentStudentData.academics.hindi10 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Social Studies</div>
                            <div class="mark-score">${currentStudentData.academics.social10 || 0}/100</div>
                        </div>
                    </div>
                    <div class="total-marks">
                        <h3>10th Standard Total</h3>
                        <div class="score">${calculate10thTotal(currentStudentData.academics)}/500</div>
                    </div>
                </div>
                
                <!-- 12th Standard Marks -->
                <div class="marks-section">
                    <h3 style="color: #6366f1; margin-bottom: 15px;">🎓 Higher Secondary (12th Standard)</h3>
                    <div class="marks-grid">
                        <div class="mark-item">
                            <div class="mark-subject">Physics</div>
                            <div class="mark-score">${currentStudentData.academics.physics12 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Chemistry</div>
                            <div class="mark-score">${currentStudentData.academics.chemistry12 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">Mathematics</div>
                            <div class="mark-score">${currentStudentData.academics.math12 || 0}/100</div>
                        </div>
                        <div class="mark-item">
                            <div class="mark-subject">English</div>
                            <div class="mark-score">${currentStudentData.academics.english12 || 0}/100</div>
                        </div>
                    </div>
                    <div class="total-marks">
                        <h3>12th Standard Total</h3>
                        <div class="score">${calculateTotalMarks(currentStudentData.academics)}/400</div>
                    </div>
                </div>
            </div>
            
            <!-- Branch Preferences -->
            <div class="section">
                <h2 class="section-title">🎯 Branch Preferences</h2>
                <div class="preferences-section">
                    <div class="preference-item">
                        <div class="preference-number">1</div>
                        <div class="info-value">${getBranchName(currentStudentData.academics.preference1)}</div>
                    </div>
                    <div class="preference-item">
                        <div class="preference-number">2</div>
                        <div class="info-value">${getBranchName(currentStudentData.academics.preference2)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Counseling Status -->
            <div class="section">
                <h2 class="section-title">📋 Counseling Status</h2>
                <div class="status-section">
                    <div class="status-item">
                        <span class="status-label">Application Status</span>
                        <span class="status-value ${currentStudentData.profile && currentStudentData.academics ? 'status-allocated' : 'status-pending'}">
                            ${currentStudentData.profile && currentStudentData.academics ? 'Complete' : 'In Progress'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Allocated Branch</span>
                        <span class="status-value ${currentStudentData.academics.allocatedBranch ? 'status-allocated' : 'status-pending'}">
                            ${currentStudentData.academics.allocatedBranch ? getBranchName(currentStudentData.academics.allocatedBranch) : 'Not Allocated Yet'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Payment Status</span>
                        <span class="status-value ${currentStudentData.payment?.verified ? 'status-allocated' : 'status-pending'}">
                            ${currentStudentData.payment?.verified ? 'Verified' : currentStudentData.payment ? 'Pending Verification' : 'Not Paid'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This document was generated by the Student Counseling Portal</p>
            <p class="date">Generated on: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>
    </div>
    
    <script>
        function downloadDocument() {
            window.print();
        }
    </script>
</body>
</html>`;
    
    // Open in new window
    const newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
}

// Test function to manually trigger form submission
function testFormSubmission() {
    console.log('Testing form submission...');
    
    // Test profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        console.log('Profile form found, testing submission...');
        // Fill some test data
        const testData = {
            fullName: 'Test User',
            dateOfBirth: '2000-01-01',
            gender: 'male',
            phone: '1234567890',
            email: 'test@example.com',
            address: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            parentName: 'Test Parent',
            parentPhone: '0987654321'
        };
        
        // Fill the form
        Object.keys(testData).forEach(key => {
            const input = profileForm.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = testData[key];
            }
        });
        
        // Trigger submit
        profileForm.dispatchEvent(new Event('submit'));
    } else {
        console.log('Profile form not found!');
    }
}

// Export for global access
window.testFormSubmission = testFormSubmission;

// Create sample students for ranking demonstration
function createSampleStudents() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    
    // Check if sample students already exist
    const sampleEmails = ['student1@example.com', 'student2@example.com', 'student3@example.com', 'student4@example.com'];
    const existingSamples = students.filter(s => sampleEmails.includes(s.email));
    
    if (existingSamples.length > 0) {
        console.log('Sample students already exist');
        return;
    }
    
    const sampleStudents = [
        {
            email: 'student1@example.com',
            profile: {
                fullName: 'Alice Johnson',
                dateOfBirth: '2000-05-15',
                gender: 'female',
                phone: '9876543210',
                email: 'student1@example.com',
                address: '123 Main St, City',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                parentName: 'John Johnson',
                parentPhone: '9876543211'
            },
            academics: {
                math10: 95,
                science10: 92,
                english10: 88,
                hindi10: 85,
                social10: 90,
                physics12: 96,
                chemistry12: 94,
                math12: 98,
                english12: 92,
                totalMarks12: 380,
                preference1: 'computer-science',
                preference2: 'electrical'
            }
        },
        {
            email: 'student2@example.com',
            profile: {
                fullName: 'Bob Smith',
                dateOfBirth: '2000-08-22',
                gender: 'male',
                phone: '9876543212',
                email: 'student2@example.com',
                address: '456 Oak Ave, Town',
                city: 'Delhi',
                state: 'Delhi',
                pincode: '110001',
                parentName: 'Mary Smith',
                parentPhone: '9876543213'
            },
            academics: {
                math10: 88,
                science10: 90,
                english10: 85,
                hindi10: 82,
                social10: 87,
                physics12: 92,
                chemistry12: 90,
                math12: 94,
                english12: 88,
                totalMarks12: 364,
                preference1: 'mechanical',
                preference2: 'civil'
            }
        },
        {
            email: 'student3@example.com',
            profile: {
                fullName: 'Carol Davis',
                dateOfBirth: '2000-03-10',
                gender: 'female',
                phone: '9876543214',
                email: 'student3@example.com',
                address: '789 Pine Rd, Village',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560001',
                parentName: 'Robert Davis',
                parentPhone: '9876543215'
            },
            academics: {
                math10: 92,
                science10: 94,
                english10: 90,
                hindi10: 88,
                social10: 92,
                physics12: 94,
                chemistry12: 96,
                math12: 96,
                english12: 90,
                totalMarks12: 376,
                preference1: 'electronics',
                preference2: 'computer-science'
            }
        },
        {
            email: 'student4@example.com',
            profile: {
                fullName: 'David Wilson',
                dateOfBirth: '2000-11-05',
                gender: 'male',
                phone: '9876543216',
                email: 'student4@example.com',
                address: '321 Elm St, Borough',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600001',
                parentName: 'Sarah Wilson',
                parentPhone: '9876543217'
            },
            academics: {
                math10: 85,
                science10: 88,
                english10: 92,
                hindi10: 85,
                social10: 88,
                physics12: 88,
                chemistry12: 90,
                math12: 92,
                english12: 94,
                totalMarks12: 364,
                preference1: 'chemical',
                preference2: 'biotechnology'
            }
        }
    ];
    
    // Add sample students to existing students
    const updatedStudents = [...students, ...sampleStudents];
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    
    console.log('Sample students created successfully');
    showNotification('Sample students created for ranking demonstration!', 'success');
    
    // Update the display
    updateCounselingStatus();
    loadStudentStatus();
}

// Export for global access
window.createSampleStudents = createSampleStudents;

// Show complete ranking list
function showRankingList() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const currentStudentData = students.find(s => s.email === currentStudent);
    
    if (!currentStudentData || !currentStudentData.academics) {
        showNotification('Please submit your academic details first.', 'warning');
        return;
    }
    
    const rankedStudents = students
        .filter(s => s.academics)
        .map(s => ({
            email: s.email,
            name: s.profile?.fullName || s.email,
            totalMarks: calculateTotalMarks(s.academics),
            percentage: ((calculateTotalMarks(s.academics) / 400) * 100).toFixed(1),
            isCurrent: s.email === currentStudent
        }))
        .sort((a, b) => b.totalMarks - a.totalMarks);
    
    if (rankedStudents.length === 1) {
        showNotification('You are the only student registered.', 'info');
        return;
    }
    
    // Create a modal to show the ranking list
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <span class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
            <h2>📊 Complete Ranking List (Based on 12th Standard Marks)</h2>
            <div style="margin-bottom: 15px; padding: 10px; background-color: #f3f4f6; border-radius: 5px;">
                <strong>📈 Ranking Criteria:</strong> Total marks in Physics + Chemistry + Mathematics + English (Maximum: 400 marks)
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${rankedStudents.map((student, index) => {
                    const rank = index + 1;
                    const indicator = student.isCurrent ? ' 👤 (You)' : '';
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                    const bgColor = student.isCurrent ? '#e3f2fd' : '';
                    const borderColor = rank === 1 ? '#10b981' : rank === 2 ? '#f59e0b' : rank === 3 ? '#8b5cf6' : '#6b7280';
                    
                    // Calculate difference from top
                    const topMarks = rankedStudents[0].totalMarks;
                    const difference = topMarks - student.totalMarks;
                    const differenceText = rank === 1 ? ' (Top Score!)' : ` (${difference} marks behind top)`;
                    
                    return `
                        <div style="padding: 15px; margin: 8px 0; background-color: ${bgColor}; border-radius: 8px; border-left: 5px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="font-size: 16px;">${medal} Rank ${rank}:</strong> ${student.name}${indicator}
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 18px; font-weight: bold; color: ${rank <= 3 ? '#10b981' : '#6b7280'};">
                                        ${student.totalMarks}/400 marks
                                    </div>
                                    <div style="font-size: 14px; color: #6b7280;">
                                        ${student.percentage}%${differenceText}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 5px; border-left: 4px solid #3b82f6;">
                <strong>📊 Summary:</strong> ${rankedStudents.length} students ranked by 12th standard total marks. 
                Top score: ${rankedStudents[0].totalMarks}/400 (${rankedStudents[0].percentage}%)
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" style="background-color: #6366f1; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Export for global access
window.showRankingList = showRankingList;