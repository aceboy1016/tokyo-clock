document.addEventListener('DOMContentLoaded', () => {
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    const timeText = document.getElementById('time-text');
    const dateText = document.getElementById('date-text');
    const marksContainer = document.querySelector('.hour-marks');

    // Time Synchronization
    let timeOffset = 0;

    async function getNetworkTime() {
        try {
            // Priority 1: WorldTimeAPI (High Precision)
            // Short timeout to fallback quickly if blocked
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const start = Date.now();
            const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Tokyo', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const end = Date.now();
            const latency = (end - start) / 2;

            // data.datetime is ISO string with MS precision
            return new Date(data.datetime).getTime() + latency;
        } catch (e) {
            console.log('High precision sync failed, trying fallback...', e);
        }

        try {
            // Priority 2: Server Date Header (Reliable Fallback)
            // Works even on restricted networks (uses same domain)
            const start = Date.now();
            const response = await fetch(window.location.href, {
                method: 'HEAD',
                cache: 'no-store'
            });
            const dateHeader = response.headers.get('date');
            if (!dateHeader) throw new Error('No Date header');

            const end = Date.now();
            const latency = (end - start) / 2;

            // Date header is usually accurate to 1 second (e.g. "Mon, 01 Jan 2000 00:00:00 GMT")
            return new Date(dateHeader).getTime() + latency;
        } catch (e) {
            console.error('All time sync methods failed', e);
            return null;
        }
    }

    async function syncTime() {
        const netTime = await getNetworkTime();
        if (netTime) {
            const oldOffset = timeOffset;
            timeOffset = netTime - Date.now();
            console.log(`Time synced. New Offset: ${timeOffset}ms (Diff: ${timeOffset - oldOffset}ms)`);
        }
    }

    // Aggressive initial sync to correct drift immediately
    syncTime();
    setTimeout(syncTime, 2000);
    setTimeout(syncTime, 5000);
    setInterval(syncTime, 60000); // Maintain sync every minute

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
