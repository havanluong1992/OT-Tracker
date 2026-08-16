document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const datePicker = document.getElementById('date-picker');
    const outDateInput = document.getElementById('out-date');
    const calculatedOtDisplay = document.getElementById('calculated-ot');
    const calculatedStdDisplay = document.getElementById('calculated-std');
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
    const leaveTypeWrapper = document.getElementById('leave-type-wrapper');
    const leaveTypeSelect = document.getElementById('leave-type-select');
    const holidayToggle = document.getElementById('holiday-toggle');
    const holidayConfirmBtn = document.getElementById('confirm-holiday-btn');
    const holidayInput = document.getElementById('holiday-days-input');

    // Annual Leave Elements
    const annualLeaveBtn = document.getElementById('annual-leave-btn');
    const annualLeaveModal = document.getElementById('annual-leave-modal');
    const closeAnnualLeaveBtn = document.getElementById('close-annual-leave');
    const annualLeaveTbody = document.getElementById('annual-leave-tbody');
    const annualLeaveYearSpan = document.getElementById('annual-leave-year');
    const leaveAccruedVal = document.getElementById('leave-accrued-val');
    const leaveUsedVal = document.getElementById('leave-used-val');
    const leaveRemainingVal = document.getElementById('leave-remaining-val');
    const annualLeaveAdminBar = document.getElementById('annual-leave-admin-bar');
    const resetAnnualLeaveBtn = document.getElementById('reset-annual-leave-btn');

    // OT Leave Elements
    const otLeaveBtn = document.getElementById('ot-leave-btn');
    const otLeaveModal = document.getElementById('ot-leave-modal');
    const closeOtLeaveBtn = document.getElementById('close-ot-leave');
    const otLeaveTbody = document.getElementById('ot-leave-tbody');
    const otLeaveYearSpan = document.getElementById('ot-leave-year');
    const otLeaveAccruedVal = document.getElementById('ot-leave-accrued-val');
    const otLeaveUsedVal = document.getElementById('ot-leave-used-val');
    const otLeaveRemainingVal = document.getElementById('ot-leave-remaining-val');
    const otLeaveAdminBar = document.getElementById('ot-leave-admin-bar');
    const resetOtLeaveBtn = document.getElementById('reset-ot-leave-btn');

    // 24h Time Select Elements
    const outTimeHourSel = document.getElementById('out-time-hour');
    const outTimeMinSel = document.getElementById('out-time-min');

    // Virtual outTimeInput to keep existing code working
    const outTimeInput = {
        get value() {
            const h = outTimeHourSel.value;
            const m = outTimeMinSel.value;
            if (h === '' || m === '') return '';
            return h + ':' + m;
        },
        set value(v) {
            if (!v) {
                outTimeHourSel.value = '';
                outTimeMinSel.value = '';
                return;
            }
            const parts = v.split(':');
            outTimeHourSel.value = parts[0];
            outTimeMinSel.value = parts[1];
        }
    };

    // Settings Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // Settings time selects
    const settingStartHourSel = document.getElementById('setting-start-hour');
    const settingStartMinSel = document.getElementById('setting-start-min');
    const settingEndHourSel = document.getElementById('setting-end-hour');
    const settingEndMinSel = document.getElementById('setting-end-min');

    // Virtual settings time inputs
    const settingStartStandardTimeInput = {
        get value() {
            const h = settingStartHourSel.value;
            const m = settingStartMinSel.value;
            if (h === '' || m === '') return '08:00';
            return h + ':' + m;
        },
        set value(v) {
            if (!v) return;
            const parts = v.split(':');
            settingStartHourSel.value = parts[0];
            settingStartMinSel.value = parts[1];
        }
    };
    const settingStandardTimeInput = {
        get value() {
            const h = settingEndHourSel.value;
            const m = settingEndMinSel.value;
            if (h === '' || m === '') return '17:00';
            return h + ':' + m;
        },
        set value(v) {
            if (!v) return;
            const parts = v.split(':');
            settingEndHourSel.value = parts[0];
            settingEndMinSel.value = parts[1];
        }
    };

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
    let manualUsedLeave = JSON.parse(localStorage.getItem('ot_manual_used_leave')) || {};
    let manualAccruedOtLeave = JSON.parse(localStorage.getItem('ot_manual_accrued_ot_leave')) || {};
    let manualUsedOtLeave = JSON.parse(localStorage.getItem('ot_manual_used_ot_leave')) || {};

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
            id_placeholder: "Nhập ID", pass_placeholder: "Nhập mật khẩu", unknown: "Chưa biết",
            holiday_request: "Nghỉ lễ", holiday_summary: "Nghỉ lễ", holiday_ot: "Lễ (OT)",
            annual_leave: "Phép Năm", annual_leave_title: "Quản Lý Phép Năm", accrued_leave: "Phép phát sinh",
            used_leave: "Đã sử dụng", remaining_leave: "Phép còn lại", category: "Danh mục", total_summary: "TỔNG KẾT",
            admin_edit_leave_hint: "Chế độ Admin: Cho phép chỉnh sửa trực tiếp số phép đã sử dụng",
            reset_leave_data: "Khôi phục tính tự động", reset_leave_confirm: "Khôi phục số ngày phép đã sử dụng về dữ liệu tự động từ nhật ký làm việc?",
            reset_leave_success: "Đã khôi phục dữ liệu phép năm tự động!",
            annual_leave_option: "Năm", ot_comp_option: "OT",
            ot_comp_label: "Nghỉ bù OT", annual_leave_label: "Phép Năm",
            ot_leave_btn: "Phép OT", ot_leave_title: "Quản Lý Phép OT",
            ot_admin_edit_hint: "Chế độ Admin: Nhập Phép phát sinh & sửa Phép đã sử dụng",
            reset_ot_leave_confirm: "Khôi phục dữ liệu phép OT về mặc định tự động?",
            reset_ot_leave_success: "Đã khôi phục dữ liệu phép OT!"
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
            id_placeholder: "아이디를 입력하세요", pass_placeholder: "비밀번호를 입력하세요", unknown: "미정",
            holiday_request: "휴가", holiday_summary: "휴가", holiday_ot: "휴일 (OT)",
            annual_leave: "연차 관리", annual_leave_title: "연차 관리", accrued_leave: "발생 연차",
            used_leave: "사용 연차", remaining_leave: "잔여 연차", category: "항목", total_summary: "합계",
            admin_edit_leave_hint: "관리자 모드: 사용 연차 직접 수정 가능",
            reset_leave_data: "자동 계산 복원", reset_leave_confirm: "사용 연차를 출퇴근 기록 기반의 자동 계산 데이터로 복원하시겠습니까?",
            reset_leave_success: "연차 데이터가 복원되었습니다!",
            annual_leave_option: "연차", ot_comp_option: "OT",
            ot_comp_label: "OT 대체 휴가", annual_leave_label: "연차",
            ot_leave_btn: "OT 휴가", ot_leave_title: "OT 휴가 관리",
            ot_admin_edit_hint: "관리자 모드: 발생 연차 입력 및 사용 연차 수정 가능",
            reset_ot_leave_confirm: "OT 휴가 데이터를 초기화하시겠습니까?",
            reset_ot_leave_success: "OT 휴가 데이터가 초기화되었습니다!"
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

        // Data migration: Fix old logs that incorrectly saved standardHours as 0 
        // when checked out before 17:00 due to a previous bug.
        let logsUpdated = false;
        const [stdSh, stdSm] = settings.startStandardTime.split(':').map(Number);
        const [stdEh, stdEm] = settings.standardTime.split(':').map(Number);
        const standardStartHour = stdSh + stdSm / 60;
        const standardEndHour = stdEh + stdEm / 60;

        Object.keys(logs).forEach(k => {
            const l = logs[k];
            // If they worked (have outTime), didn't take leave, not Sunday, but standardHours is 0 -> it's likely the bug.
            if (l && l.outTime && l.outDate && l.standardHours === 0 && (!l.leaveDays) && (!l.holidayDays)) {
                const dateObj = new Date(l.date);
                if (dateObj.getDay() !== 0) { // Not sunday
                    const [ih, im] = (l.inTime || settings.startStandardTime).split(':').map(Number);
                    const [oh, om] = l.outTime.split(':').map(Number);
                    const endDT = new Date(l.outDate); endDT.setHours(oh, om, 0, 0);

                    let arrivalForStd = ih + im / 60;
                    if (Math.abs(arrivalForStd - standardStartHour) <= 0.25) arrivalForStd = standardStartHour;
                    const checkout = (endDT.getDate() !== dateObj.getDate()) ? 24 : oh + om / 60;

                    let stdM = 0;
                    const p1 = Math.max(standardStartHour, arrivalForStd), p1e = Math.min(12, checkout);
                    if (p1e > p1) stdM += (p1e - p1) * 60;
                    const p2 = Math.max(13, arrivalForStd), p2e = Math.min(standardEndHour, checkout);
                    if (p2e > p2) stdM += (p2e - p2) * 60;

                    const computedStd = parseFloat((stdM / 60).toFixed(2));
                    if (computedStd > 0) {
                        l.standardHours = computedStd;
                        logsUpdated = true;
                    }
                }
            }
        });

        if (logsUpdated) {
            localStorage.setItem('ot_logs', JSON.stringify(logs));
        }

        populateTimeSelects();
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
        outTimeHourSel.addEventListener('change', calculateOT);
        outTimeMinSel.addEventListener('change', calculateOT);

        checkinNowBtn?.addEventListener('click', handleCheckinNow);
        checkoutNowBtn?.addEventListener('click', handleCheckoutNow);

        if (leaveToggle) {
            leaveToggle.addEventListener('click', () => {
                leaveToggle.classList.toggle('active');
                if (leaveToggle.classList.contains('active')) {
                    if (!leaveInput.value) leaveInput.value = "1.0";
                    leaveTypeWrapper?.classList.remove('hidden');
                    leaveConfirmBtn.disabled = false;
                    leaveConfirmBtn.style.opacity = "1";
                    leaveConfirmBtn.style.pointerEvents = "auto";
                } else {
                    leaveInput.value = "";
                    leaveTypeWrapper?.classList.add('hidden');
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
                leaveTypeWrapper?.classList.add('hidden');
                leaveConfirmBtn.disabled = true;
                leaveConfirmBtn.style.opacity = "0.5";
                calculateOT();
                renderAnnualLeaveModal();
            });
        });

        if (holidayToggle) {
            holidayToggle.addEventListener('click', () => {
                holidayToggle.classList.toggle('active');
                if (holidayToggle.classList.contains('active')) {
                    if (!holidayInput.value) holidayInput.value = "1.0";
                    holidayConfirmBtn.disabled = false;
                    holidayConfirmBtn.style.opacity = "1";
                    holidayConfirmBtn.style.pointerEvents = "auto";
                } else {
                    holidayInput.value = "";
                    holidayConfirmBtn.disabled = true;
                    holidayConfirmBtn.style.opacity = "0.5";
                    holidayConfirmBtn.style.pointerEvents = "none";
                }
                calculateOT();
            });
        }

        holidayConfirmBtn?.addEventListener('click', () => {
            if (holidayToggle.classList.contains('active') && !holidayInput.value) {
                showToast(translations[currentLang].fill_leave_days, 'error');
                return;
            }
            saveLog(holidayConfirmBtn, 'holiday').then(() => {
                holidayToggle.classList.remove('active');
                holidayInput.value = "";
                holidayConfirmBtn.disabled = true;
                holidayConfirmBtn.style.opacity = "0.5";
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
                    if (annualLeaveModal && annualLeaveModal.classList.contains('active')) {
                        renderAnnualLeaveModal();
                    }
                    if (otLeaveModal && otLeaveModal.classList.contains('active')) {
                        renderOtLeaveModal();
                    }
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

        // Annual Leave Listeners
        annualLeaveBtn?.addEventListener('click', () => {
            renderAnnualLeaveModal();
            openModal(annualLeaveModal);
        });
        closeAnnualLeaveBtn?.addEventListener('click', () => closeModal(annualLeaveModal));
        if (annualLeaveModal) {
            annualLeaveModal.addEventListener('click', (e) => {
                if (e.target === annualLeaveModal) closeModal(annualLeaveModal);
            });
        }
        resetAnnualLeaveBtn?.addEventListener('click', () => {
            const year = currentViewMonth.getFullYear();
            const lang = translations[currentLang] || translations.vi;
            if (confirm(lang.reset_leave_confirm || "Khôi phục dữ liệu phép năm tự động?")) {
                if (manualUsedLeave[year]) {
                    delete manualUsedLeave[year];
                    localStorage.setItem('ot_manual_used_leave', JSON.stringify(manualUsedLeave));
                }
                showToast(lang.reset_leave_success || "Đã khôi phục!");
                renderAnnualLeaveModal();
            }
        });

        // OT Leave Listeners
        otLeaveBtn?.addEventListener('click', () => {
            renderOtLeaveModal();
            openModal(otLeaveModal);
        });
        closeOtLeaveBtn?.addEventListener('click', () => closeModal(otLeaveModal));
        if (otLeaveModal) {
            otLeaveModal.addEventListener('click', (e) => {
                if (e.target === otLeaveModal) closeModal(otLeaveModal);
            });
        }
        resetOtLeaveBtn?.addEventListener('click', () => {
            const year = currentViewMonth.getFullYear();
            const lang = translations[currentLang] || translations.vi;
            if (confirm(lang.reset_ot_leave_confirm || "Khôi phục dữ liệu phép OT?")) {
                if (manualAccruedOtLeave[year]) delete manualAccruedOtLeave[year];
                if (manualUsedOtLeave[year]) delete manualUsedOtLeave[year];
                localStorage.setItem('ot_manual_accrued_ot_leave', JSON.stringify(manualAccruedOtLeave));
                localStorage.setItem('ot_manual_used_ot_leave', JSON.stringify(manualUsedOtLeave));
                showToast(lang.reset_ot_leave_success || "Đã khôi phục!");
                renderOtLeaveModal();
            }
        });
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
            if (annualLeaveModal && annualLeaveModal.classList.contains('active')) {
                renderAnnualLeaveModal();
            }
            if (otLeaveModal && otLeaveModal.classList.contains('active')) {
                renderOtLeaveModal();
            }
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
                leaveTypeWrapper?.classList.remove('hidden');
                if (leaveTypeSelect) leaveTypeSelect.value = log.leaveType || 'annual';
                leaveConfirmBtn.disabled = false;
                leaveConfirmBtn.style.opacity = "1";
                leaveConfirmBtn.style.pointerEvents = "auto";
            } else {
                leaveToggle.classList.remove('active');
                leaveInput.value = "";
                leaveTypeWrapper?.classList.add('hidden');
                leaveConfirmBtn.disabled = true;
                leaveConfirmBtn.style.opacity = "0.5";
                leaveConfirmBtn.style.pointerEvents = "none";
            }
            if (log.holidayDays > 0) {
                holidayToggle.classList.add('active');
                holidayInput.value = log.holidayDays;
                holidayConfirmBtn.disabled = false;
                holidayConfirmBtn.style.opacity = "1";
                holidayConfirmBtn.style.pointerEvents = "auto";
            } else {
                holidayToggle.classList.remove('active');
                holidayInput.value = "";
                holidayConfirmBtn.disabled = true;
                holidayConfirmBtn.style.opacity = "0.5";
                holidayConfirmBtn.style.pointerEvents = "none";
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
            leaveTypeWrapper?.classList.add('hidden');
            leaveConfirmBtn.disabled = true;
            leaveConfirmBtn.style.opacity = "0.5";
            leaveConfirmBtn.style.pointerEvents = "none";
            holidayToggle.classList.remove('active');
            holidayInput.value = "";
            holidayConfirmBtn.disabled = true;
            holidayConfirmBtn.style.opacity = "0.5";
            holidayConfirmBtn.style.pointerEvents = "none";
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
        const holidayDaysVal = (holidayToggle && holidayToggle.classList.contains('active')) ? parseFloat(holidayInput?.value || '0') : 0;
        const outTime = outTimeInput.value, outDateVal = outDateInput.value;
        if (!outTime || !outDateVal) {
            calculatedOtDisplay.textContent = '--';
            if (calculatedStdDisplay) calculatedStdDisplay.textContent = '--';
            if (mealTicketDisplay) mealTicketDisplay.textContent = '0';
            const stdH = (Math.max(leaveDaysVal, holidayDaysVal)) * 8;
            return { total: 0, s1: 0, s2: 0, s3: 0, meals: 0, standardHours: stdH, leaveDays: leaveDaysVal, holidayDays: holidayDaysVal };
        }

        const dateKey = formatDateKey(selectedDate);
        const log = logs[dateKey];
        const inTime = (log && log.inTime) ? log.inTime : (settings.startStandardTime || '08:00');
        let [ih, im] = inTime.split(':').map(Number);
        const startDT = new Date(selectedDate); startDT.setHours(ih, im, 0, 0);
        const endDT = new Date(outDateVal);
        let [oh, om] = outTime.split(':').map(Number); endDT.setHours(oh, om, 0, 0);

        const [stdSh, stdSm] = settings.startStandardTime.split(':').map(Number);
        const [stdEh, stdEm] = settings.standardTime.split(':').map(Number);
        const standardStartHour = stdSh + stdSm / 60;
        const standardEndHour = stdEh + stdEm / 60;

        let stdM = 0;
        if (leaveDaysVal < 1 && holidayDaysVal < 1) {
            let arrivalForStd = ih + im / 60;
            if (Math.abs(arrivalForStd - standardStartHour) <= 0.25) arrivalForStd = standardStartHour;

            let checkOutHour = oh + om / 60;
            if (endDT.getTime() > startDT.getTime() && endDT.getDate() !== startDT.getDate()) {
                checkOutHour += 24; // Cross-midnight properly
            }

            // Standard time calculation (e.g. 8:00 to 12:00 and 13:00 to 17:00)
            const p1 = Math.max(standardStartHour, arrivalForStd);
            const p1e = Math.min(12, checkOutHour);
            if (p1e > p1) stdM += (p1e - p1) * 60;

            const p2 = Math.max(13, arrivalForStd);
            const p2e = Math.min(standardEndHour, checkOutHour);
            if (p2e > p2) stdM += (p2e - p2) * 60;

            if (leaveDaysVal === 0.5 || holidayDaysVal === 0.5) stdM = Math.min(stdM, 240);
        } else if (leaveDaysVal > 0 || holidayDaysVal > 0) {
            // Count leave/holiday hours as standard hours
            stdM = (Math.max(leaveDaysVal, holidayDaysVal)) * 8 * 60;
        }

        const calculatedStdHoursNum = Math.min(8, parseFloat((stdM / 60).toFixed(2)));
        if (calculatedStdDisplay) calculatedStdDisplay.textContent = calculatedStdHoursNum + 'h';

        let meals = 0;
        const cp20 = new Date(selectedDate); cp20.setHours(20, 0, 0, 0);
        const isSaturday = selectedDate.getDay() === 6;
        const isSunday = selectedDate.getDay() === 0;

        if (endDT >= cp20) meals = 1;
        if (mealTicketDisplay) mealTicketDisplay.textContent = meals;

        if (isSunday) {
            let durationMins = Math.max(0, (endDT - startDT) / 60000);
            // Simple lunch deduction if spanning 12:00-13:00
            if (ih < 12 && (oh >= 13 || endDT.getDate() > startDT.getDate())) durationMins -= 60;

            // Nếu cài đặt giờ về là 17:30 và làm việc qua mốc này, trừ thêm 30 phút nghỉ ăn
            const checkOutHour = oh + om / 60 + (endDT.getDate() !== startDT.getDate() ? 24 : 0);
            if (settings.standardTime === '17:30' && checkOutHour >= 17.5) durationMins -= 30;

            calculatedOtDisplay.textContent = (durationMins / 60).toFixed(1) + 'h';
            return { total: parseFloat((durationMins / 60).toFixed(2)), s1: 0, s2: 0, s3: 0, sunday: parseFloat((durationMins / 60).toFixed(2)), holidayOt: 0, meals, standardHours: calculatedStdHoursNum, leaveDays: leaveDaysVal, holidayDays: holidayDaysVal, isSaturday: isSaturday };
        }

        // Holiday with OT (Treat like Sunday)
        if (holidayDaysVal > 0 && outTime && outDateVal) {
            let durationMins = Math.max(0, (endDT - startDT) / 60000);
            if (ih < 12 && (oh >= 13 || endDT.getDate() > startDT.getDate())) durationMins -= 60;

            // Nếu cài đặt giờ về là 17:30 và làm việc qua mốc này, trừ thêm 30 phút nghỉ ăn
            const checkOutHour = oh + om / 60 + (endDT.getDate() !== startDT.getDate() ? 24 : 0);
            if (settings.standardTime === '17:30' && checkOutHour >= 17.5) durationMins -= 30;

            calculatedOtDisplay.textContent = (durationMins / 60).toFixed(1) + 'h';
            return {
                total: parseFloat((durationMins / 60).toFixed(2)),
                s1: 0, s2: 0, s3: 0,
                sunday: 0,
                holidayOt: parseFloat((durationMins / 60).toFixed(2)),
                meals,
                standardHours: calculatedStdHoursNum,
                leaveDays: 0,
                holidayDays: holidayDaysVal,
                isSaturday: isSaturday
            };
        }

        if (endDT <= startDT) {
            calculatedOtDisplay.textContent = '0.0h';
            return { total: 0, s1: 0, s2: 0, s3: 0, meals, standardHours: calculatedStdHoursNum, leaveDays: leaveDaysVal, holidayDays: holidayDaysVal, isSaturday: isSaturday, holidayOt: 0 };
        }

        const b1 = new Date(selectedDate); b1.setHours(22, 0, 0, 0);
        const b2 = new Date(selectedDate); b2.setDate(b2.getDate() + 1); b2.setHours(0, 0, 0, 0);
        const getM = (s, e) => (e > s ? (e - s) / 60000 : 0);

        const standardEndDT = new Date(selectedDate); standardEndDT.setHours(stdEh, stdEm, 0, 0);
        const otStartDT = standardEndDT;

        const s1 = getM(new Date(Math.max(startDT, otStartDT)), Math.min(endDT, b1));
        const s2 = getM(new Date(Math.max(startDT, b1)), Math.min(endDT, b2));
        const s3 = getM(new Date(Math.max(startDT, b2)), endDT);

        otSeg1Display.textContent = (s1 / 60).toFixed(1) + 'h';
        otSeg2Display.textContent = (s2 / 60).toFixed(1) + 'h';
        otSeg3Display.textContent = (s3 / 60).toFixed(1) + 'h';
        const totalMin = s1 + s2 + s3;
        calculatedOtDisplay.textContent = (totalMin / 60).toFixed(1) + 'h';

        return {
            total: parseFloat((totalMin / 60).toFixed(2)),
            s1: parseFloat((s1 / 60).toFixed(2)),
            s2: parseFloat((s2 / 60).toFixed(2)),
            s3: parseFloat((s3 / 60).toFixed(2)),
            meals,
            standardHours: calculatedStdHoursNum,
            leaveDays: leaveDaysVal,
            holidayDays: holidayDaysVal,
            isSaturday: isSaturday,
            otSunday: isSunday ? parseFloat((totalMin / 60).toFixed(2)) : 0,
            holidayOt: 0
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
        const isHoliday = (holidayToggle?.classList.contains('active') && parseFloat(holidayInput.value || '0') > 0);
        if (!isLeave && !isHoliday && actionType !== 'checkin' && (!outTimeInput.value || !outDateInput.value)) {
            if (triggerBtn) { triggerBtn.innerHTML = orig; triggerBtn.disabled = false; }
            showToast(translations[currentLang].input_needed, 'error'); return;
        }

        const inTimeValue = checkinTimeForLog || (existing && existing.inTime) || settings.startStandardTime;

        const selectedLeaveType = (isLeave && leaveTypeSelect) ? leaveTypeSelect.value : ((existing && existing.leaveType) || 'annual');

        logs[dk] = {
            date: dk, timestamp: selectedDate.getTime(),
            inTime: inTimeValue,
            outTime: outTimeInput.value, outDate: outDateInput.value,
            otHours: otData.total, otSeg1: otData.s1, otSeg2: otData.s2, otSeg3: otData.s3,
            otSunday: otData.sunday || 0, holidayOt: otData.holidayOt || 0, meals: otData.meals, standardHours: otData.standardHours,
            leaveDays: otData.leaveDays, leaveType: selectedLeaveType, holidayDays: otData.holidayDays, location: loc || (existing && existing.location)
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

        let tOT = 0, tM = 0, tS = 0, tL = 0, tH = 0, ts1 = 0, ts2 = 0, ts3 = 0, tSun = 0, tSat = 0, tHOt = 0;

        // Calculate totals from existing logs
        Object.values(logs).filter(l => isSameMonth(new Date(l.date), currentViewMonth)).forEach(l => {
            tOT += (l.otHours || 0);
            tM += (l.meals || 0);
            ts1 += (l.otSeg1 || 0);
            ts2 += (l.otSeg2 || 0);
            ts3 += (l.otSeg3 || 0);
            tSun += (l.otSunday || 0);
            tHOt += (l.holidayOt || 0);
            tL += (l.leaveDays || 0);
            const hld = (l.holidayDays || 0);
            tH += hld;

            // Use stored standardHours if available
            tS += (l.standardHours || 0);

            const d = new Date(l.date);
            if (d.getDay() === 6) {
                if (l.standardHours !== undefined && l.standardHours !== null) {
                    tSat += (l.standardHours / 8);
                } else if (l.outTime && l.inTime) {
                    tSat += 1; // Fallback
                }
            }
        });

        totalOtDisplay.textContent = tOT.toFixed(1) + 'h';
        totalMealsDisplay.textContent = tM;
        if (standardTimeDisplay) standardTimeDisplay.textContent = tS.toFixed(1) + 'h';
        const lvSum = document.getElementById('total-leave-summary');
        if (lvSum) lvSum.textContent = parseFloat(tL.toFixed(2)) + (currentLang === 'vi' ? ' ngày' : '일');
        totalOtS1Display.textContent = ts1.toFixed(1) + 'h';
        totalOtS2Display.textContent = ts2.toFixed(1) + 'h';
        totalOtS3Display.textContent = ts3.toFixed(1) + 'h';
        if (totalOtSundayDisplay) totalOtSundayDisplay.textContent = tSun.toFixed(1) + 'h';
        const hOtSum = document.getElementById('total-ot-holiday');
        if (hOtSum) hOtSum.textContent = tHOt.toFixed(1) + 'h';
        const satWorkDisplay = document.getElementById('total-sat-work');
        if (satWorkDisplay) satWorkDisplay.textContent = parseFloat(tSat.toFixed(2));
        const holidaySum = document.getElementById('total-holiday-summary');
        if (holidaySum) holidaySum.textContent = parseFloat(tH.toFixed(2));

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
                if (l.leaveDays > 0 || l.holidayDays > 0) {
                    let label = translations[currentLang].leave_days;
                    let badgeColor = '#f59e0b';
                    if (l.holidayDays > 0) {
                        label = translations[currentLang].holiday_request;
                        badgeColor = '#10b981';
                    } else if (l.leaveType === 'ot_comp') {
                        label = translations[currentLang].ot_comp_label || "Nghỉ bù OT";
                        badgeColor = '#3b82f6';
                    } else {
                        label = translations[currentLang].annual_leave_label || translations[currentLang].leave_days;
                        badgeColor = '#f59e0b';
                    }
                    const val = l.holidayDays > 0 ? l.holidayDays : l.leaveDays;
                    lvH = `<span style="display:block; font-size:14px; font-weight:600; color:${badgeColor};">${label}: ${val}</span>`;

                    // If they also worked (have outTime), show standard hours and times
                    if (l.outTime && l.standardHours > 0) {
                        const stdH = `<span style="font-size:11px;color:var(--primary-color);margin-right:8px;font-weight:600;">Std: ${l.standardHours}h</span>`;
                        wkH = `${stdH}<span class="log-time">${l.inTime ? translations[currentLang].vào + ': ' + l.inTime + ' | ' : ''}${translations[currentLang].ve_luc}: ${l.outTime}</span>`;
                    } else {
                        const otH = l.otHours || 0;
                        if (otH > 0) wkH = `<span class="log-ot">+${otH}h ${l.holidayDays > 0 ? 'Holiday OT' : 'OT'}</span>`;
                    }
                } else {
                    const otH = l.otHours || 0;
                    lvH = `<span class="log-ot">${otH > 0 ? '+' + otH + 'h' : '0h'}</span>`;
                    const stdH = (l.standardHours !== undefined && l.standardHours !== null) ? `<span style="font-size:11px;color:var(--primary-color);margin-right:8px;font-weight:600;">Std: ${l.standardHours}h</span>` : '';
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
        settingStartStandardTimeInput.value = settings.startStandardTime;
        settingStandardTimeInput.value = settings.standardTime;
    }

    function recalculateLog(log) {
        if (!log.outTime || !log.outDate) return log;

        const recordDate = new Date(log.timestamp || log.date);
        const inTime = log.inTime || settings.startStandardTime;
        let [ih, im] = inTime.split(':').map(Number);
        const startDT = new Date(recordDate); startDT.setHours(ih, im, 0, 0);
        const endDT = new Date(log.outDate);
        let [oh, om] = log.outTime.split(':').map(Number); endDT.setHours(oh, om, 0, 0);

        const [stdSh, stdSm] = settings.startStandardTime.split(':').map(Number);
        const [stdEh, stdEm] = settings.standardTime.split(':').map(Number);
        const standardStartHour = stdSh + stdSm / 60;
        const standardEndHour = stdEh + stdEm / 60;

        const leaveDaysVal = log.leaveDays || 0;
        const holidayDaysVal = log.holidayDays || 0;

        let stdM = 0;
        if (leaveDaysVal < 1 && holidayDaysVal < 1) {
            let arrivalForStd = ih + im / 60;
            if (Math.abs(arrivalForStd - standardStartHour) <= 0.25) arrivalForStd = standardStartHour;

            let checkOutHour = oh + om / 60;
            if (endDT.getTime() > startDT.getTime() && endDT.getDate() !== startDT.getDate()) {
                checkOutHour += 24;
            }

            const p1 = Math.max(standardStartHour, arrivalForStd);
            const p1e = Math.min(12, checkOutHour);
            if (p1e > p1) stdM += (p1e - p1) * 60;

            const p2 = Math.max(13, arrivalForStd);
            const p2e = Math.min(standardEndHour, checkOutHour);
            if (p2e > p2) stdM += (p2e - p2) * 60;

            if (leaveDaysVal === 0.5 || holidayDaysVal === 0.5) stdM = Math.min(stdM, 240);
        } else if (leaveDaysVal > 0 || holidayDaysVal > 0) {
            stdM = (Math.max(leaveDaysVal, holidayDaysVal)) * 8 * 60;
        }

        const calculatedStdHoursNum = Math.min(8, parseFloat((stdM / 60).toFixed(2)));

        let meals = 0;
        const cp20 = new Date(recordDate); cp20.setHours(20, 0, 0, 0);
        const isSaturday = recordDate.getDay() === 6;
        const isSunday = recordDate.getDay() === 0;

        if (endDT >= cp20) meals = 1;

        if (isSunday) {
            let durationMins = Math.max(0, (endDT - startDT) / 60000);
            if (ih < 12 && (oh >= 13 || endDT.getDate() > startDT.getDate())) durationMins -= 60;

            const checkOutHour = oh + om / 60 + (endDT.getDate() !== startDT.getDate() ? 24 : 0);
            if (settings.standardTime === '17:30' && checkOutHour >= 17.5) durationMins -= 30;

            log.otHours = parseFloat((durationMins / 60).toFixed(2));
            log.otSeg1 = 0; log.otSeg2 = 0; log.otSeg3 = 0;
            log.otSunday = parseFloat((durationMins / 60).toFixed(2));
            log.holidayOt = 0;
            log.meals = meals;
            log.standardHours = calculatedStdHoursNum;
            return log;
        }

        if (holidayDaysVal > 0) {
            let durationMins = Math.max(0, (endDT - startDT) / 60000);
            if (ih < 12 && (oh >= 13 || endDT.getDate() > startDT.getDate())) durationMins -= 60;

            const checkOutHour = oh + om / 60 + (endDT.getDate() !== startDT.getDate() ? 24 : 0);
            if (settings.standardTime === '17:30' && checkOutHour >= 17.5) durationMins -= 30;

            log.otHours = parseFloat((durationMins / 60).toFixed(2));
            log.otSeg1 = 0; log.otSeg2 = 0; log.otSeg3 = 0;
            log.otSunday = 0;
            log.holidayOt = parseFloat((durationMins / 60).toFixed(2));
            log.meals = meals;
            log.standardHours = calculatedStdHoursNum;
            return log;
        }

        if (endDT <= startDT) {
            log.otHours = 0;
            log.otSeg1 = 0; log.otSeg2 = 0; log.otSeg3 = 0;
            log.otSunday = 0; log.holidayOt = 0;
            log.meals = meals;
            log.standardHours = calculatedStdHoursNum;
            return log;
        }

        const b1 = new Date(recordDate); b1.setHours(22, 0, 0, 0);
        const b2 = new Date(recordDate); b2.setDate(b2.getDate() + 1); b2.setHours(0, 0, 0, 0);
        const getM = (s, e) => (e > s ? (e - s) / 60000 : 0);

        const standardEndDT = new Date(recordDate); standardEndDT.setHours(stdEh, stdEm, 0, 0);
        const otStartDT = standardEndDT;

        const s1 = getM(new Date(Math.max(startDT, otStartDT)), Math.min(endDT, b1));
        const s2 = getM(new Date(Math.max(startDT, b1)), Math.min(endDT, b2));
        const s3 = getM(new Date(Math.max(startDT, b2)), endDT);

        const totalMin = s1 + s2 + s3;

        log.otHours = parseFloat((totalMin / 60).toFixed(2));
        log.otSeg1 = parseFloat((s1 / 60).toFixed(2));
        log.otSeg2 = parseFloat((s2 / 60).toFixed(2));
        log.otSeg3 = parseFloat((s3 / 60).toFixed(2));
        log.otSunday = 0; log.holidayOt = 0;
        log.meals = meals;
        log.standardHours = calculatedStdHoursNum;
        return log;
    }

    function saveSettings() {
        settings.startStandardTime = settingStartStandardTimeInput.value;
        settings.standardTime = settingStandardTimeInput.value;
        localStorage.setItem('ot_settings', JSON.stringify(settings));

        // Tự động tính toán lại toàn bộ dữ liệu lịch sử theo cấu hình mới
        let logsUpdated = false;
        Object.keys(logs).forEach(dateKey => {
            const oldLog = logs[dateKey];
            if (oldLog && oldLog.outTime) {
                logs[dateKey] = recalculateLog(oldLog);
                logsUpdated = true;
            }
        });
        if (logsUpdated) {
            localStorage.setItem('ot_logs', JSON.stringify(logs));
        }

        showToast(translations[currentLang].settings_saved);
        closeModal(settingsModal);

        // Cập nhật lại UI hiển thị ngay lập tức không cần tải lại trang
        loadLogForSelectedDate();
        renderLogs();
    }

    // Populate all time select dropdowns with 24h values
    function populateTimeSelects() {
        const selectors = [
            [outTimeHourSel, outTimeMinSel, true],
            [settingStartHourSel, settingStartMinSel, false],
            [settingEndHourSel, settingEndMinSel, false]
        ];
        selectors.forEach(([hourSel, minSel, allowEmpty]) => {
            hourSel.innerHTML = '';
            minSel.innerHTML = '';
            if (allowEmpty) {
                hourSel.innerHTML += '<option value="">--</option>';
                minSel.innerHTML += '<option value="">--</option>';
            }
            for (let i = 0; i <= 23; i++) {
                const v = String(i).padStart(2, '0');
                hourSel.innerHTML += '<option value="' + v + '">' + v + '</option>';
            }
            for (let i = 0; i < 60; i++) {
                const v = String(i).padStart(2, '0');
                minSel.innerHTML += '<option value="' + v + '">' + v + '</option>';
            }
        });
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

    function renderAnnualLeaveModal() {
        const year = currentViewMonth.getFullYear();
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonthIndex = today.getMonth(); // 0..11

        if (annualLeaveYearSpan) annualLeaveYearSpan.textContent = year;

        // Toggle Admin bar in annual leave modal
        if (annualLeaveAdminBar) {
            if (isAdmin) annualLeaveAdminBar.classList.remove('hidden');
            else annualLeaveAdminBar.classList.add('hidden');
        }

        // Initialize 12 months array (index 0..11)
        const accruedList = new Array(12).fill(0);
        const usedList = new Array(12).fill(0);
        const remainingList = new Array(12).fill(0);

        // 1. Accrued Leave Calculation
        for (let m = 0; m < 12; m++) {
            if (year < currentYear) {
                accruedList[m] = 1.0; // Past years get full 1 day per month
            } else if (year === currentYear) {
                if (m <= currentMonthIndex) {
                    accruedList[m] = 1.0; // Months up to current month get 1 day
                } else {
                    accruedList[m] = 0; // Future months not accrued yet
                }
            } else {
                accruedList[m] = 0; // Future years not accrued yet
            }
        }

        // 2. Used Leave Calculation from ot_logs (only Annual Leave type, excluding OT Comp leave)
        Object.values(logs).forEach(log => {
            if (log.leaveDays && log.leaveDays > 0) {
                if (!log.leaveType || log.leaveType === 'annual') {
                    const logDate = new Date(log.date);
                    if (!isNaN(logDate.getTime()) && logDate.getFullYear() === year) {
                        const m = logDate.getMonth();
                        if (m >= 0 && m < 12) {
                            usedList[m] += parseFloat(log.leaveDays) || 0;
                        }
                    }
                }
            }
        });

        // 2b. Apply Manual Overrides for Used Leave if set
        if (manualUsedLeave[year]) {
            for (let m = 0; m < 12; m++) {
                if (manualUsedLeave[year][m] !== undefined && manualUsedLeave[year][m] !== null) {
                    usedList[m] = parseFloat(manualUsedLeave[year][m]) || 0;
                }
            }
        }

        // Helper function to update cumulative balances, summary cards and row totals
        function updateLeaveTotals() {
            let runningBalance = 0;
            let totalAccrued = 0;
            let totalUsed = 0;

            for (let m = 0; m < 12; m++) {
                totalAccrued += accruedList[m];
                totalUsed += usedList[m];
                runningBalance += accruedList[m] - usedList[m];
                remainingList[m] = runningBalance;
            }

            const totalRemaining = totalAccrued - totalUsed;

            // Update Stat Cards
            if (leaveAccruedVal) leaveAccruedVal.textContent = totalAccrued.toFixed(1);
            if (leaveUsedVal) leaveUsedVal.textContent = totalUsed.toFixed(1);
            if (leaveRemainingVal) leaveRemainingVal.textContent = totalRemaining.toFixed(1);

            // Update Row Totals & Remaining Row in DOM
            if (annualLeaveTbody) {
                const rowUsed = annualLeaveTbody.querySelector('.row-used');
                const rowRemaining = annualLeaveTbody.querySelector('.row-remaining');
                
                if (rowUsed) {
                    const lastTd = rowUsed.querySelector('td:last-child');
                    if (lastTd) lastTd.textContent = totalUsed.toFixed(1);
                }

                if (rowRemaining) {
                    const cells = rowRemaining.querySelectorAll('td');
                    for (let m = 0; m < 12; m++) {
                        if (cells[m + 1]) { // index + 1 because first cell is label
                            if (accruedList[m] > 0 || (year < currentYear)) {
                                cells[m + 1].textContent = remainingList[m].toFixed(1);
                            } else {
                                cells[m + 1].textContent = '-';
                            }
                        }
                    }
                    const lastTd = rowRemaining.querySelector('td:last-child');
                    if (lastTd) lastTd.textContent = totalRemaining.toFixed(1);
                }
            }
        }

        // 3. Populate Table Rows HTML
        if (annualLeaveTbody) {
            const lang = translations[currentLang] || translations.vi;
            const accruedLabel = lang.accrued_leave || "Phép phát sinh";
            const usedLabel = lang.used_leave || "Đã sử dụng";
            const remainingLabel = lang.remaining_leave || "Phép còn lại";

            let trAccrued = `<tr class="row-accrued"><td>${accruedLabel}</td>`;
            let trUsed = `<tr class="row-used"><td>${usedLabel}</td>`;
            let trRemaining = `<tr class="row-remaining"><td>${remainingLabel}</td>`;

            for (let m = 0; m < 12; m++) {
                trAccrued += `<td>${accruedList[m].toFixed(1)}</td>`;
                
                if (isAdmin) {
                    const val = usedList[m];
                    trUsed += `<td class="cell-editable"><input type="number" class="used-leave-input" data-month="${m}" value="${val}" step="0.5" min="0"></td>`;
                } else {
                    trUsed += `<td>${usedList[m] > 0 ? usedList[m].toFixed(1) : '0'}</td>`;
                }
                
                trRemaining += `<td>-</td>`;
            }

            trAccrued += `<td>0</td></tr>`;
            trUsed += `<td>0</td></tr>`;
            trRemaining += `<td>0</td></tr>`;

            annualLeaveTbody.innerHTML = trAccrued + trUsed + trRemaining;

            // Perform initial calculation and update remaining row & stat cards
            updateLeaveTotals();

            // Bind input change listeners if Admin
            if (isAdmin) {
                const inputs = annualLeaveTbody.querySelectorAll('.used-leave-input');
                inputs.forEach(input => {
                    input.addEventListener('input', (e) => {
                        const m = parseInt(e.target.getAttribute('data-month'));
                        let val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) val = 0;

                        if (!manualUsedLeave[year]) manualUsedLeave[year] = {};
                        manualUsedLeave[year][m] = val;
                        usedList[m] = val;
                        localStorage.setItem('ot_manual_used_leave', JSON.stringify(manualUsedLeave));

                        updateLeaveTotals();
                    });
                });
            }
        }
    }

    function renderOtLeaveModal() {
        const year = currentViewMonth.getFullYear();
        if (otLeaveYearSpan) otLeaveYearSpan.textContent = year;

        if (otLeaveAdminBar) {
            if (isAdmin) otLeaveAdminBar.classList.remove('hidden');
            else otLeaveAdminBar.classList.add('hidden');
        }

        const accruedList = new Array(12).fill(0);
        const usedList = new Array(12).fill(0);
        const remainingList = new Array(12).fill(0);

        // 1. Accrued OT leave from manualAccruedOtLeave[year]
        if (manualAccruedOtLeave[year]) {
            for (let m = 0; m < 12; m++) {
                if (manualAccruedOtLeave[year][m] !== undefined && manualAccruedOtLeave[year][m] !== null) {
                    accruedList[m] = parseFloat(manualAccruedOtLeave[year][m]) || 0;
                }
            }
        }

        // 2. Used OT leave from logs where leaveType === 'ot_comp'
        Object.values(logs).forEach(log => {
            if (log.leaveDays && log.leaveDays > 0 && log.leaveType === 'ot_comp') {
                const logDate = new Date(log.date);
                if (!isNaN(logDate.getTime()) && logDate.getFullYear() === year) {
                    const m = logDate.getMonth();
                    if (m >= 0 && m < 12) {
                        usedList[m] += parseFloat(log.leaveDays) || 0;
                    }
                }
            }
        });

        // 2b. Apply manual override for used OT leave if set
        if (manualUsedOtLeave[year]) {
            for (let m = 0; m < 12; m++) {
                if (manualUsedOtLeave[year][m] !== undefined && manualUsedOtLeave[year][m] !== null) {
                    usedList[m] = parseFloat(manualUsedOtLeave[year][m]) || 0;
                }
            }
        }

        // Helper function to update cumulative balances, summary cards and row totals
        function updateOtLeaveTotals() {
            let runningBalance = 0;
            let totalAccrued = 0;
            let totalUsed = 0;

            for (let m = 0; m < 12; m++) {
                totalAccrued += accruedList[m];
                totalUsed += usedList[m];
                runningBalance += accruedList[m] - usedList[m];
                remainingList[m] = runningBalance;
            }

            const totalRemaining = totalAccrued - totalUsed;

            if (otLeaveAccruedVal) otLeaveAccruedVal.textContent = totalAccrued.toFixed(1);
            if (otLeaveUsedVal) otLeaveUsedVal.textContent = totalUsed.toFixed(1);
            if (otLeaveRemainingVal) otLeaveRemainingVal.textContent = totalRemaining.toFixed(1);

            if (otLeaveTbody) {
                const rowAccrued = otLeaveTbody.querySelector('.row-accrued');
                const rowUsed = otLeaveTbody.querySelector('.row-used');
                const rowRemaining = otLeaveTbody.querySelector('.row-remaining');

                if (rowAccrued) {
                    const lastTd = rowAccrued.querySelector('td:last-child');
                    if (lastTd) lastTd.textContent = totalAccrued.toFixed(1);
                }

                if (rowUsed) {
                    const lastTd = rowUsed.querySelector('td:last-child');
                    if (lastTd) lastTd.textContent = totalUsed.toFixed(1);
                }

                if (rowRemaining) {
                    const cells = rowRemaining.querySelectorAll('td');
                    for (let m = 0; m < 12; m++) {
                        if (cells[m + 1]) {
                            cells[m + 1].textContent = remainingList[m].toFixed(1);
                        }
                    }
                    const lastTd = rowRemaining.querySelector('td:last-child');
                    if (lastTd) lastTd.textContent = totalRemaining.toFixed(1);
                }
            }
        }

        if (otLeaveTbody) {
            const lang = translations[currentLang] || translations.vi;
            const accruedLabel = lang.accrued_leave || "Phép phát sinh";
            const usedLabel = lang.used_leave || "Đã sử dụng";
            const remainingLabel = lang.remaining_leave || "Phép còn lại";

            let trAccrued = `<tr class="row-accrued"><td>${accruedLabel}</td>`;
            let trUsed = `<tr class="row-used"><td>${usedLabel}</td>`;
            let trRemaining = `<tr class="row-remaining"><td>${remainingLabel}</td>`;

            for (let m = 0; m < 12; m++) {
                // Accrued row is editable by user/Admin
                trAccrued += `<td class="cell-editable"><input type="number" class="ot-accrued-input" data-month="${m}" value="${accruedList[m]}" step="0.5" min="0"></td>`;

                // Used row is editable when isAdmin
                if (isAdmin) {
                    trUsed += `<td class="cell-editable"><input type="number" class="ot-used-input" data-month="${m}" value="${usedList[m]}" step="0.5" min="0"></td>`;
                } else {
                    trUsed += `<td>${usedList[m] > 0 ? usedList[m].toFixed(1) : '0'}</td>`;
                }

                trRemaining += `<td>0</td>`;
            }

            trAccrued += `<td>0</td></tr>`;
            trUsed += `<td>0</td></tr>`;
            trRemaining += `<td>0</td></tr>`;

            otLeaveTbody.innerHTML = trAccrued + trUsed + trRemaining;

            updateOtLeaveTotals();

            // Bind input change listeners for accrued inputs
            const accruedInputs = otLeaveTbody.querySelectorAll('.ot-accrued-input');
            accruedInputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    const m = parseInt(e.target.getAttribute('data-month'));
                    let val = parseFloat(e.target.value);
                    if (isNaN(val) || val < 0) val = 0;

                    if (!manualAccruedOtLeave[year]) manualAccruedOtLeave[year] = {};
                    manualAccruedOtLeave[year][m] = val;
                    accruedList[m] = val;
                    localStorage.setItem('ot_manual_accrued_ot_leave', JSON.stringify(manualAccruedOtLeave));

                    updateOtLeaveTotals();
                });
            });

            // Bind input change listeners for used inputs when Admin
            if (isAdmin) {
                const usedInputs = otLeaveTbody.querySelectorAll('.ot-used-input');
                usedInputs.forEach(input => {
                    input.addEventListener('input', (e) => {
                        const m = parseInt(e.target.getAttribute('data-month'));
                        let val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) val = 0;

                        if (!manualUsedOtLeave[year]) manualUsedOtLeave[year] = {};
                        manualUsedOtLeave[year][m] = val;
                        usedList[m] = val;
                        localStorage.setItem('ot_manual_used_ot_leave', JSON.stringify(manualUsedOtLeave));

                        updateOtLeaveTotals();
                    });
                });
            }
        }
    }
});