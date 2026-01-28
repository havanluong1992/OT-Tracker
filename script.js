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
    const standardTimeDisplay = document.getElementById('total-std');
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
    const checkinNowBtn = document.getElementById('checkin-now-btn');
    const checkoutNowBtn = document.getElementById('checkout-now-btn');
    const gpsStatusDiv = document.getElementById('gps-status');
    const gpsAddressSpan = document.getElementById('gps-address');
    const leaveToggle = document.getElementById('leave-toggle');
    const leaveConfirmBtn = document.getElementById('confirm-leave-btn');
    const leaveInput = document.getElementById('leave-days-input');

    // Settings Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const settingStartStandardTimeInput = document.getElementById('setting-start-standard-time');
    const settingStandardTimeInput = document.getElementById('setting-standard-time');
    const toast = document.getElementById('toast');

    // Login Elements
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.getElementById('close-login');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginIdInput = document.getElementById('login-id');
    const loginPassInput = document.getElementById('login-pass');
    const langBtn = document.getElementById('lang-btn');
    const langText = document.getElementById('lang-text');

    // State
    let selectedDate = new Date();
    let currentViewMonth = new Date();
    let currentLang = localStorage.getItem('ot_lang') || 'vi';
    let logs = JSON.parse(localStorage.getItem('ot_logs')) || {};
    let settings = JSON.parse(localStorage.getItem('ot_settings')) || {
        startStandardTime: '08:00',
        standardTime: '17:00'
    };
    let realtimeInterval = null;
    let cachedLocation = null;
    let isAdmin = false;

    const translations = {
        vi: {
            total_ot: "Tổng giờ OT", meal_tickets: "Phiếu ăn", sunday: "Chủ Nhật (OT)", work_day: "Ngày làm việc",
            checkin_time: "Giờ vào", checkout_time: "Giờ tan ca", record_now: "Tan ca", check_in: "Vào ca",
            std_time: "Giờ chuẩn", after_24h: "Sau 24h", save_record: "Lưu bản ghi", update_record: "Cập nhật",
            record_history: "Lịch sử chấm công", no_data: "Không có dữ liệu trong tháng này", settings: "Cài đặt",
            std_checkout_time: "Giờ tan sở tiêu chuẩn", std_checkout_hint: "Giờ kết thúc làm việc chính thức để tính OT.",
            attendance_data: "Quản lý dữ liệu", export_csv: "Xuất File CSV (Tháng này)", save_settings: "Lưu Cài Đặt",
            login_id: "ID Đăng Nhập", password: "Mật Khẩu", login_btn: "Đăng Nhập", logout_confirm: "Bạn có muốn đăng xuất không?",
            logged_out: "Đã đăng xuất!", login_success: "Admin đăng nhập thành công!", login_error: "ID hoặc Mật khẩu không đúng!",
            delete_confirm: "Xóa dữ liệu ngày này? Hành động này không thể hoàn tác.", delete_success: "Đã xóa thành công!", gps_fetching: "Đang lấy vị trí GPS...",
            gps_error: "Không thể lấy vị trí GPS", save_success: "Đã lưu bản ghi thành công!", input_needed: "Vui lòng nhập đủ ngày và giờ tan ca",
            processing: "Đang xử lý...", csv_downloaded: "Đã tải xuống file CSV!", csv_no_data: "Không có dữ liệu tháng này!",
            settings_saved: "Cài đặt đã được lưu!", days: "ngày", vào: "Vào (출근)", ve_luc: "Về (퇴근)", phieu_an: "phiếu (식권)",
            months: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
            weekdays: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"],
            csv_headers: "Ngày,Giờ Vào,Giờ Tan Ca,Tổng OT,OT (<=22h),OT (22-24h),OT (>24h),OT CN,Phiếu Ăn,Giờ Chuẩn,Nghỉ Phép,Địa Chỉ\n",
            leave_days: "Nghỉ phép", leave_request: "Nghỉ phép", fill_leave_days: "Số ngày", confirm: "Xác nhận",
            standard_work_hours: "Giờ tiêu chuẩn", checkout_day: "Ngày tan ca", std_start_time: "Giờ bắt đầu tiêu chuẩn",
            ot_17_22: "17h - 22h", ot_22_24: "22h - 24h", saturday_work: "Thứ 7", normal_off: "Nghỉ bình thường",
            id_placeholder: "Nhập ID", pass_placeholder: "Nhập mật khẩu", unknown: "Chưa biết"
        },
        ko: {
            total_ot: "총 초과 근무(OT)", meal_tickets: "식권(개)", sunday: "일요일(OT)", work_day: "근무 일자",
            checkin_time: "출근 시간", checkout_time: "퇴근 시간", record_now: "지금 퇴근", check_in: "지금 출근",
            std_time: "기본 근무", after_24h: "24시 이후", save_record: "기록 저장", update_record: "수정",
            record_history: "출퇴근 이력", no_data: "이번 달 데이터가 없습니다.", settings: "설정",
            std_checkout_time: "표준 퇴근 시간", std_checkout_hint: "OT 계산을 위한 정규 근무 종료 시간입니다.",
            attendance_data: "데이터 관리", export_csv: "CSV 파일 내보내기 (이달)", save_settings: "설정 저장",
            login_id: "로그인 ID", password: "비밀번호", login_btn: "로그인", logout_confirm: "로그아웃 하시겠습니까?",
            logged_out: "로그아웃 되었습니다.", login_success: "관리자로 로그인했습니다.", login_error: "ID 또는 비밀번호가 틀렸습니다.",
            delete_confirm: "데이터를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.", delete_success: "삭제되었습니다.", gps_fetching: "GPS 위치 확인 중...",
            gps_error: "위치 정보를 가져올 수 없습니다.", save_success: "기록이 저장되었습니다!", input_needed: "퇴근 날짜와 시간을 입력해주세요.",
            processing: "처리 중...", csv_downloaded: "CSV 다운로드 완료!", csv_no_data: "내보낼 데이터가 없습니다.",
            settings_saved: "설정이 저장되었습니다.", days: "일", vào: "출근 (Vào)", ve_luc: "퇴근 (Về)", phieu_an: "식권 (phiếu)",
            months: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
            weekdays: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
            csv_headers: "날짜,출근 시간,퇴근 시간,총 OT,OT (<=22h),OT (22-24h),OT (>24h),일요일 OT,식권,표준 시간,휴가,주소\n",
            leave_days: "휴가", leave_request: "휴가 신청", fill_leave_days: "휴가 일수", confirm: "저장",
            standard_work_hours: "정규 근무", checkout_day: "퇴근 일자", std_start_time: "표준 출근 시간",
            ot_17_22: "17시 - 22시", ot_22_24: "22시 - 24시", saturday_work: "토요일", normal_off: "정기 휴무",
            id_placeholder: "아이디를 입력하세요", pass_placeholder: "비밀번호를 입력하세요", unknown: "미정"
        }
    };

    init();

    function init() {
        // Aggressive repair for swapped or corrupted settings from previous bug
        const [sh, sm] = (settings.startStandardTime || "08:00").split(':').map(Number);
        const [eh, em] = (settings.standardTime || "17:00").split(':').map(Number);

        if (sh >= eh || sh >= 12) { // If start is after end or start is afternoon, it's likely wrong
            settings.startStandardTime = '08:00';
            settings.standardTime = '17:00';
            localStorage.setItem('ot_settings', JSON.stringify(settings));
        }

        // Fix today's log if it was corrupted by the 17:00 fallback bug
        const todayK = formatDateKey(new Date());
        if (logs[todayK] && logs[todayK].inTime === '17:00' && logs[todayK].outTime) {
            logs[todayK].inTime = settings.startStandardTime;
            localStorage.setItem('ot_logs', JSON.stringify(logs));
        }

        datePicker.valueAsDate = selectedDate;
        outDateInput.valueAsDate = selectedDate;
        updateUIText();
        updateMonthDisplay();
        renderSettings();
        renderLogs();
        loadLogForSelectedDate();
        setupEventListeners();
    }

    function updateUIText() {
        const lang = translations[currentLang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (lang[key]) {
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.placeholder = lang[key];
                } else {
                    el.textContent = lang[key];
                }
            }
        });
        if (langText) langText.textContent = currentLang.toUpperCase();
        document.documentElement.setAttribute('lang', currentLang);
    }

    function toggleLanguage() {
        currentLang = currentLang === 'vi' ? 'ko' : 'vi';
        localStorage.setItem('ot_lang', currentLang);
        updateUIText();
        updateMonthDisplay();
        renderLogs();
        loadLogForSelectedDate();
    }

    function setupEventListeners() {
        datePicker.addEventListener('change', (e) => {
            if (e.target.value) {
                selectedDate = new Date(e.target.value);
                outDateInput.value = e.target.value;
                loadLogForSelectedDate();
            }
        });
        outDateInput.addEventListener('change', calculateOT);
        outTimeInput.addEventListener('change', calculateOT);
        outTimeInput.addEventListener('input', calculateOT);

        checkinNowBtn?.addEventListener('click', handleCheckinNow);
        checkoutNowBtn?.addEventListener('click', handleCheckoutNow);

        if (leaveToggle) {
            leaveToggle.addEventListener('click', () => {
                leaveToggle.classList.toggle('active');
                if (leaveToggle.classList.contains('active')) {
                    if (!leaveInput.value) leaveInput.value = "1.0";
                    leaveConfirmBtn.disabled = false;
                    leaveConfirmBtn.style.opacity = "1";
                    leaveConfirmBtn.style.pointerEvents = "auto";
                } else {
                    leaveInput.value = "";
                    leaveConfirmBtn.disabled = true;
                    leaveConfirmBtn.style.opacity = "0.5";
                    leaveConfirmBtn.style.pointerEvents = "none";
                }
                calculateOT();
            });
        }

        leaveConfirmBtn?.addEventListener('click', () => {
            if (leaveToggle.classList.contains('active') && !leaveInput.value) {
                showToast(translations[currentLang].fill_leave_days, 'error');
                return;
            }
            saveLog(leaveConfirmBtn, 'leave').then(() => {
                leaveToggle.classList.remove('active');
                leaveInput.value = "";
                leaveConfirmBtn.disabled = true;
                leaveConfirmBtn.style.opacity = "0.5";
                calculateOT();
            });
        });

        prevMonthBtn?.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn?.addEventListener('click', () => changeMonth(1));

        settingsBtn?.addEventListener('click', () => openModal(settingsModal));
        closeSettingsBtn?.addEventListener('click', () => closeModal(settingsModal));
        saveSettingsBtn?.addEventListener('click', saveSettings);

        const exportBtn = document.getElementById('export-btn');
        exportBtn?.addEventListener('click', exportCSV);

        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) closeModal(settingsModal);
            });
        }

        loginBtn?.addEventListener('click', () => {
            if (isAdmin) {
                if (confirm(translations[currentLang].logout_confirm)) {
                    isAdmin = false;
                    document.body.classList.remove('admin-logged-in');
                    loginBtn.innerHTML = '<i class="fa-solid fa-user-lock"></i>';
                    showToast(translations[currentLang].logged_out);
                    renderLogs();
                }
            } else openModal(loginModal);
        });

        langBtn?.addEventListener('click', toggleLanguage);
        closeLoginBtn?.addEventListener('click', () => closeModal(loginModal));
        loginSubmitBtn?.addEventListener('click', handleLogin);
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) closeModal(loginModal);
            });
        }
    }

    function handleLogin() {
        if (loginIdInput.value === 'Admin' && loginPassInput.value === '123') {
            isAdmin = true;
            document.body.classList.add('admin-logged-in');
            loginBtn.innerHTML = '<i class="fa-solid fa-user-check"></i>';
            closeModal(loginModal);
            showToast(translations[currentLang].login_success);
            loginIdInput.value = ''; loginPassInput.value = '';
            renderLogs();
        } else showToast(translations[currentLang].login_error, 'error');
    }

    function deleteLog(dateKey) {
        if (!isAdmin) return;
        if (confirm(translations[currentLang].delete_confirm)) {
            delete logs[dateKey];
            localStorage.setItem('ot_logs', JSON.stringify(logs));
            showToast(translations[currentLang].delete_success);
            if (formatDateKey(selectedDate) === dateKey) loadLogForSelectedDate();
            renderLogs();
        }
    }

    function loadLogForSelectedDate() {
        const dateKey = formatDateKey(selectedDate);
        const log = logs[dateKey];

        // Always sync the date picker to the selectedDate
        datePicker.value = dateKey;

        if (log) {
            outTimeInput.value = log.outTime || '';
            outDateInput.value = log.outDate || dateKey;
            checkinNowBtn.disabled = !!log.inTime;
            checkinNowBtn.style.opacity = log.inTime ? "0.5" : "1";
            checkinNowBtn.style.pointerEvents = log.inTime ? "none" : "auto";
            if (log.leaveDays > 0) {
                leaveToggle.classList.add('active');
                leaveInput.value = log.leaveDays;
                leaveConfirmBtn.disabled = false;
                leaveConfirmBtn.style.opacity = "1";
                leaveConfirmBtn.style.pointerEvents = "auto";
            } else {
                leaveToggle.classList.remove('active');
                leaveInput.value = "";
                leaveConfirmBtn.disabled = true;
                leaveConfirmBtn.style.opacity = "0.5";
                leaveConfirmBtn.style.pointerEvents = "none";
            }
            calculateOT();
        } else {
            outTimeInput.value = '';
            outDateInput.value = dateKey;
            checkinNowBtn.disabled = false;
            checkinNowBtn.style.opacity = "1";
            checkinNowBtn.style.pointerEvents = "auto";
            leaveToggle.classList.remove('active');
            leaveInput.value = "";
            leaveConfirmBtn.disabled = true;
            leaveConfirmBtn.style.opacity = "0.5";
            leaveConfirmBtn.style.pointerEvents = "none";
            if (mealTicketDisplay) mealTicketDisplay.textContent = '0';
            calculateOT();
        }
    }

    function updateMonthDisplay() {
        const m = translations[currentLang].months[currentViewMonth.getMonth()];
        const y = currentViewMonth.getFullYear();
        currentMonthDisplay.textContent = currentLang === 'vi' ? `${m}, ${y}` : `${y}년 ${m}`;
    }

    function changeMonth(delta) {
        currentViewMonth.setMonth(currentViewMonth.getMonth() + delta);
        updateMonthDisplay();
        renderLogs();
    }

    function calculateOT() {
        const leaveDaysVal = (leaveToggle && leaveToggle.classList.contains('active')) ? parseFloat(leaveInput?.value || '0') : 0;
        const outTime = outTimeInput.value, outDateVal = outDateInput.value;
        if (!outTime || !outDateVal) {
            calculatedOtDisplay.textContent = '--';
            if (mealTicketDisplay) mealTicketDisplay.textContent = '0';
            return { total: 0, s1: 0, s2: 0, s3: 0, meals: 0, standardHours: 0, leaveDays: leaveDaysVal };
        }

        const dateKey = formatDateKey(selectedDate);
        const log = logs[dateKey];
        const inTime = (log && log.inTime) ? log.inTime : (settings.startStandardTime || '08:00');
        const [ih, im] = inTime.split(':').map(Number);
        const startDT = new Date(selectedDate); startDT.setHours(ih, im, 0, 0);
        const endDT = new Date(outDateVal);
        const [oh, om] = outTime.split(':').map(Number); endDT.setHours(oh, om, 0, 0);

        const [stdSh, stdSm] = settings.startStandardTime.split(':').map(Number);
        const [stdEh, stdEm] = settings.standardTime.split(':').map(Number);
        const standardStartHour = stdSh + stdSm / 60;
        const standardEndHour = stdEh + stdEm / 60;

        let meals = 0;
        const cp20 = new Date(selectedDate); cp20.setHours(20, 0, 0, 0);
        const cp22 = new Date(selectedDate); cp22.setHours(22, 0, 0, 0);
        const cp24 = new Date(selectedDate); cp24.setDate(cp24.getDate() + 1); cp24.setHours(0, 0, 0, 0);
        const isSaturday = selectedDate.getDay() === 6;
        const isSunday = selectedDate.getDay() === 0;

        if (endDT >= cp20) meals++;
        if (endDT >= cp22) meals++;
        if (endDT >= cp24) meals++;
        if (mealTicketDisplay) mealTicketDisplay.textContent = meals;

        if (isSunday) {
            let durationMins = Math.max(0, (endDT - startDT) / 60000);
            // Simple lunch deduction if spanning 12:00-13:00
            if (ih < 12 && (oh >= 13 || endDT.getDate() > startDT.getDate())) durationMins -= 60;

            calculatedOtDisplay.textContent = Math.floor(durationMins / 60) + 'h ' + (Math.floor(durationMins % 60) > 0 ? Math.floor(durationMins % 60) + 'p' : '');
            return { total: parseFloat((durationMins / 60).toFixed(2)), s1: 0, s2: 0, s3: 0, sunday: parseFloat((durationMins / 60).toFixed(2)), meals, standardHours: 0, leaveDays: leaveDaysVal, isSaturday: isSaturday };
        }

        if (endDT <= startDT) return { total: 0, s1: 0, s2: 0, s3: 0, meals, standardHours: 0, leaveDays: leaveDaysVal, isSaturday: isSaturday };

        const b1 = new Date(selectedDate); b1.setHours(22, 0, 0, 0);
        const b2 = new Date(selectedDate); b2.setDate(b2.getDate() + 1); b2.setHours(0, 0, 0, 0);
        const getM = (s, e) => (e > s ? (e - s) / 60000 : 0);

        const standardEndDT = new Date(selectedDate); standardEndDT.setHours(stdEh, stdEm, 0, 0);
        const otStartDT = standardEndDT;

        const s1 = getM(new Date(Math.max(startDT, otStartDT)), Math.min(endDT, b1));
        const s2 = getM(new Date(Math.max(startDT, b1)), Math.min(endDT, b2));
        const s3 = getM(new Date(Math.max(startDT, b2)), endDT);

        otSeg1Display.textContent = Math.floor(s1 / 60) + 'h';
        otSeg2Display.textContent = Math.floor(s2 / 60) + 'h';
        otSeg3Display.textContent = Math.floor(s3 / 60) + 'h';
        const totalMin = s1 + s2 + s3;
        calculatedOtDisplay.textContent = Math.floor(totalMin / 60) + 'h ' + (Math.floor(totalMin % 60) > 0 ? Math.floor(totalMin % 60) + 'p' : '');

        let stdM = 0;
        if (leaveDaysVal < 1) {
            let arrivalForStd = ih + im / 60;
            if (Math.abs(arrivalForStd - standardStartHour) <= 0.25) arrivalForStd = standardStartHour;

            const checkout = (endDT.getDate() !== startDT.getDate()) ? 24 : oh + om / 60;
            const p1 = Math.max(standardStartHour, arrivalForStd), p1e = Math.min(12, checkout);
            if (p1e > p1) stdM += (p1e - p1) * 60;
            const p2 = Math.max(13, arrivalForStd), p2e = Math.min(standardEndHour, checkout);
            if (p2e > p2) stdM += (p2e - p2) * 60;
            if (leaveDaysVal === 0.5) stdM = Math.min(stdM, 240);
        } else if (leaveDaysVal > 0) {
            // Count leave hours as standard hours
            stdM = leaveDaysVal * 8 * 60;
        }
        return {
            total: parseFloat((totalMin / 60).toFixed(2)),
            s1: parseFloat((s1 / 60).toFixed(2)),
            s2: parseFloat((s2 / 60).toFixed(2)),
            s3: parseFloat((s3 / 60).toFixed(2)),
            meals,
            standardHours: parseFloat((stdM / 60).toFixed(2)),
            leaveDays: leaveDaysVal,
            isSaturday: isSaturday,
            otSunday: isSunday ? parseFloat((totalMin / 60).toFixed(2)) : 0
        };
    }

    async function handleCheckinNow() { await saveLog(checkinNowBtn, 'checkin'); renderLogs(); loadLogForSelectedDate(); }
    async function handleCheckoutNow() { await saveLog(checkoutNowBtn, 'checkout'); renderLogs(); loadLogForSelectedDate(); }

    async function saveLog(triggerBtn = null, actionType = null) {
        let dk = formatDateKey(selectedDate);
        let orig = "";
        if (triggerBtn) {
            triggerBtn.disabled = true; orig = triggerBtn.innerHTML;
            triggerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${translations[currentLang].processing}`;
        }
        let loc = cachedLocation;
        const isManualCheckout = (actionType === 'checkout' && outTimeInput.value);

        if (!isManualCheckout) {
            try {
                const p = await getLocation();
                const addr = await fetchAddress(p.coords.latitude, p.coords.longitude);
                loc = { lat: p.coords.latitude, lng: p.coords.longitude, address: addr };
            } catch (e) { }
        }

        let checkinTimeForLog = null;
        if (actionType === 'checkin') {
            const now = new Date(); selectedDate = now; datePicker.valueAsDate = now; dk = formatDateKey(now);
            const log = logs[dk] || { date: dk, timestamp: now.getTime() };
            checkinTimeForLog = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
            log.inTime = checkinTimeForLog;
            logs[dk] = log;
        } else if (actionType === 'checkout' && !outTimeInput.value) {
            const now = new Date();
            outDateInput.value = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            outTimeInput.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        }

        const otData = calculateOT();
        const existing = logs[dk];
        const isLeave = (leaveToggle?.classList.contains('active') && parseFloat(leaveInput.value || '0') > 0);
        if (!isLeave && actionType !== 'checkin' && (!outTimeInput.value || !outDateInput.value)) {
            if (triggerBtn) { triggerBtn.innerHTML = orig; triggerBtn.disabled = false; }
            showToast(translations[currentLang].input_needed, 'error'); return;
        }

        const inTimeValue = checkinTimeForLog || (existing && existing.inTime) || settings.startStandardTime;

        logs[dk] = {
            date: dk, timestamp: selectedDate.getTime(),
            inTime: inTimeValue,
            outTime: outTimeInput.value, outDate: outDateInput.value,
            otHours: otData.total, otSeg1: otData.s1, otSeg2: otData.s2, otSeg3: otData.s3,
            otSunday: otData.sunday || 0, meals: otData.meals, standardHours: otData.standardHours,
            leaveDays: otData.leaveDays, location: loc || (existing && existing.location)
        };
        localStorage.setItem('ot_logs', JSON.stringify(logs));
        renderLogs();
        if (triggerBtn) { triggerBtn.innerHTML = orig; triggerBtn.disabled = false; }
        showToast(translations[currentLang].save_success);
    }

    const getLocation = () => new Promise((res, rej) => {
        if (!navigator.geolocation) rej();
        else navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, enableHighAccuracy: true });
    });

    const fetchAddress = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
            const data = await res.json(); return data.display_name;
        } catch (e) { return null; }
    };

    function renderLogs() {
        const year = currentViewMonth.getFullYear();
        const month = currentViewMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Prepare list of all days in month
        const allDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dateKey = formatDateKey(dateObj);
            allDays.push({
                dateKey: dateKey,
                timestamp: dateObj.getTime(),
                log: logs[dateKey] || null
            });
        }

        // Sort descending (newest first)
        allDays.sort((a, b) => b.timestamp - a.timestamp);

        let tOT = 0, tM = 0, tS = 0, tL = 0, ts1 = 0, ts2 = 0, ts3 = 0, tSun = 0, tSat = 0;

        // Calculate totals from existing logs
        Object.values(logs).filter(l => isSameMonth(new Date(l.date), currentViewMonth)).forEach(l => {
            tOT += (l.otHours || 0);
            tM += (l.meals || 0);
            ts1 += (l.otSeg1 || 0);
            ts2 += (l.otSeg2 || 0);
            ts3 += (l.otSeg3 || 0);
            tSun += (l.otSunday || 0);
            tL += (l.leaveDays || 0);

            // Use stored standardHours if available, otherwise fallback to 0
            tS += (l.standardHours || 0);

            const d = new Date(l.date);
            if (d.getDay() === 6) tSat++;
        });

        totalOtDisplay.textContent = tOT.toFixed(1) + 'h';
        totalMealsDisplay.textContent = tM;
        if (standardTimeDisplay) standardTimeDisplay.textContent = tS.toFixed(1) + 'h';
        const lvSum = document.getElementById('total-leave-summary');
        if (lvSum) lvSum.textContent = (tL * 8).toFixed(1) + 'h';
        totalOtS1Display.textContent = ts1.toFixed(1) + 'h';
        totalOtS2Display.textContent = ts2.toFixed(1) + 'h';
        totalOtS3Display.textContent = ts3.toFixed(1) + 'h';
        if (totalOtSundayDisplay) totalOtSundayDisplay.textContent = tSun.toFixed(1) + 'h';
        const satWorkDisplay = document.getElementById('total-sat-work');
        if (satWorkDisplay) satWorkDisplay.textContent = tSat;

        logsList.innerHTML = '';
        allDays.forEach(dayData => {
            const date = new Date(dayData.timestamp);
            const l = dayData.log;

            const item = document.createElement('div');
            item.className = 'log-item' + (!l ? ' empty-log' : '');
            item.onclick = () => {
                selectedDate = new Date(dayData.timestamp);
                datePicker.valueAsDate = selectedDate;
                loadLogForSelectedDate();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            const dayStr = date.toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'ko-KR', { day: '2-digit', month: '2-digit' });
            const wday = translations[currentLang].weekdays[date.getDay()];

            let contentHtml = '';
            if (l) {
                let locH = '';
                if (l.location) {
                    const a = l.location.address ? (l.location.address.length > 30 ? l.location.address.substring(0, 30) + '...' : l.location.address) : 'Vị trí';
                    locH = `<div style="margin-top:4px;"><a href="https://www.google.com/maps?q=${l.location.lat},${l.location.lng}" target="_blank" class="location-badge" onclick="event.stopPropagation()"><i class="fa-solid fa-location-dot"></i> ${a}</a></div>`;
                }

                let lvH = '', wkH = '';
                if (l.leaveDays > 0) {
                    lvH = `<span style="display:block; font-size:14px; font-weight:600; color:#f59e0b;">${translations[currentLang].leave_days}: ${l.leaveDays}</span>`;
                    if (l.otHours > 0) wkH = `<span class="log-ot">+${l.otHours}h OT</span>`;
                } else {
                    const otH = l.otHours || 0;
                    lvH = `<span class="log-ot">${otH > 0 ? '+' + otH + 'h' : '0h'}</span>`;
                    const stdH = l.standardHours ? `<span style="font-size:11px;color:var(--primary-color);margin-right:8px;font-weight:600;">Std: ${l.standardHours}h</span>` : '';
                    wkH = `${stdH}<span class="log-time">${l.inTime ? translations[currentLang].vào + ': ' + l.inTime + ' | ' : ''}${translations[currentLang].ve_luc}: ${l.outTime || translations[currentLang].unknown}</span>`;
                }

                contentHtml = `<div class="log-details">${lvH}${l.otSunday ? `<span style="font-size:10px;color:var(--accent-color)">${translations[currentLang].sunday}</span>` : ''}${l.meals ? `<span style="font-size:11px;color:var(--text-secondary);margin-right:8px;">${l.meals} ${translations[currentLang].phieu_an}</span>` : ''}${wkH}${locH}</div>
                ${isAdmin ? `<button class="delete-btn"><i class="fa-solid fa-trash"></i></button>` : ''}`;
            } else {
                contentHtml = `<div class="log-details"><span style="color: var(--text-secondary); font-style: italic; font-size: 13px;">${translations[currentLang].normal_off}</span></div>`;
            }

            item.innerHTML = `
                <div class="log-date"><span class="day">${dayStr}</span><span class="weekday">${wday}</span></div>
                ${contentHtml}
            `;
            if (l && isAdmin) item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteLog(l.date); };
            logsList.appendChild(item);
        });
    }

    function renderSettings() {
        if (settingStartStandardTimeInput) settingStartStandardTimeInput.value = settings.startStandardTime;
        if (settingStandardTimeInput) settingStandardTimeInput.value = settings.standardTime;
    }

    function saveSettings() {
        if (settingStartStandardTimeInput) settings.startStandardTime = settingStartStandardTimeInput.value;
        if (settingStandardTimeInput) settings.standardTime = settingStandardTimeInput.value;
        localStorage.setItem('ot_settings', JSON.stringify(settings));
        showToast(translations[currentLang].settings_saved);
        closeModal(settingsModal);
        calculateOT();
    }

    function formatDateKey(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
    function isSameMonth(d1, d2) { return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth(); }
    function showToast(msg, type = 'success') {
        toast.textContent = msg; toast.className = 'toast show ' + type;
        setTimeout(() => { toast.className = 'toast'; }, 3000);
    }

    function openModal(modal) { if (modal) modal.classList.add('active'); }
    function closeModal(modal) { if (modal) modal.classList.remove('active'); }

    function exportCSV() {
        const monthly = Object.values(logs).filter(l => isSameMonth(new Date(l.timestamp), currentViewMonth)).sort((a, b) => a.timestamp - b.timestamp);
        if (monthly.length === 0) { showToast(translations[currentLang].csv_no_data, 'error'); return; }
        let c = translations[currentLang].csv_headers;
        monthly.forEach(l => {
            c += `${l.date},${l.inTime || ''},${l.outTime},${l.otHours},${l.otSeg1 || 0},${l.otSeg2 || 0},${l.otSeg3 || 0},${l.otSunday || 0},${l.meals},${l.standardHours},${l.leaveDays},"${(l.location && l.location.address) || ''}"\n`;
        });
        const b = new Blob(["\ufeff" + c], { type: 'text/csv;charset=utf-8;' });
        const lnk = document.createElement('a');
        lnk.href = URL.createObjectURL(b);
        lnk.download = `OT_${currentViewMonth.getFullYear()}_${currentViewMonth.getMonth() + 1}.csv`;
        lnk.click();
        showToast(translations[currentLang].csv_downloaded);
    }
});