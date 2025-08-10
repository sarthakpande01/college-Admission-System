// Admin Dashboard JavaScript
let currentAdmin = null;
let students = [];
let rankings = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
    setupEventListeners();
    loadDashboardData();
});

// Initialize Admin Dashboard
function initializeAdminDashboard() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Validate token
    if (!validateToken(token)) {
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
        return;
    }

    // Get current admin
    currentAdmin = getCurrentUser();
    loadStudents();
    updateDashboardStats();
}

// Setup Event Listeners
function setupEventListeners() {
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

    // Manual allocation form
    document.getElementById('manualAllocationForm')?.addEventListener('submit', handleManualAllocation);
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
        
        return decoded.userType === 'admin';
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
function loadDashboardData() {
    loadStudents();
    updateDashboardStats();
    updateSeatCounts();
}

function loadStudents() {
    students = JSON.parse(localStorage.getItem('students') || '[]');
    populateStudentsTable();
    populateRankingsTable();
    populateAllocationTable();
    populatePaymentsTable();
}

function updateDashboardStats() {
    const totalStudents = students.length;
    const profileComplete = students.filter(s => s.profile).length;
    const marksSubmitted = students.filter(s => s.academics).length;
    const paymentsVerified = students.filter(s => s.paymentVerified).length;

    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('profileComplete').textContent = profileComplete;
    document.getElementById('marksSubmitted').textContent = marksSubmitted;
    document.getElementById('paymentsVerified').textContent = paymentsVerified;
}

function updateSeatCounts() {
    const branchSeats = {
        'computer-science': { total: 120, allocated: 0 },
        'mechanical': { total: 100, allocated: 0 },
        'electrical': { total: 80, allocated: 0 },
        'civil': { total: 90, allocated: 0 },
        'electronics': { total: 70, allocated: 0 },
        'chemical': { total: 60, allocated: 0 }
    };

    // Count allocated seats
    students.forEach(student => {
        if (student.allocatedBranch && branchSeats[student.allocatedBranch]) {
            branchSeats[student.allocatedBranch].allocated++;
        }
    });

    // Update display
    Object.keys(branchSeats).forEach(branch => {
        const seats = branchSeats[branch];
        const totalElement = document.getElementById(`${branch.replace('-', '')}Seats`);
        const allocatedElement = document.getElementById(`${branch.replace('-', '')}Allocated`);
        
        if (totalElement) totalElement.textContent = seats.total;
        if (allocatedElement) allocatedElement.textContent = seats.allocated;
    });
}

// Table Population Functions
function populateStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.profile?.fullName || 'N/A'}</td>
            <td>${student.email}</td>
            <td>${student.profile?.phone || 'N/A'}</td>
            <td><span class="status-${student.profile ? 'complete' : 'pending'}">${student.profile ? 'Complete' : 'Pending'}</span></td>
            <td><span class="status-${student.academics ? 'complete' : 'pending'}">${student.academics ? 'Submitted' : 'Pending'}</span></td>
            <td>${student.academics?.totalMarks12 || 'N/A'}</td>
            <td>${student.rank || 'N/A'}</td>
            <td>${student.allocatedBranch || 'Not Allocated'}</td>
            <td><span class="status-${student.paymentVerified ? 'verified' : 'pending'}">${student.paymentVerified ? 'Verified' : 'Pending'}</span></td>
            <td>
                <button class="btn-primary" onclick="viewStudentDetails('${student.email}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateRankingsTable() {
    const tbody = document.getElementById('rankingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    // Sort students by total marks (descending)
    const sortedStudents = students
        .filter(s => s.academics)
        .sort((a, b) => (b.academics.totalMarks12 || 0) - (a.academics.totalMarks12 || 0));

    sortedStudents.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${students.indexOf(student) + 1}</td>
            <td>${student.profile?.fullName || 'N/A'}</td>
            <td>${student.academics.totalMarks12}</td>
            <td>${student.academics.physics12}</td>
            <td>${student.academics.chemistry12}</td>
            <td>${student.academics.math12}</td>
            <td>${student.academics.english12}</td>
            <td>${student.academics.preference1}</td>
            <td>${student.academics.preference2}</td>
            <td>${student.allocatedBranch || 'Not Allocated'}</td>
        `;
        tbody.appendChild(row);
    });
}

function populateAllocationTable() {
    const tbody = document.getElementById('allocationTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    const allocatedStudents = students.filter(s => s.allocatedBranch);
    
    allocatedStudents.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.rank || 'N/A'}</td>
            <td>${student.profile?.fullName || 'N/A'}</td>
            <td>${student.academics?.totalMarks12 || 'N/A'}</td>
            <td>${student.academics?.preference1 || 'N/A'}</td>
            <td>${student.academics?.preference2 || 'N/A'}</td>
            <td>${student.allocatedBranch}</td>
            <td><span class="status-complete">Allocated</span></td>
            <td>
                <button class="btn-secondary" onclick="changeAllocation('${student.email}')">Change</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populatePaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    const studentsWithPayments = students.filter(s => s.payment);
    
    studentsWithPayments.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.profile?.fullName || 'N/A'}</td>
            <td>₹${student.payment.amount}</td>
            <td>${student.payment.transactionId}</td>
            <td>${student.payment.bankName}</td>
            <td><button class="btn-primary" onclick="viewReceipt('${student.email}')">View</button></td>
            <td><span class="status-${student.paymentVerified ? 'verified' : 'pending'}">${student.paymentVerified ? 'Verified' : 'Pending'}</span></td>
            <td>
                ${!student.paymentVerified ? 
                    `<button class="btn-success" onclick="verifyPayment('${student.email}')">Verify</button>` :
                    '<span class="status-verified">Verified</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Ranking Functions
function generateRankings() {
    // Filter students with academic data
    const studentsWithMarks = students.filter(s => s.academics && s.academics.totalMarks12);
    
    // Sort by total marks (descending)
    const sortedStudents = studentsWithMarks.sort((a, b) => 
        (b.academics.totalMarks12 || 0) - (a.academics.totalMarks12 || 0)
    );
    
    // Assign ranks
    sortedStudents.forEach((student, index) => {
        student.rank = index + 1;
    });
    
    // Save updated data
    localStorage.setItem('students', JSON.stringify(students));
    
    // Update tables
    populateRankingsTable();
    populateStudentsTable();
    
    showNotification('Rankings generated successfully!', 'success');
}

// Allocation Functions
function allocateSeats() {
    // Get students with marks and preferences
    const eligibleStudents = students.filter(s => 
        s.academics && s.academics.totalMarks12 && 
        s.academics.preference1 && s.academics.preference2
    );
    
    // Sort by rank
    const sortedStudents = eligibleStudents.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    
    // Initialize seat counters
    const seatCounts = {
        'computer-science': 0,
        'mechanical': 0,
        'electrical': 0,
        'civil': 0,
        'electronics': 0,
        'chemical': 0
    };
    
    const maxSeats = {
        'computer-science': 120,
        'mechanical': 100,
        'electrical': 80,
        'civil': 90,
        'electronics': 70,
        'chemical': 60
    };
    
    // Allocate seats
    sortedStudents.forEach(student => {
        const pref1 = student.academics.preference1;
        const pref2 = student.academics.preference2;
        
        // Try first preference
        if (seatCounts[pref1] < maxSeats[pref1]) {
            student.allocatedBranch = pref1;
            seatCounts[pref1]++;
        }
        // Try second preference
        else if (seatCounts[pref2] < maxSeats[pref2]) {
            student.allocatedBranch = pref2;
            seatCounts[pref2]++;
        }
        // No allocation possible
        else {
            student.allocatedBranch = null;
        }
    });
    
    // Save updated data
    localStorage.setItem('students', JSON.stringify(students));
    
    // Update tables and counts
    populateAllocationTable();
    populateStudentsTable();
    updateSeatCounts();
    
    showNotification('Seats allocated successfully!', 'success');
}

function manualAllocation() {
    // Populate student select
    const studentSelect = document.getElementById('studentSelect');
    if (studentSelect) {
        studentSelect.innerHTML = '<option value="">Choose a student...</option>';
        students.forEach((student, index) => {
            const option = document.createElement('option');
            option.value = student.email;
            option.textContent = `${student.profile?.fullName || student.email} (Rank: ${student.rank || 'N/A'})`;
            studentSelect.appendChild(option);
        });
    }
    
    document.getElementById('manualAllocationModal').style.display = 'block';
}

function closeManualAllocation() {
    document.getElementById('manualAllocationModal').style.display = 'none';
}

async function handleManualAllocation(event) {
    event.preventDefault();
    
    const studentEmail = document.getElementById('studentSelect').value;
    const branch = document.getElementById('branchSelect').value;
    
    if (!studentEmail || !branch) {
        showNotification('Please select both student and branch.', 'error');
        return;
    }
    
    // Find and update student
    const studentIndex = students.findIndex(s => s.email === studentEmail);
    if (studentIndex !== -1) {
        students[studentIndex].allocatedBranch = branch;
        localStorage.setItem('students', JSON.stringify(students));
        
        // Update tables
        populateAllocationTable();
        populateStudentsTable();
        updateSeatCounts();
        
        closeManualAllocation();
        showNotification('Seat allocated manually!', 'success');
    }
}

// Payment Functions
function verifyPayments() {
    // Show payment verification modal for first pending payment
    const pendingPayment = students.find(s => s.payment && !s.paymentVerified);
    if (pendingPayment) {
        showPaymentVerification(pendingPayment);
    } else {
        showNotification('No pending payments to verify.', 'info');
    }
}

function verifyAllPayments() {
    const pendingPayments = students.filter(s => s.payment && !s.paymentVerified);
    
    if (pendingPayments.length === 0) {
        showNotification('No pending payments to verify.', 'info');
        return;
    }
    
    // Auto-verify all pending payments
    pendingPayments.forEach(student => {
        student.paymentVerified = true;
    });
    
    localStorage.setItem('students', JSON.stringify(students));
    populatePaymentsTable();
    populateStudentsTable();
    updateDashboardStats();
    
    showNotification(`${pendingPayments.length} payments verified successfully!`, 'success');
}

function verifyPayment(studentEmail) {
    const student = students.find(s => s.email === studentEmail);
    if (student) {
        showPaymentVerification(student);
    }
}

function showPaymentVerification(student) {
    const paymentDetails = document.getElementById('paymentDetails');
    if (paymentDetails) {
        paymentDetails.innerHTML = `
            <h3>Payment Details</h3>
            <p><strong>Student:</strong> ${student.profile?.fullName || student.email}</p>
            <p><strong>Amount:</strong> ₹${student.payment.amount}</p>
            <p><strong>Transaction ID:</strong> ${student.payment.transactionId}</p>
            <p><strong>Bank:</strong> ${student.payment.bankName}</p>
            <p><strong>Account:</strong> ${student.payment.accountNumber}</p>
        `;
    }
    
    // Store current student for approval/rejection
    window.currentVerificationStudent = student.email;
    
    document.getElementById('paymentVerificationModal').style.display = 'block';
}

function closePaymentVerification() {
    document.getElementById('paymentVerificationModal').style.display = 'none';
    window.currentVerificationStudent = null;
}

function approvePayment() {
    const studentEmail = window.currentVerificationStudent;
    if (studentEmail) {
        const studentIndex = students.findIndex(s => s.email === studentEmail);
        if (studentIndex !== -1) {
            students[studentIndex].paymentVerified = true;
            localStorage.setItem('students', JSON.stringify(students));
            
            populatePaymentsTable();
            populateStudentsTable();
            updateDashboardStats();
            
            closePaymentVerification();
            showNotification('Payment approved successfully!', 'success');
        }
    }
}

function rejectPayment() {
    const studentEmail = window.currentVerificationStudent;
    if (studentEmail) {
        const studentIndex = students.findIndex(s => s.email === studentEmail);
        if (studentIndex !== -1) {
            students[studentIndex].paymentVerified = false;
            localStorage.setItem('students', JSON.stringify(students));
            
            populatePaymentsTable();
            populateStudentsTable();
            updateDashboardStats();
            
            closePaymentVerification();
            showNotification('Payment rejected.', 'error');
        }
    }
}

// Utility Functions
function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.profile?.fullName?.toLowerCase().includes(searchTerm) ||
                             student.email.toLowerCase().includes(searchTerm);
        
        let matchesStatus = true;
        if (statusFilter) {
            switch (statusFilter) {
                case 'profile-complete':
                    matchesStatus = !!student.profile;
                    break;
                case 'marks-submitted':
                    matchesStatus = !!student.academics;
                    break;
                case 'allocated':
                    matchesStatus = !!student.allocatedBranch;
                    break;
                case 'payment-verified':
                    matchesStatus = !!student.paymentVerified;
                    break;
            }
        }
        
        return matchesSearch && matchesStatus;
    });
    
    // Update table with filtered results
    populateFilteredStudentsTable(filteredStudents);
}

function populateFilteredStudentsTable(filteredStudents) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    filteredStudents.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.profile?.fullName || 'N/A'}</td>
            <td>${student.email}</td>
            <td>${student.profile?.phone || 'N/A'}</td>
            <td><span class="status-${student.profile ? 'complete' : 'pending'}">${student.profile ? 'Complete' : 'Pending'}</span></td>
            <td><span class="status-${student.academics ? 'complete' : 'pending'}">${student.academics ? 'Submitted' : 'Pending'}</span></td>
            <td>${student.academics?.totalMarks12 || 'N/A'}</td>
            <td>${student.rank || 'N/A'}</td>
            <td>${student.allocatedBranch || 'Not Allocated'}</td>
            <td><span class="status-${student.paymentVerified ? 'verified' : 'pending'}">${student.paymentVerified ? 'Verified' : 'Pending'}</span></td>
            <td>
                <button class="btn-primary" onclick="viewStudentDetails('${student.email}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewStudentDetails(studentEmail) {
    const student = students.find(s => s.email === studentEmail);
    if (student) {
        // In a real application, this would show a detailed modal
        showNotification(`Viewing details for ${student.profile?.fullName || student.email}`, 'info');
    }
}

function viewReceipt(studentEmail) {
    const student = students.find(s => s.email === studentEmail);
    if (student && student.payment) {
        // In a real application, this would show the receipt image/PDF
        showNotification(`Viewing receipt for ${student.profile?.fullName || student.email}`, 'info');
    }
}

function changeAllocation(studentEmail) {
    // In a real application, this would open a modal to change allocation
    showNotification(`Changing allocation for ${studentEmail}`, 'info');
}

function generateReports() {
    // In a real application, this would generate and download reports
    showNotification('Generating reports...', 'info');
    
    setTimeout(() => {
        showNotification('Reports generated successfully!', 'success');
    }, 2000);
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

// Notification System
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
    localStorage.removeItem('userType');
    window.location.href = 'index.html';
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
window.generateRankings = generateRankings;
window.allocateSeats = allocateSeats;
window.manualAllocation = manualAllocation;
window.closeManualAllocation = closeManualAllocation;
window.verifyPayments = verifyPayments;
window.verifyAllPayments = verifyAllPayments;
window.verifyPayment = verifyPayment;
window.closePaymentVerification = closePaymentVerification;
window.approvePayment = approvePayment;
window.rejectPayment = rejectPayment;
window.filterStudents = filterStudents;
window.viewStudentDetails = viewStudentDetails;
window.viewReceipt = viewReceipt;
window.changeAllocation = changeAllocation;
window.generateReports = generateReports; 