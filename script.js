function openFolder(name) {
    document.getElementById(name + '-window').style.display = 'block';
}

function closeWindow(id) {
    document.getElementById(id).style.display = 'none';
}

function requestAccess() {
    document.getElementById('access-popup').style.display = 'block';
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

setInterval(updateClock, 1000);
updateClock();

// Password handling
document.querySelector('.password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (e.target.value === '1234') {
            triggerCreepy();
            document.getElementById('access-popup').style.display = 'none';
        } else {
            document.querySelector('.error-message').style.display = 'block';
        }
    }
});

// Make windows draggable
document.querySelectorAll('.window').forEach(makeWindowDraggable);

function makeWindowDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.querySelector('.window-header').onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
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
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Random creepy events
setInterval(() => {
    if (Math.random() < 0.05) {
        triggerCreepy();
    }
}, 30000);

function closePopup() {
    document.getElementById('access-popup').style.display = 'none';
    document.querySelector('.password-input').value = '';
    document.querySelector('.error-message').style.display = 'none';
}

function checkPassword() {
    const input = document.querySelector('.password-input');
    if (input.value === '1234') {
        triggerCreepy();
        closePopup();
    } else {
        document.querySelector('.error-message').style.display = 'block';
    }
}

// Update password handling
document.querySelector('.password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkPassword();
    }
});
