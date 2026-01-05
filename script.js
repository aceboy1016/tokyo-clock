document.addEventListener('DOMContentLoaded', () => {
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    const timeText = document.getElementById('time-text');
    const dateText = document.getElementById('date-text');
    const marksContainer = document.querySelector('.hour-marks');

    // Time Synchronization
    let timeOffset = 0;

    async function syncTime() {
        try {
            // Fetch precise time from WorldTimeAPI
            const start = Date.now();
            const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Tokyo');
            if (!response.ok) throw new Error('Time sync failed');
            const data = await response.json();

            // Network latency compensation (RTT / 2)
            const end = Date.now();
            const latency = (end - start) / 2;

            // Target time (UNIX ms)
            // data.datetime is ISO string, parsing it ensures correct absolute time
            const serverTime = new Date(data.datetime).getTime();

            // Calculate offset: Server Time - Local System Time
            // We assume 'Date.now()' roughly corresponds to when serverTime was validity + latency
            // Correct format: ServerTime + Latency ~~ Current True Time
            // Offset = (ServerTime + Latency) - LocalTime
            timeOffset = (serverTime + latency) - Date.now();

            console.log(`Time synced. Offset: ${timeOffset}ms (Latency: ${latency}ms)`);
        } catch (error) {
            console.log('Using local system time (Sync failed or skipped):', error);
            // Retry later if failed? 
        }
    }

    // Initial sync and periodic re-sync
    syncTime();
    setInterval(syncTime, 60000 * 10); // Sync every 10 minutes

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
        // Current corrected time (UTC timestamp of "Now")
        const nowMs = Date.now() + timeOffset;

        // Tokyo logic: UTC + 9 hours
        // We create a Date object that effectively holds "Tokyo Wall Time" in its UTC slots
        const tokyoOffsetMs = 9 * 60 * 60 * 1000;
        const tokyoTime = new Date(nowMs + tokyoOffsetMs);

        // We use getUTC methods because tokyoTime was shifted by 9 hours manually
        const milliseconds = tokyoTime.getUTCMilliseconds();
        const seconds = tokyoTime.getUTCSeconds();
        const minutes = tokyoTime.getUTCMinutes();
        const hours = tokyoTime.getUTCHours();

        // Calculate angles
        // Smooth movement (including ms)
        const secondDegrees = ((seconds + milliseconds / 1000) / 60) * 360;
        const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
        const hourDegrees = ((hours % 12 + minutes / 60) / 12) * 360;

        // Apply rotation
        secondHand.style.transform = `translateX(-50%) rotate(${secondDegrees}deg)`;
        minuteHand.style.transform = `translateX(-50%) rotate(${minuteDegrees}deg)`;
        hourHand.style.transform = `translateX(-50%) rotate(${hourDegrees}deg)`;

        // Update Digital Text
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');
        timeText.textContent = `${h}:${m}:${s}`;

        // Date
        const year = tokyoTime.getUTCFullYear();
        const month = String(tokyoTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(tokyoTime.getUTCDate()).padStart(2, '0');
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const dayName = days[tokyoTime.getUTCDay()];

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
