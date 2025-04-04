// Known member IDs
const knownMembers = ["8012293640"];

// Store generated certificates
let generatedCertificates = new Map();

// Current step
let currentStep = 1;

function nextStep() {
    if (currentStep === 1) {
        const name = document.getElementById('nameInput').value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        currentStep = 2;
    } else if (currentStep === 2) {
        const telegramId = document.getElementById('telegramId').value.trim();
        if (!telegramId) {
            alert('Please enter your Telegram ID');
            return;
        }
        if (!knownMembers.includes(telegramId)) {
            alert('Invalid Telegram ID. Please check and try again.');
            return;
        }
        generateCertificate();
    }
}

function generateCertificate() {
    const name = document.getElementById('nameInput').value;
    const telegramId = document.getElementById('telegramId').value;
    
    // Generate unique certificate ID
    const certificateId = generateUniqueId();
    
    // Store certificate data
    generatedCertificates.set(certificateId, {
        name: name,
        telegramId: telegramId,
        issueDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    });

    // Update certificate content
    document.getElementById('recipientName').textContent = name;
    document.getElementById('certificateId').textContent = certificateId;
    document.getElementById('issueDate').textContent = generatedCertificates.get(certificateId).issueDate;

    // Show certificate
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    currentStep = 3;

    // Add animation class to the star
    const nameStar = document.querySelector('.name-star');
    nameStar.style.animation = 'starRotate 20s linear infinite';
}

function generateUniqueId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `APL-${timestamp}-${randomStr}`.toUpperCase();
}

function downloadPDF() {
    const certificate = document.querySelector('.certificate');
    
    html2canvas(certificate, {
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('A+_Tutorial_Certificate.pdf');
    });
}

// Verification Modal
function openVerificationModal() {
    document.getElementById('verificationModal').style.display = 'block';
}

function closeVerificationModal() {
    document.getElementById('verificationModal').style.display = 'none';
}

function verifyCertificate() {
    const verificationId = document.getElementById('verificationId').value.trim();
    const resultDiv = document.getElementById('verificationResult');
    
    if (generatedCertificates.has(verificationId)) {
        const cert = generatedCertificates.get(verificationId);
        resultDiv.className = 'success';
        resultDiv.innerHTML = `
            <i class="fas fa-check-circle verification-icon"></i>
            <div>
                <h3>Certificate Verified ✓</h3>
                <p>Name: ${cert.name}</p>
                <p>Issue Date: ${cert.issueDate}</p>
            </div>
        `;
    } else {
        resultDiv.className = 'error';
        resultDiv.innerHTML = `
            <i class="fas fa-times-circle verification-icon"></i>
            <div>
                <h3>Invalid Certificate</h3>
                <p>The certificate ID provided is not valid or has not been issued.</p>
            </div>
        `;
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('verificationModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking the X
document.querySelector('.close').onclick = function() {
    document.getElementById('verificationModal').style.display = 'none';
}

// Prevent form submission on enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        return false;
    }
}); 