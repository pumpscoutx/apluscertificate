let verifiedCertificates = new Map();
let usedTelegramIds = new Set();

// Telegram Bot Token
const BOT_TOKEN = '8053426548:AAFSsuAvibdtBpekBtOmKj71qlheu3rnD2g';
const GROUP_ID = '-1002570633428'; // Private group ID with -100 prefix

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
        
        // Now test group access with original ID
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${GROUP_ID}`);
        const data = await response.json();
        
        if (!data.ok) {
            console.error('Group ID Error:', data.description);
            // Try with -100 prefix
            const alternativeGroupId = `-100${GROUP_ID.replace('-', '')}`;
            console.log('Trying alternative group ID:', alternativeGroupId);
            
            const altResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${alternativeGroupId}`);
            const altData = await altResponse.json();
            
            if (altData.ok) {
                console.log('Found group with alternative ID:', altData.result.title);
                window.GROUP_ID = alternativeGroupId; // Store working group ID
            } else {
                // Try without any prefix
                const basicId = GROUP_ID.replace('-', '');
                console.log('Trying basic ID:', basicId);
                
                const basicResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=-${basicId}`);
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id.match(/.{1,4}/g).join('-');
}

function createFirework(x, y) {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.left = x + 'px';
    firework.style.top = y + 'px';
    document.body.appendChild(firework);
    setTimeout(() => firework.remove(), 1000);
}

function showFireworks() {
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            createFirework(x, y);
        }, i * 50);
    }
}

async function verifyTelegramMembership(telegramId) {
    try {
        console.log('Starting verification for ID:', telegramId);
        
        // Check if the ID is valid
        if (!telegramId || isNaN(telegramId)) {
            throw new Error('Please enter a valid Telegram ID (numbers only)');
        }

        // Check if ID has already been used
        if (usedTelegramIds.has(telegramId)) {
            throw new Error('This Telegram ID has already generated a certificate.');
        }

        // Check member status
        const memberUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`;
        const memberParams = new URLSearchParams({
            chat_id: GROUP_ID,
            user_id: telegramId
        });

        console.log('Checking member status...');
        console.log('Using group ID:', GROUP_ID);
        console.log('User ID:', telegramId);
        
        const response = await fetch(`${memberUrl}?${memberParams}`);
        const data = await response.json();
        
        console.log('Member check response:', data);
        
        if (!data.ok) {
            if (data.description.includes('user not found')) {
                throw new Error('Invalid Telegram ID. Please make sure you entered the correct ID from @userinfobot.');
            }
            if (data.description.includes('chat not found')) {
                throw new Error('Unable to verify group membership. Please contact administrator.');
            }
            throw new Error(data.description || 'Failed to verify membership');
        }

        if (!data.result || !data.result.status) {
            throw new Error('Unable to verify membership status.');
        }

        const status = data.result.status;
        console.log('Member status:', status);
        
        // Only allow active members
        if (status !== 'member' && status !== 'administrator' && status !== 'creator') {
            throw new Error('You must be an active member of the A+ Tutorial Class group to generate a certificate.');
        }

        // Add to used IDs
        usedTelegramIds.add(telegramId);
        console.log('Membership verified successfully');
        return true;
    } catch (error) {
        console.error('Verification error:', error);
        throw error;
    }
}

function nextStep(currentStep) {
    const currentElement = document.getElementById(`step${currentStep}`);
    const nextElement = document.getElementById(`step${currentStep + 1}`);
    const certificateContainer = document.getElementById('certificateContainer');
    
    if (currentStep === 1) {
        const name = document.getElementById('name').value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }
        currentElement.style.display = 'none';
        nextElement.style.display = 'block';
    } else if (currentStep === 2) {
        const telegramId = document.getElementById('telegramId').value.trim();
        if (!telegramId) {
            alert('Please enter your Telegram ID');
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
                    currentElement.style.display = 'none';
                    certificateContainer.style.display = 'block';
                    generateCertificate();
                    showFireworks();
                }
            })
            .catch(error => {
                alert(error.message || 'Failed to verify membership. Please try again.');
                button.disabled = false;
                button.innerHTML = originalText;
            });
    }
}

function previousStep(currentStep) {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const previousStepElement = document.getElementById(`step${currentStep - 1}`);
    
    currentStepElement.style.display = 'none';
    previousStepElement.style.display = 'block';
}

function generateCertificate() {
    const name = document.getElementById('name').value;
    const telegramId = document.getElementById('telegramId').value;
    const certificateId = generateCertificateId();
    const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('certificateName').textContent = name;
    document.getElementById('certificateId').textContent = certificateId;
    document.getElementById('issueDate').textContent = issueDate;

    // Store certificate information
    verifiedCertificates.set(certificateId, {
        name,
        telegramId,
        issueDate
    });
}

// Handle Enter key press
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const currentStep = document.querySelector('.step[style="display: block;"]').id.replace('step', '');
        nextStep(parseInt(currentStep));
    }
});

async function downloadCertificate(format) {
    const certificate = document.querySelector('.certificate');
    const scale = 2;
    
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
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('A+_Tutorial_Certificate.pdf');
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
    const certId = document.getElementById('verifyCertificateId').value.trim();
    const resultDiv = document.getElementById('verificationResult');
    
    if (!certId) {
        resultDiv.className = 'error';
        resultDiv.innerHTML = `
            <h3><i class="fas fa-times-circle"></i> Error</h3>
            <p>Please enter a certificate ID.</p>
        `;
        return;
    }

    const cert = verifiedCertificates.get(certId);
    if (cert) {
        resultDiv.className = 'success';
        resultDiv.innerHTML = `
            <h3><i class="fas fa-check-circle"></i> Certificate Verified</h3>
            <p><strong>Issued to:</strong> ${cert.name}</p>
            <p><strong>Issue Date:</strong> ${cert.issueDate}</p>
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