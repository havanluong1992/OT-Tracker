document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const datePicker = document.getElementById('date-picker');
    const outDateInput = document.getElementById('out-date');
    const outTimeInput = document.getElementById('out-time');
    const calculatedOtDisplay = document.getElementById('calculated-ot');
    const otSeg1Display = document.getElementById('ot-seg-1');
    const otSeg2Display = document.getElementById('ot-seg-2');
    const otSeg3Display = document.getElementById('ot-seg-3');
    const mealTicketDisplay = document.getElementById('meal-ticket-display');
    const saveBtn = document.getElementById('save-btn');
    const standardTimeDisplay = document.getElementById('standard-time-display');
    const logsList = document.getElementById('logs-list');
    const totalOtDisplay = document.getElementById('total-ot');
    const totalMealsDisplay = document.getElementById('total-meals');
    const totalOtS1Display = document.getElementById('total-ot-s1');
    const totalOtS2Display = document.getElementById('total-ot-s2');
    const totalOtS3Display = document.getElementById('total-ot-s3');
    const totalOtSundayDisplay = document.getElementById('total-ot-sunday');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const realtimeCheckbox = document.getElementById('realtime-checkout');
    const gpsStatusDiv = document.getElementById('gps-status');
    const gpsAddressSpan = document.getElementById('gps-address');

    // Settings Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const settingStandardTimeInput = document.getElementById('setting-standard-time');
    const toast = document.getElementById('toast');

    // Login Elements
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.getElementById('close-login');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginIdInput = document.getElementById('login-id');
    const loginPassInput = document.getElementById('login-pass');

    // State
    let selectedDate = new Date();
    let currentViewMonth = new Date();
    let logs = JSON.parse(localStorage.getItem('ot_logs')) || {};
    let settings = JSON.parse(localStorage.getItem('ot_settings')) || {
        standardTime: '17:30'
    };
    let realtimeInterval = null;
    let cachedLocation = null;
    let isAdmin = false;

    // Initialization
    init();

    function init() {
        // Set date picker to today initially
        datePicker.valueAsDate = selectedDate;
        outDateInput.valueAsDate = selectedDate; // Default out date to same day

        updateMonthDisplay();
        renderSettings();
        renderLogs(); // Renders list for currentViewMonth
        loadLogForSelectedDate(); // Loads data into inputs if exists

        setupEventListeners();
    }

    function setupEventListeners() {
        // Date Picker Change
        datePicker.addEventListener('change', (e) => {
            if (e.target.value) {
                selectedDate = new Date(e.target.value);
                // When picking a new log date, reset out date to match it by default
                outDateInput.value = e.target.value;

                // If switching dates, we should probably disable realtime mode if it was on, 
                // as realtime mode implies "NOW".
                if (realtimeCheckbox.checked) {
                    realtimeCheckbox.checked = false;
                    stopRealtimeMode();
                }

                loadLogForSelectedDate();
            }
        });

        // Out Date Change
        outDateInput.addEventListener('change', calculateOT);

        // Time Input changes
        outTimeInput.addEventListener('change', calculateOT);
        outTimeInput.addEventListener('input', calculateOT);

        // Realtime Checkbox
        realtimeCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                startRealtimeMode();
            } else {
                stopRealtimeMode();
            }
        });

        // Save Log
        saveBtn.addEventListener('click', saveLog);

        // Navigation (Month)
        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));

        // Settings
        settingsBtn.addEventListener('click', () => openModal(settingsModal));
        closeSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
        saveSettingsBtn.addEventListener('click', saveSettings);

        // Export CSV
        document.getElementById('export-btn').addEventListener('click', exportCSV);

        // Close modal
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeModal(settingsModal);
        });

        // Login Listeners
        if (loginBtn) loginBtn.addEventListener('click', () => {
            // If already logged in, maybe ask to logout?
            if (isAdmin) {
                if (confirm('Bạn có muốn đăng xuất?')) {
                    isAdmin = false;
                    document.body.classList.remove('admin-logged-in');
                    loginBtn.innerHTML = '<i class="fa-solid fa-user-lock"></i>';
                    showToast('Đã đăng xuất');
                    renderLogs();
                }
            } else {
                openModal(loginModal);
            }
        });
        if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => closeModal(loginModal));
        if (loginSubmitBtn) loginSubmitBtn.addEventListener('click', handleLogin);
        if (loginModal) loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeModal(loginModal);
        });
    }

    function handleLogin() {
        const id = loginIdInput.value;
        const pass = loginPassInput.value;

        if (id === 'Admin' && pass === '123') {
            isAdmin = true;
            document.body.classList.add('admin-logged-in');
            loginBtn.innerHTML = '<i class="fa-solid fa-user-check"></i>'; // Change icon
            closeModal(loginModal);
            showToast('Đăng nhập quản trị thành công!');

            // Clear inputs
            loginIdInput.value = '';
            loginPassInput.value = '';

            renderLogs();
        } else {
            showToast('Sai ID hoặc Mật khẩu!', 'error');
        }
    }

    function deleteLog(dateKey) {
        if (!isAdmin) return;
        if (confirm('Bạn có chắc muốn xóa dữ liệu ngày này? Hành động không thể hoàn tác.')) {
            // Remove from logs
            delete logs[dateKey];
            localStorage.setItem('ot_logs', JSON.stringify(logs));

            // Update UI
            showToast('Đã xóa dữ liệu thành công');

            // If the deleted log was the currently rendered one (selectedDate), maybe reset/reload inputs?
            if (formatDateKey(selectedDate) === dateKey) {
                // Reload current inputs (will show empty/default)
                loadLogForSelectedDate();
            }

            renderLogs();
        }
    }

    function startRealtimeMode() {
        // Disable inputs
        outDateInput.disabled = true;
        outTimeInput.disabled = true;

        // Show GPS status
        gpsStatusDiv.classList.remove('hidden');
        gpsAddressSpan.textContent = "Đang lấy vị trí...";

        // Update time immediately and start interval
        updateRealtimeInputs();
        realtimeInterval = setInterval(updateRealtimeInputs, 1000);

        // Fetch Location
        fetchGPS();
    }

    function stopRealtimeMode() {
        // Enable inputs
        outDateInput.disabled = false;
        outTimeInput.disabled = false;

        // Stop interval
        if (realtimeInterval) {
            clearInterval(realtimeInterval);
            realtimeInterval = null;
        }

        // Hide GPS status if desired, or keep it visible but maybe indicate it's stale? 
        // For simplicity, hide it as "Realtime" is off.
        gpsStatusDiv.classList.add('hidden');
        cachedLocation = null;
    }

    function updateRealtimeInputs() {
        const now = new Date();

        // Update date input if date changes (e.g. midnight)
        // Note: outDateInput requires YYYY-MM-DD
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - (offset * 60 * 1000));
        outDateInput.value = localDate.toISOString().split('T')[0];

        // Update time input HH:mm
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        outTimeInput.value = `${hours}:${minutes}`;

        // Also update the selectedDate logic? 
        // If user is in realtime mode, they likely mean "Today". 
        // If selectedDate is NOT today, should we warn? 
        // Or should we just update out-date/time and let separate calculation handle it?
        // Since `outDateInput` is updated, calculation will use `outDateInput` vs `selectedDate`.
        // This is correct behavior (Checkout Date vs Shift Date).

        calculateOT();
    }

    async function fetchGPS() {
        try {
            const position = await getLocation();
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Show temp success
            gpsAddressSpan.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            // Fetch address
            const address = await fetchAddress(lat, lng);

            cachedLocation = {
                lat: lat,
                lng: lng,
                address: address
            };

            const displayAddr = address ?
                (address.length > 40 ? address.substring(0, 40) + '...' : address) :
                `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            gpsAddressSpan.textContent = displayAddr;

        } catch (error) {
            console.error("GPS Error:", error);
            gpsAddressSpan.textContent = "Không thể lấy vị trí";
            cachedLocation = null;
        }
    }

    function loadLogForSelectedDate() {
        const dateKey = formatDateKey(selectedDate);
        const log = logs[dateKey];

        // Reset Realtime
        if (realtimeCheckbox.checked) {
            realtimeCheckbox.checked = false;
            stopRealtimeMode();
        }

        if (log) {
            outTimeInput.value = log.outTime;
            // Handle legacy logs that didn't store outDate
            if (log.outDate) {
                outDateInput.value = log.outDate;
            } else {
                // If checking out past midnight, assume next day? Safer to just default current
                outDateInput.valueAsDate = selectedDate;
            }
            calculateOT(); // Update display
            saveBtn.textContent = "Cập nhật";
        } else {
            outTimeInput.value = '';
            outDateInput.valueAsDate = selectedDate; // Reset to match start date

            calculatedOtDisplay.textContent = '--';
            calculatedOtDisplay.classList.remove('highlight-text');
            otSeg1Display.textContent = '0h';
            otSeg2Display.textContent = '0h';
            otSeg3Display.textContent = '0h';
            mealTicketDisplay.textContent = '0'; // Reset meals

            saveBtn.textContent = "Lưu chấm công";
        }
    }

    function updateMonthDisplay() {
        const monthOptions = { month: 'long', year: 'numeric' };
        currentMonthDisplay.textContent = currentViewMonth.toLocaleDateString('vi-VN', monthOptions);
    }

    function changeMonth(delta) {
        currentViewMonth.setMonth(currentViewMonth.getMonth() + delta);
        updateMonthDisplay();
        renderLogs();
    }

    function calculateOT() {
        const outTime = outTimeInput.value;
        const outDateVal = outDateInput.value;
        if (!outTime || !outDateVal) {
            calculatedOtDisplay.textContent = '--';
            mealTicketDisplay.textContent = '0';
            return { total: 0, s1: 0, s2: 0, s3: 0, meals: 0 };
        }

        // Standard Start Time
        const [stdHours, stdMinutes] = settings.standardTime.split(':').map(Number);
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(stdHours, stdMinutes, 0, 0);

        // Actual Out Time
        const endDateTime = new Date(outDateVal);
        const [outHours, outMinutes] = outTime.split(':').map(Number);
        endDateTime.setHours(outHours, outMinutes, 0, 0);

        // Calculate Meal Tickets (Applies to all days)
        // Rules:
        // >= 20:00 -> 1 ticket
        // > 22:00 -> +1 ticket (total 2)
        // > 24:00 (Next day 00:00) -> +1 ticket (total 3)
        const cp20 = new Date(selectedDate); cp20.setHours(20, 0, 0, 0);
        const cp22 = new Date(selectedDate); cp22.setHours(22, 0, 0, 0);
        const cp24 = new Date(selectedDate); cp24.setDate(cp24.getDate() + 1); cp24.setHours(0, 0, 0, 0);

        let meals = 0;
        if (endDateTime >= cp20) meals++;
        if (endDateTime > cp22) meals++;
        if (endDateTime > cp24) meals++;
        mealTicketDisplay.textContent = meals;

        // --- Sunday Logic ---
        if (selectedDate.getDay() === 0) { // 0 is Sunday
            // Formula: (Out - Std) + 8 hours
            // difference in Minutes
            let diffMinutes = (endDateTime - startDateTime) / 60000;
            let totalStatsMinutes = diffMinutes + (8 * 60);

            // If they leave very early (e.g. before std time - 8h?), don't go negative on total OT?
            // Assuming totalStatsMinutes >= 0 
            if (totalStatsMinutes < 0) totalStatsMinutes = 0;

            const totalH = parseFloat((totalStatsMinutes / 60).toFixed(2));

            // Update Display
            // For Sunday, segments are 0, everything is in Sunday bucket?
            // Or should "Total OT" show the Sunday Total? YES.
            const h = Math.floor(totalStatsMinutes / 60);
            const m = Math.floor(totalStatsMinutes % 60);

            calculatedOtDisplay.textContent = `${h}h ${m > 0 ? m + 'p' : ''}`;
            calculatedOtDisplay.classList.add('highlight-text');

            otSeg1Display.textContent = '0h';
            otSeg2Display.textContent = '0h';
            otSeg3Display.textContent = '0h';

            return {
                total: totalH,
                s1: 0, s2: 0, s3: 0,
                sunday: totalH, // Store specifically as sunday OT
                meals: meals
            };
        }

        // --- Normal Day Logic ---
        if (endDateTime <= startDateTime) {
            // Error or negative OT? Assume 0
            calculatedOtDisplay.textContent = '0h';
            otSeg1Display.textContent = '0h';
            otSeg2Display.textContent = '0h';
            otSeg3Display.textContent = '0h';
            // mealTicketDisplay handled above already
            return { total: 0, s1: 0, s2: 0, s3: 0, meals: meals };
        }

        // Boundaries timestamps
        // Boundary 1: 22:00 on Start Date
        const b1 = new Date(selectedDate);
        b1.setHours(22, 0, 0, 0);

        // Boundary 2: 24:00 on Start Date (00:00 Next Day)
        const b2 = new Date(selectedDate);
        b2.setDate(b2.getDate() + 1);
        b2.setHours(0, 0, 0, 0); // Midnight

        // Calculate Minutes Helper
        const getMinutes = (start, end) => {
            if (end <= start) return 0;
            return (end - start) / 60000; // ms to minutes
        };

        // Segment 1: Start to 22:00
        // Intersect [startDateTime, endDateTime] with [startDateTime, b1]
        // Actually it's simple: whatever part of the worked interval falls before b1
        // Range 1 is [startDateTime, b1]
        const h1End = new Date(Math.min(endDateTime, b1));
        const seg1Min = getMinutes(startDateTime, h1End);

        // Segment 2: 22:00 to 24:00 (b1 to b2)
        // Range 2 is [b1, b2]
        // Intersect [startDateTime, endDateTime] with [b1, b2]
        // Start of intersection is max(startDateTime, b1) -> likely b1 since StdTime usually < 22:00
        // End of intersection is min(endDateTime, b2)
        const h2Start = new Date(Math.max(startDateTime, b1));
        const h2End = new Date(Math.min(endDateTime, b2));
        const seg2Min = getMinutes(h2Start, h2End);

        // Segment 3: After 24:00 (b2 onwards)
        // Range 3 is [b2, Infinity]
        const h3Start = new Date(Math.max(startDateTime, b2));
        const seg3Min = getMinutes(h3Start, endDateTime);

        // Format
        const formatH = (mins) => {
            const h = Math.floor(mins / 60);
            const m = Math.floor(mins % 60);
            if (h === 0 && m === 0) return '0h';
            return `${h}h${m > 0 ? m : ''}`;
        };

        otSeg1Display.textContent = formatH(seg1Min);
        otSeg2Display.textContent = formatH(seg2Min);
        otSeg3Display.textContent = formatH(seg3Min);

        const totalMinutes = seg1Min + seg2Min + seg3Min;
        const totalH = Math.floor(totalMinutes / 60);
        const totalM = Math.floor(totalMinutes % 60);
        calculatedOtDisplay.textContent = `${totalH}h ${totalM > 0 ? totalM + 'p' : ''}`;
        calculatedOtDisplay.classList.add('highlight-text');

        // Return hours for storage (float)
        return {
            total: parseFloat((totalMinutes / 60).toFixed(2)),
            s1: parseFloat((seg1Min / 60).toFixed(2)),
            s2: parseFloat((seg2Min / 60).toFixed(2)),
            s3: parseFloat((seg3Min / 60).toFixed(2)),
            meals: meals
        };
    }

    async function saveLog() {
        const outTime = outTimeInput.value;
        const outDateVal = outDateInput.value;

        if (!outTime || !outDateVal) {
            showToast('Vui lòng nhập đầy đủ ngày/giờ tan ca', 'error');
            return;
        }

        // Show loading state
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
        saveBtn.disabled = true;

        let locationData = cachedLocation; // Use cached if available

        // If no cached location but possibly manual entry, try to fetch location anyway?
        // User asked to save GPS. Existing logic: fetch on save.
        // Optimization: If cachedLocation exists and is fresh (implied by non-null), use it.
        // Else fetch.

        if (!locationData) {
            try {
                // If user didn't check realtime, we still try to get location as per original feature
                // But maybe query logic is: "Add checkbox... has save location GPS".
                // Did they mean ONLY whenever checked? Or always?
                // "thêm check box ... có lưu địa điểm".
                // Assuming always saving GPS is a good feature to keep.
                const position = await getLocation();
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const address = await fetchAddress(lat, lng);

                locationData = {
                    lat: lat,
                    lng: lng,
                    address: address
                };
            } catch (error) {
                console.log("GPS/Address Skipped:", error);
            }
        }

        const dateKey = formatDateKey(selectedDate);
        const existingLog = logs[dateKey];
        if (!locationData && existingLog && existingLog.location) {
            locationData = existingLog.location;
        }

        const otData = calculateOT();

        logs[dateKey] = {
            date: dateKey,
            timestamp: selectedDate.getTime(),
            outTime: outTime,
            outDate: outDateVal,
            otHours: otData.total,
            otSeg1: otData.s1, // < 22h
            otSeg2: otData.s2, // 22h - 24h
            otSeg3: otData.s3, // > 24h
            otSunday: otData.sunday || 0,
            meals: otData.meals,
            location: locationData
        };

        localStorage.setItem('ot_logs', JSON.stringify(logs));

        // Update view
        if (isSameMonth(selectedDate, currentViewMonth)) {
            renderLogs();
        } else {
            currentViewMonth = new Date(selectedDate);
            updateMonthDisplay();
            renderLogs();
        }

        // If in realtime mode, effectively we are "done" saving the moment?
        // Maybe uncheck the box? Or leave it?
        // Usually, after save, you are done.
        if (realtimeCheckbox.checked) {
            realtimeCheckbox.checked = false;
            stopRealtimeMode();
        }

        saveBtn.innerHTML = "Cập nhật";
        saveBtn.disabled = false;
        showToast('Đã lưu chấm công thành công!');
    }

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported"));
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: true
                });
            }
        });
    };

    const fetchAddress = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: {
                    'User-Agent': 'OvertimeTrackerApp/1.0'
                }
            });
            const data = await response.json();
            return data.display_name;
        } catch (error) {
            console.error("Geocoding error:", error);
            return null;
        }
    };

    function renderLogs() {
        logsList.innerHTML = '';

        const viewYear = currentViewMonth.getFullYear();
        const viewMonth = currentViewMonth.getMonth();

        const monthlyLogs = Object.values(logs).filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.getFullYear() === viewYear && logDate.getMonth() === viewMonth;
        });

        // Sort descending
        monthlyLogs.sort((a, b) => b.timestamp - a.timestamp);

        // Update Summary
        let totalOt = 0;
        let totalMeals = 0;
        let totalS1 = 0;
        let totalS2 = 0;
        let totalS3 = 0;

        monthlyLogs.forEach(log => {
            totalOt += log.otHours;
            totalMeals += (log.meals || 0);
            totalS1 += (log.otSeg1 || (log.otHours || 0)); // Fallback for old logs roughly
            totalS2 += (log.otSeg2 || 0);
            totalS3 += (log.otSeg3 || 0);
        });

        // Correction for fallback: if legacy logs have no segments, we put all in s1. 
        // But wait, if s1 is undefined, log.otHours is used. But if log.otSeg1 is defined, use it.
        // Actually, for consistency let's assume if otSeg1 is undefined it's all "normal OT" likely <= 22h anyway for simple use?
        // Or we could try to re-recalculate old logs but that's expensive.
        // The fallback above: (log.otSeg1 || (log.otHours || 0)) is imperfect if we have mixed old data but acceptable.
        // EXCEPT if log.otSeg1 is 0, || operator might skip it!
        // Improved logic:
        // totalS1 += (typeof log.otSeg1 !== 'undefined' ? log.otSeg1 : log.otHours);

        // Let's rewrite the loop cleaner.

        // Update Summary
        totalOt = 0;
        totalMeals = 0;
        totalS1 = 0;
        totalS2 = 0;
        totalS3 = 0;
        let totalSun = 0;

        monthlyLogs.forEach(log => {
            totalOt += log.otHours;
            totalMeals += (log.meals || 0);
            totalS1 += (log.otSeg1 || (log.otHours && !log.otSunday ? log.otHours : 0)); // Only count in S1 if not Sunday and not explicitly split
            totalS2 += (log.otSeg2 || 0);
            totalS3 += (log.otSeg3 || 0);
            totalSun += (log.otSunday || 0);
        });

        // Refined S1 Fallback:
        // If log.otSeg1 is defined, use it.
        // If NOT defined, and NOT sunday, assume all otHours is S1 (legacy).
        // If Sunday, S1 should be 0.

        totalOt = 0; totalMeals = 0; totalS1 = 0; totalS2 = 0; totalS3 = 0; totalSun = 0;
        monthlyLogs.forEach(log => {
            totalOt += log.otHours;
            totalMeals += (log.meals || 0);
            totalS2 += (log.otSeg2 || 0);
            totalS3 += (log.otSeg3 || 0);
            totalSun += (log.otSunday || 0);

            if (log.otSunday) {
                // It's sunday, S1 is 0 (or whatever is in log)
                totalS1 += (log.otSeg1 || 0);
            } else {
                // Not Sunday
                totalS1 += (log.otSeg1 !== undefined ? log.otSeg1 : log.otHours);
            }
        });

        totalOtDisplay.textContent = totalOt.toFixed(1) + 'h';
        totalMealsDisplay.textContent = totalMeals;
        totalOtS1Display.textContent = totalS1.toFixed(1) + 'h';
        totalOtS2Display.textContent = totalS2.toFixed(1) + 'h';
        totalOtS3Display.textContent = totalS3.toFixed(1) + 'h';
        if (totalOtSundayDisplay) totalOtSundayDisplay.textContent = totalSun.toFixed(1) + 'h';
        // totalDaysDisplay logic can remain or be reused if needed, currently not targeted by logic but was in HTML
        // totalDaysDisplay is actually removed from HTML in previous step logic? 
        // Wait, user asked for meals summary item, I replaced 'total-days' with 'total-meals'.
        // So 'totalDaysDisplay' element ID might be null now?
        // Let's check IDs in HTML.
        // I replaced the whole block in HTML. ID changed from total-days to total-meals.
        // So totalDaysDisplay const at top will be null or needs update.
        // Actually, let's look at Step 97 replacement. content replaces 'total-days' item with 'total-meals' item.
        // But the JS still holds a reference to 'total-days' ElementByID at top. 
        // We should just safely ignore total-days if it doesn't exist or re-map.
        // In this chunk I will update logic to write to totalMealsDisplay.


        if (monthlyLogs.length === 0) {
            logsList.innerHTML = '<div class="empty-state">Chưa có dữ liệu tháng này</div>';
            return;
        }

        monthlyLogs.forEach(log => {
            const date = new Date(log.timestamp);
            const item = document.createElement('div');
            item.className = 'log-item';

            // Make log item clickable to edit
            item.onclick = () => {
                selectedDate = new Date(log.timestamp);
                datePicker.valueAsDate = selectedDate;
                loadLogForSelectedDate();
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' });
            const itemDateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

            let locationHtml = '';
            if (log.location) {
                const addressText = log.location.address ?
                    (log.location.address.length > 30 ? log.location.address.substring(0, 30) + '...' : log.location.address)
                    : 'Vị trí';
                locationHtml = `
                    <div style="margin-top:4px;">
                        <a href="https://www.google.com/maps?q=${log.location.lat},${log.location.lng}" 
                           target="_blank" 
                           class="location-badge"
                           onclick="event.stopPropagation()"
                           title="${log.location.address || ''}">
                            <i class="fa-solid fa-location-dot"></i> ${addressText}
                        </a>
                    </div>
                `;
            }

            item.innerHTML = `
                <div class="log-date">
                    <span class="day">${itemDateStr}</span>
                    <span class="weekday">${weekday}</span>
                </div>
                <div class="log-details">
                    <span class="log-ot">+${log.otHours}h</span>
                    ${log.otSunday ? '<span style="display:block;font-size:10px;color:var(--accent-color)">Chủ Nhật</span>' : ''}
                    ${log.meals ? `<span style="display:block; font-size:11px; color:var(--text-secondary)">${log.meals} phiếu ăn</span>` : ''}
                    <span class="log-time">Về lúc ${log.outTime}</span>
                    ${locationHtml}
                </div>
                ${isAdmin ? `<button class="delete-btn" title="Xóa"><i class="fa-solid fa-trash"></i></button>` : ''}
            `;

            if (isAdmin) {
                const delBtn = item.querySelector('.delete-btn');
                if (delBtn) {
                    delBtn.onclick = (e) => {
                        e.stopPropagation(); // Prevent item click (which selects date)
                        deleteLog(log.date); // log.date is dateKey
                    };
                }
            }

            logsList.appendChild(item);
        });
    }

    function exportCSV() {
        const viewYear = currentViewMonth.getFullYear();
        const viewMonth = currentViewMonth.getMonth();

        const monthlyLogs = Object.values(logs).filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.getFullYear() === viewYear && logDate.getMonth() === viewMonth;
        });

        if (monthlyLogs.length === 0) {
            showToast('Không có dữ liệu tháng này để xuất!', 'error');
            return;
        }

        monthlyLogs.sort((a, b) => a.timestamp - b.timestamp);

        let csvContent = "Ngày,Giờ Tan Ca,Tổng OT,OT (<=22h),OT (22-24h),OT (>24h),OT CN,Phiếu Ăn,Địa Chỉ\n";

        monthlyLogs.forEach(log => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

            let locationStr = '';
            if (log.location) {
                const mapLink = `https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`;
                locationStr = log.location.address ? `"${log.location.address}"` : mapLink;
            }

            // Fallback for old logs
            const s1 = log.otSeg1 || (log.otHours && !log.otSunday ? log.otHours : 0);
            const s2 = log.otSeg2 || 0;
            const s3 = log.otSeg3 || 0;
            const sun = log.otSunday || 0;
            const meals = log.meals || 0;

            csvContent += `${dateStr},${log.outTime},${log.otHours},${s1},${s2},${s3},${sun},${meals},${locationStr}\n`;
        });

        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const filename = `Bang_Cham_Cong_Thang_${viewMonth + 1}_${viewYear}.csv`;

        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Đã tải xuống file CSV!');
    }

    function renderSettings() {
        settingStandardTimeInput.value = settings.standardTime;
        standardTimeDisplay.textContent = settings.standardTime;
    }

    function saveSettings() {
        const newTime = settingStandardTimeInput.value;
        if (!newTime) return;

        settings.standardTime = newTime;
        localStorage.setItem('ot_settings', JSON.stringify(settings));

        renderSettings();
        calculateOT(); // Recalculate
        closeModal(settingsModal);
        showToast('Đã lưu cài đặt');
    }

    function formatDateKey(date) {
        // Use local time split to avoid timezone issues when converting to YYYY-MM-DD
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    }

    function isSameMonth(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
    }

    function openModal(modal) {
        modal.classList.remove('hidden');
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
    }

    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.style.backgroundColor = type === 'error' ? '#ef4444' : 'var(--success)';
        toast.classList.remove('hidden');

        if (toast.timeoutId) clearTimeout(toast.timeoutId);

        toast.timeoutId = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
});
