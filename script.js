// Store verified certificates
let verifiedCertificates = new Map();
let usedTelegramIds = new Set();
const knownMembers = ['8012293640'];

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = '6887558491:AAEcgDhEEXTZxZPTJEGDxTBZxhXhgPQwTxE';
const GROUP_ID = '-2570633428';

let currentStep = 1;
window.jsPDF = window.jspdf.jsPDF;

// Test group ID on page load
async function testGroupAccess() {
    try {
        // First test if bot is working
        const botResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        const botData = await botResponse.json();
        
        if (!botData.ok) {
            console.error('Bot Error:', botData.description);
            return;
        }
        
        console.log('Bot connected successfully:', botData.result.first_name);
        
        // Now test group access with original ID
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${GROUP_ID}`);
        const data = await response.json();
        
        if (!data.ok) {
            console.error('Group ID Error:', data.description);
            // Try with -100 prefix
            const alternativeGroupId = `-100${GROUP_ID.replace('-', '')}`;
            console.log('Trying alternative group ID:', alternativeGroupId);
            
            const altResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${alternativeGroupId}`);
            const altData = await altResponse.json();
            
            if (altData.ok) {
                console.log('Found group with alternative ID:', altData.result.title);
                window.GROUP_ID = alternativeGroupId; // Store working group ID
            } else {
                // Try without any prefix
                const basicId = GROUP_ID.replace('-', '');
                console.log('Trying basic ID:', basicId);
                
                const basicResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=-${basicId}`);
                const basicData = await basicResponse.json();
                
                if (basicData.ok) {
                    console.log('Found group with basic ID:', basicData.result.title);
                    window.GROUP_ID = `-${basicId}`; // Store working group ID
                } else {
                    console.error('All group ID formats failed');
                }
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

async function verifyTelegramMembership(userId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${GROUP_ID}&user_id=${userId}`);
        const data = await response.json();
        
        if (data.ok && data.result && ['creator', 'administrator', 'member'].includes(data.result.status)) {
            return true;
        } else {
            throw new Error('User is not a member of the group');
        }
    } catch (error) {
        throw new Error('Failed to verify membership. Please make sure you are a member of our Telegram group.');
    }
}

function nextStep() {
    const currentStep = document.querySelector('.step:not([style*="display: none"])');
    const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
    
    if (currentStepNumber === 1) {
        const nameInput = document.getElementById('nameInput');
        if (!nameInput.value.trim()) {
            alert('Please enter your name');
            return;
        }
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
    } else if (currentStepNumber === 2) {
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
                    // Update certificate with user's name
                    document.querySelector('.recipient-name').textContent = name;
                    
                    // Generate and store certificate data
                    const certificateId = generateCertificateId();
                    localStorage.setItem(certificateId, JSON.stringify({
                        name: name,
                        telegramId: telegramId,
                        date: new Date().toISOString()
                    }));
                    
                    document.getElementById('step2').style.display = 'none';
                    document.getElementById('step3').style.display = 'block';
                    usedTelegramIds.add(telegramId);
                }
            })
            .catch(error => {
                alert(error.message || 'Failed to verify membership. Please try again.');
            })
            .finally(() => {
                // Reset button state
                button.disabled = false;
                button.textContent = originalText;
            });
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

async function downloadAsPDF() {
    const certificate = document.querySelector('.certificate');
    
    // Create canvas
    const canvas = await html2canvas(certificate, {
        scale: 2,
        useCORS: true,
        logging: false
    });
    
    // Create PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    
    // Download PDF
    pdf.save('certificate.pdf');
}

async function downloadAsImage() {
    const certificate = document.querySelector('.certificate');
    
    // Create canvas
    const canvas = await html2canvas(certificate, {
        scale: 2,
        useCORS: true,
        logging: false
    });
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Certificate verification functionality
function showVerificationModal() {
    document.getElementById('verificationModal').style.display = 'block';
}

function closeVerificationModal() {
    document.getElementById('verificationModal').style.display = 'none';
}

function verifyCertificate() {
    const certificateId = document.getElementById('verifyInput').value.trim();
    const result = document.getElementById('verificationResult');
    
    const certificateData = localStorage.getItem(certificateId);
    
    if (certificateData) {
        const data = JSON.parse(certificateData);
        const date = new Date(data.date);
        
        result.innerHTML = `
            <div class="success">
                <i class="fas fa-check-circle"></i>
                <h3>Valid Certificate</h3>
                <p>This certificate was issued to ${data.name} on ${date.toLocaleDateString()}</p>
                <p>Certificate ID: ${certificateId}</p>
            </div>
        `;
    } else {
        result.innerHTML = `
            <div class="error">
                <i class="fas fa-times-circle"></i>
                <h3>Invalid Certificate</h3>
                <p>No certificate found with ID: ${certificateId}</p>
                <p>Please check the certificate ID and try again.</p>
            </div>
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