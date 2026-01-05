document.addEventListener('DOMContentLoaded', () => {
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    const timeText = document.getElementById('time-text');
    const dateText = document.getElementById('date-text');
    const marksContainer = document.querySelector('.hour-marks');

    // Create clock marks
    for (let i = 0; i < 60; i++) {
        const mark = document.createElement('div');
        mark.classList.add('mark');
        if (i % 5 === 0) {
            mark.classList.add('major');
        }
        mark.style.transform = `translateX(-50%) rotate(${i * 6}deg)`;
        marksContainer.appendChild(mark);
    }

    function updateClock() {
        // Get current time
        const now = new Date();

        // Convert to Tokyo Time (UTC+9)
        // We get UTC time in ms, add 9 hours in ms
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const tokyoOffset = 9 * 60 * 60 * 1000;
        const tokyoTime = new Date(utc + tokyoOffset);

        const seconds = tokyoTime.getSeconds();
        const minutes = tokyoTime.getMinutes();
        const hours = tokyoTime.getHours();
        const milliseconds = tokyoTime.getMilliseconds();

        // Calculate angles
        // Smooth movement for second hand (including ms)
        const secondDegrees = ((seconds + milliseconds / 1000) / 60) * 360;
        const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
        const hourDegrees = ((hours % 12 + minutes / 60) / 12) * 360;

        // Apply rotation
        /* 
           Note: The standard 0deg in CSS with our setup is pointing 12 o'clock if we handled it correctly.
           Our CSS has .hand bottom: 50%, transfom-origin: bottom center. 
           This means the element sticks up from center. 0deg is 12 o'clock.
        */
        secondHand.style.transform = `translateX(-50%) rotate(${secondDegrees}deg)`;
        minuteHand.style.transform = `translateX(-50%) rotate(${minuteDegrees}deg)`;
        hourHand.style.transform = `translateX(-50%) rotate(${hourDegrees}deg)`;

        // Update Digital Text
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');
        timeText.textContent = `${h}:${m}:${s}`;

        // Date
        const year = tokyoTime.getFullYear();
        const month = String(tokyoTime.getMonth() + 1).padStart(2, '0');
        const day = String(tokyoTime.getDate()).padStart(2, '0');
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const dayName = days[tokyoTime.getDay()];

        dateText.textContent = `${year}.${month}.${day} ${dayName}`;

        requestAnimationFrame(updateClock);
    }

    // Start loop
    requestAnimationFrame(updateClock);

    // Fullscreen toggle logic
    document.body.addEventListener('click', () => {
        const hint = document.querySelector('.fullscreen-hint');
        if (hint) hint.style.opacity = '0';

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => {
                console.log(`Error attempting to enable fullscreen: ${e.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });
});
