// Store verified certificates
let verifiedCertificates = new Map();
let usedTelegramIds = new Set();

// Telegram Bot Token
const BOT_TOKEN = '8053426548:AAFSsuAvibdtBpekBtOmKj71qlheu3rnD2g';
const GROUP_ID = '-1002087855584'; // A+ Tutorial Class group ID

let currentStep = 1;
window.jsPDF = window.jspdf.jsPDF;

// Test group ID on page load
async function testGroupAccess() {
    try {
        // First test if bot is working
        const botResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const botData = await botResponse.json();
        
        if (!botData.ok) {
            console.error('Bot Error:', botData.description);
            return;
        }
        
        console.log('Bot connected successfully:', botData.result.first_name);
        
        // Now test group access
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${GROUP_ID}`);
        const data = await response.json();
        
        if (!data.ok) {
            console.error('Group ID Error:', data.description);
            // Try alternative group ID format
            const alternativeGroupId = GROUP_ID.replace('-1002', '-100');
            console.log('Trying alternative group ID:', alternativeGroupId);
            
            const altResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${alternativeGroupId}`);
            const altData = await altResponse.json();
            
            if (altData.ok) {
                console.log('Found group with alternative ID:', altData.result.title);
                window.GROUP_ID = alternativeGroupId; // Store working group ID
            } else {
                console.error('Alternative group ID also failed:', altData.description);
            }
        } else {
            console.log('Group found:', data.result.title);
            window.GROUP_ID = GROUP_ID; // Store working group ID
        }
    } catch (error) {
        console.error('Error checking access:', error);
    }
}

// Call test function when page loads
document.addEventListener('DOMContentLoaded', testGroupAccess);

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

        // Show loading state
        const button = document.querySelector('#step2 button:last-child');
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

        // Verify membership
        verifyTelegramMembership(telegramId)
            .then(isMember => {
                if (isMember) {
                    generateCertificate(name, telegramId);
                    document.getElementById('step2').style.display = 'none';
                    document.getElementById('step3').style.display = 'block';
                    currentStep = 3;
                    usedTelegramIds.add(telegramId);
                } else {
                    alert('Verification failed. Please make sure:\n\n1. You are a member of our Telegram group\n2. You entered the correct Telegram ID\n3. The ID is from the account that joined the group');
                }
            })
            .catch(error => {
                console.error('Verification error:', error);
                alert('Error: ' + (error.message || 'Failed to verify membership. Please try again or contact support.'));
            })
            .finally(() => {
                // Reset button state
                button.disabled = false;
                button.textContent = originalText;
            });
    }
}

async function verifyTelegramMembership(telegramId) {
    try {
        console.log('Attempting to verify membership for ID:', telegramId);
        
        // Use the working group ID if found during test
        const currentGroupId = window.GROUP_ID || GROUP_ID;
        
        // First, verify the group exists
        const groupCheckResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${currentGroupId}`);
        const groupData = await groupCheckResponse.json();
        
        if (!groupData.ok) {
            throw new Error('Unable to access group. Please contact administrator.');
        }
        
        console.log('Checking membership in group:', groupData.result.title);
        
        // Now check membership
        const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`;
        const params = new URLSearchParams({
            chat_id: currentGroupId,
            user_id: telegramId
        });

        const response = await fetch(`${apiUrl}?${params}`);
        const data = await response.json();
        
        console.log('Membership check response:', JSON.stringify(data, null, 2));
        
        if (!data.ok) {
            if (data.description.includes('user not found')) {
                throw new Error('Invalid Telegram ID. Please make sure you entered the correct ID.');
            }
            throw new Error(data.description || 'Failed to verify membership');
        }

        if (data.ok && data.result) {
            const status = data.result.status;
            console.log('Member status:', status);
            
            // Valid member statuses
            const validStatuses = ['member', 'administrator', 'creator'];
            const isValid = validStatuses.includes(status);
            
            if (!isValid) {
                throw new Error('You are not currently a member of the group. Please join the group first.');
            }
            
            console.log('Membership verified successfully');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Verification error:', error);
        throw error;
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
}

// Handle Enter key press
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (currentStep === 1) {
            nextStep(1);
        } else if (currentStep === 2) {
            nextStep(2);
        }
    }
});

async function downloadCertificate(format) {
    const certificate = document.querySelector('.certificate');
    const scale = 2; // Increase quality
    
    try {
        const canvas = await html2canvas(certificate, {
            scale: scale,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: null
        });

        if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                putOnlyUsedFonts: true,
                floatPrecision: 16
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Add image
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            // Add hidden text layer for copy-paste
            const cert = verifiedCertificates.get(document.getElementById('certificateId').textContent);
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Certificate of Completion\n\nThis is to certify that\n${cert.name}\nhas successfully completed the A+ Tutorial Class program\n\nIssued on ${cert.date}\nCertificate ID: ${document.getElementById('certificateId').textContent}`, 10, 10, {
                hidden: true
            });
            
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