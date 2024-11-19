// Store windows state
let windows = {
    'lectures-window': false,
    'research-window': false,
    'personal-window': false
};

// Store password hash instead of plain text
// Using SHA-256 for demonstration - in production, use a proper password hashing algorithm
const PASS_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // Hash of "1234"
const MAX_ATTEMPTS = 1;
const COOLDOWN_TIME = 30000; // 30 seconds
const JUMPSCARE_DURATION = 5000;

// Security state
let attemptCount = 0;
let lastAttemptTime = 0;
let isLocked = false;
let isCooldownActive = false;
let messageInterval;
let currentMessageIndex = 0;

// Preload resources
const screamSound = new Audio("noise/jumpscareSound.mp3");
let isAudioLoaded = false;
let isImageLoaded = false;

function checkPassword() {
    const form = document.getElementById('codeForm');
    if (form) {
        form.dispatchEvent(new Event('submit'));
    } else {
        console.error('Code form not found');
    }
}

// Audio loading promise
const audioLoadPromise = new Promise((resolve) => {
    screamSound.addEventListener('canplaythrough', () => {
        isAudioLoaded = true;
        resolve();
    });
    screamSound.load();
});

// Image loading after audio
const jumpscareImage = new Image();
const imageLoadPromise = audioLoadPromise.then(() => {
    return new Promise((resolve) => {
        jumpscareImage.onload = () => {
            isImageLoaded = true;
            resolve();
        };
        jumpscareImage.src = "pics/jumpscareImage.png";
    });
});

function openFolder(folderName) {
    const windowId = `${folderName}-window`;
    const window = document.getElementById(windowId);
    if (window) {
        window.style.display = 'block';
        windows[windowId] = true;
        bringToFront(window);
    }
}

function closeWindow(windowId) {
    const window = document.getElementById(windowId);
    if (window) {
        window.style.display = 'none';
        windows[windowId] = false;
    }
}

function bringToFront(window) {
    const allWindows = document.querySelectorAll('.window, .popup');
    allWindows.forEach(w => w.style.zIndex = '1');
    window.style.zIndex = '2';
}

// Password and security functions
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isInCooldown() {
    if (isCooldownActive && attemptCount >= MAX_ATTEMPTS) {
        const currentTime = Date.now();
        if (currentTime - lastAttemptTime < COOLDOWN_TIME) {
            return Math.ceil((COOLDOWN_TIME - (currentTime - lastAttemptTime)) / 1000);
        }
        attemptCount = 0;
        isCooldownActive = false;
        return 0;
    }
    return 0;
}

function updateCountdown(seconds) {
    const countdownContainer = document.querySelector('.countdown-container');
    const countdownTimer = document.querySelector('.countdown-timer');
    
    if (seconds > 0) {
        countdownContainer.style.display = 'flex';
        countdownTimer.textContent = seconds;
    } else {
        countdownContainer.style.display = 'none';
    }
}

function startCooldown() {
    lastAttemptTime = Date.now();
    isCooldownActive = true;
    
    function updateCooldownMessage() {
        const remainingTime = isInCooldown();
        const feedback = document.getElementById('feedback');
        if (remainingTime > 0) {
            updateCountdown(remainingTime);
            feedback.textContent = `Too many attempts. Please wait ${remainingTime} seconds.`;
            setTimeout(updateCooldownMessage, 1000);
        } else {
            updateCountdown(0);
            feedback.textContent = "";
            isLocked = false;
            document.getElementById('codeForm').classList.remove('disabled');
        }
    }
    
    updateCooldownMessage();
}

function requestAccess() {
    const popup = document.getElementById('access-popup');
    popup.style.display = 'block';
    // Clear any previous error messages and input
    document.querySelector('.error-message').style.display = 'none';
    document.querySelector('.password-input').value = '';
    bringToFront(popup);
}

function closePopup() {
    const popup = document.getElementById('access-popup');
    popup.style.display = 'none';
    document.querySelector('.password-input').value = '';
    document.querySelector('.error-message').style.display = 'none';
}

function showPhotos() {
    let photosWindow = document.getElementById('photos-window');
    
    if (!photosWindow) {
        photosWindow = document.createElement('div');
        photosWindow.id = 'photos-window';
        photosWindow.className = 'window';
        photosWindow.innerHTML = `
            <div class="window-header">
                <div class="window-title">Photos</div>
                <div class="window-controls">
                    <div class="window-button minimize"></div>
                    <div class="window-button maximize"></div>
                    <div class="window-button close" onclick="closeWindow('photos-window')"></div>
                </div>
            </div>
            <div class="window-content">
                <div class="folder-content photos-grid">
                    <div class="photo-item" onclick="showImage('pics/They know.jpg', 'Photo 1')">
                        <div class="photo-icon">🖼️</div>
                        <div class="photo-name">Photo 1</div>
                    </div>
                    <div class="photo-item" onclick="showImage('pics/maze.png', 'maze')">
                        <div class="photo-icon">🖼️</div>
                        <div class="photo-name">maze</div>
                    </div>
                    <div class="photo-item" onclick="showImage('pics/Raphael_-_The_Small_Cowper_Madon.png', 'Photo 3')">
                        <div class="photo-icon">🖼️</div>
                        <div class="photo-name">Photo 3</div>
                    </div>
                </div>
            </div>
        `;
        document.querySelector('.desktop').appendChild(photosWindow);
        makeWindowDraggable(photosWindow);
        addClickToFront(photosWindow);
    }
    
    photosWindow.style.display = 'block';
    bringToFront(photosWindow);
}

function showImage(imageSrc, imageTitle) {
    let viewerWindow = document.getElementById('image-viewer');
    
    if (!viewerWindow) {
        viewerWindow = document.createElement('div');
        viewerWindow.id = 'image-viewer';
        viewerWindow.className = 'window image-viewer';
        viewerWindow.innerHTML = `
            <div class="window-header">
                <div class="window-title">Image Viewer - ${imageTitle}</div>
                <div class="window-controls">
                    <div class="window-button close" onclick="closeWindow('image-viewer')"></div>
                </div>
            </div>
            <div class="window-content">
                <img src="${imageSrc}" alt="${imageTitle}">
            </div>
        `;
        document.querySelector('.desktop').appendChild(viewerWindow);
        makeWindowDraggable(viewerWindow);
        addClickToFront(viewerWindow);
    } else {
        // Update existing viewer with new image
        viewerWindow.querySelector('.window-title').textContent = `Image Viewer - ${imageTitle}`;
        viewerWindow.querySelector('img').src = imageSrc;
        viewerWindow.querySelector('img').alt = imageTitle;
    }
    
    viewerWindow.style.display = 'block';
    bringToFront(viewerWindow);
}

// Creepy effects
const creepyMessages = [
    "Analyzing your code...",
    "Processing attempt...",
    "Verifying identity...",
    "You shouldn't be here...",
    "Warning: Unknown presence detected...",
    "System compromise detected...",
    "Emergency protocols initiated...",
    "Connection terminated..."
];

function updateLoadingMessage() {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText && loadingText.offsetParent !== null) {
        loadingText.textContent = creepyMessages[currentMessageIndex];
        currentMessageIndex = (currentMessageIndex + 1) % creepyMessages.length;
    }
}

function startCreepyMessages() {
    currentMessageIndex = 0;
    updateLoadingMessage();
    messageInterval = setInterval(updateLoadingMessage, 1000);
}

function stopCreepyMessages() {
    clearInterval(messageInterval);
    currentMessageIndex = 0;
}

function triggerCreepy() {
    const message = document.createElement('div');
    message.className = 'hidden-message';
    message.textContent = ['DON\'T LOOK', 'GET OUT', 'HELP ME', 'THEY\'RE WATCHING'][Math.floor(Math.random() * 4)];
    message.style.left = Math.random() * 80 + 10 + 'vw';
    message.style.top = Math.random() * 80 + 10 + 'vh';
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '1';
        document.body.classList.add('glitch');
        setTimeout(() => {
            message.style.opacity = '0';
            document.body.classList.remove('glitch');
            setTimeout(() => message.remove(), 300);
        }, 1000);
    }, 100);
}

function triggerJumpscareSequence() {
    const jumpscare = document.getElementById('jumpscare');
    const form = document.getElementById('codeForm');
    
    if (!isAudioLoaded || !isImageLoaded) {
        console.error("Resources not fully loaded");
        return;
    }
    
    screamSound.currentTime = 0;
    screamSound.play().then(() => {
        setTimeout(() => {
            jumpscare.src = jumpscareImage.src;
            jumpscare.style.display = 'flex';
            document.body.classList.add('shake');
        }, 500);
    }).catch(error => {
        console.error("Audio playback failed:", error);
    });
    
    setTimeout(() => {
        jumpscare.style.display = 'none';
        document.body.classList.remove('shake');
        
        if (attemptCount < MAX_ATTEMPTS) {
            isLocked = false;
            form.classList.remove('disabled');
            document.getElementById('feedback').textContent = '';
        }
        
        document.getElementById('password').value = '';
        stopCreepyMessages();
    }, JUMPSCARE_DURATION);
}

// Clock
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    document.querySelector('.clock').textContent = `${hours}:${minutes} ${ampm}`;
}

// Make element draggable
function makeWindowDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.window-header, .popup-header');
    
    if (header) {
        header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e.preventDefault();
        // Bring window to front when starting to drag
        bringToFront(element);
        
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Calculate new position
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        
        // Keep window within viewport bounds
        newTop = Math.max(0, Math.min(window.innerHeight - 100, newTop));
        newLeft = Math.max(0, Math.min(window.innerWidth - 100, newLeft));
        
        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Add click to front behavior
function addClickToFront(element) {
    element.addEventListener('mousedown', () => {
        bringToFront(element);
    });
}

// Initialize clock
setInterval(updateClock, 1000);
updateClock();

// Password handling - single event listener
document.querySelector('.password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkPassword();
    }
});

// Initialize draggable windows and click-to-front behavior
document.addEventListener('DOMContentLoaded', () => {
    // Make all windows and popups draggable
    document.querySelectorAll('.window, .popup').forEach(element => {
        makeWindowDraggable(element);
        addClickToFront(element);
    });

    const passwordInput = document.querySelector('.password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
});

// Random creepy events
setInterval(() => {
    if (Math.random() < 0.05) {
        triggerCreepy();
    }
}, 30000);

// Password form handling
document.getElementById('codeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (isLocked) return;
    
    const cooldownTime = isInCooldown();
    if (cooldownTime > 0) {
        document.getElementById('feedback').textContent = 
            `Too many attempts. Please wait ${cooldownTime} seconds.`;
        return;
    }
    
    const enteredPassword = document.getElementById('password').value;
    const feedback = document.getElementById('feedback');
    const form = document.getElementById('codeForm');
    
    const hashedInput = await hashPassword(enteredPassword);
    
    if (hashedInput !== PASS_HASH) {
        attemptCount++;
        isLocked = true;
        form.classList.add('disabled');
        
        feedback.textContent = attemptCount >= MAX_ATTEMPTS 
            ? `Wrong password. Please wait...`
            : `Wrong password. ${MAX_ATTEMPTS - attemptCount} attempts remaining.`;
        
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'flex';
        startCreepyMessages();
        
        Promise.all([audioLoadPromise, imageLoadPromise])
            .then(() => {
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    document.body.classList.add('glitch');
                    setTimeout(() => {
                        document.body.classList.remove('glitch');
                        triggerJumpscareSequence();
                        if (attemptCount >= MAX_ATTEMPTS) {
                            setTimeout(startCooldown, JUMPSCARE_DURATION);
                        }
                    }, 1500);
                }, 5000);
            })
            .catch(error => console.error("Resource loading failed:", error));
    } else {
        showPhotos();
        closePopup();
    }
}
);