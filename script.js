// Store verified certificates
let verifiedCertificates = new Map();
let usedTelegramIds = new Set();

// List of known member IDs
const knownMembers = [
    "8012293640"  // Known member ID
];

let currentStep = 1;
window.jsPDF = window.jspdf.jsPDF;

function generateCertificateId() {
    return 'APT-' + Date.now().toString(36).toUpperCase() + 
           Math.random().toString(36).substring(2, 7).toUpperCase();
}

// Handle multi-step form navigation
function nextStep(step) {
    if (step === 1) {
        const name = document.getElementById('nameInput').value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        currentStep = 2;
    }
    
    else if (step === 2) {
        const telegramId = document.getElementById('telegramInput').value.trim();
        const name = document.getElementById('nameInput').value.trim();
        
        if (!telegramId) {
            alert('Please enter your Telegram ID');
            return;
        }

        if (usedTelegramIds.has(telegramId)) {
            alert('This Telegram ID has already generated a certificate.');
            return;
        }

        // Generate certificate and show it if the ID matches
        if (knownMembers.includes(telegramId)) {
            generateCertificate(name, telegramId);
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'block';
            currentStep = 3;
        } else {
            alert('This Telegram ID is not recognized. Please verify your membership.');
        }
    }
}

function previousStep(step) {
    document.getElementById(`step${step}`).style.display = 'none';
    document.getElementById(`step${step - 1}`).style.display = 'block';
    currentStep = step - 1;
}

function generateCertificate(name, telegramId) {
    // Update certificate name
    document.getElementById('certificateName').textContent = name;
    
    // Update current date
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('certificateDate').textContent = currentDate;

    // Generate and update certificate ID
    const certificateId = generateCertificateId();
    document.getElementById('certificateId').textContent = certificateId;

    // Store certificate information
    verifiedCertificates.set(certificateId, {
        name: name,
        date: currentDate,
        telegramId: telegramId
    });

    // Mark this Telegram ID as used
    usedTelegramIds.add(telegramId);
}

async function downloadCertificate(format) {
    const certificate = document.querySelector('.certificate');
    const scale = 2; // Increase quality
    
    try {
        const canvas = await html2canvas(certificate, {
            scale: scale,
            useCORS: true,
            logging: false
        });

        if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('A+_Tutorial_Certificate.pdf');
        } else {
            const link = document.createElement('a');
            link.download = 'A+_Tutorial_Certificate.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    } catch (error) {
        console.error('Error generating certificate:', error);
        alert('There was an error generating your certificate. Please try again.');
    }
}

// Certificate verification functionality
function showVerificationModal() {
    document.getElementById('verificationModal').style.display = 'block';
}

function closeVerificationModal() {
    document.getElementById('verificationModal').style.display = 'none';
}

function verifyCertificate() {
    const certId = document.getElementById('verifyCertId').value.trim();
    const resultDiv = document.getElementById('verificationResult');
    
    if (verifiedCertificates.has(certId)) {
        const cert = verifiedCertificates.get(certId);
        resultDiv.className = 'success';
        resultDiv.innerHTML = `
            <h3><i class="fas fa-check-circle"></i> Certificate Verified</h3>
            <p><strong>Issued to:</strong> ${cert.name}</p>
            <p><strong>Date:</strong> ${cert.date}</p>
            <p><strong>Status:</strong> Valid A+ Tutorial Class Certificate</p>
            <p class="verification-note">This certificate has been verified as authentic and was issued by A+ Tutorial Class.</p>
        `;
    } else {
        resultDiv.className = 'error';
        resultDiv.innerHTML = `
            <h3><i class="fas fa-times-circle"></i> Invalid Certificate</h3>
            <p>This certificate ID is not recognized in our system.</p>
            <p>Please check the ID and try again.</p>
        `;
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('verificationModal');
    if (event.target === modal) {
        closeVerificationModal();
    }
};

// Prevent form submission on enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        return false;
    }
}); 