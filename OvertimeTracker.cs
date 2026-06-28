using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;

namespace OvertimeTracker.Core
{
    /// <summary>
    /// Base class for implementing INotifyPropertyChanged to support automatic UI Data Binding.
    /// Lớp cơ sở thực thi INotifyPropertyChanged để hỗ trợ đồng bộ dữ liệu tự động lên giao diện.
    /// </summary>
    public abstract class ViewModelBase : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        protected bool SetField<T>(ref T field, T value, [CallerMemberName] string propertyName = null)
        {
            if (EqualityComparer<T>.Default.Equals(field, value)) return false;
            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }
    }

    /// <summary>
    /// Core utility class containing pure mathematical logic for Overtime calculation.
    /// Lớp tiện ích thuần túy chứa logic tính toán giờ làm thêm (OT).
    /// </summary>
    public static class OvertimeCalculator
    {
        /// <summary>
        /// Calculates the Overtime hours for a single day.
        /// Tính toán số giờ OT của một ngày làm việc.
        /// </summary>
        /// <param name="start">Start Time of the shift (Giờ vào ca)</param>
        /// <param name="end">End Time of the shift (Giờ tan ca thực tế)</param>
        /// <param name="standardEnd">Standard end time of normal shift (Giờ tan ca tiêu chuẩn, ví dụ 17:30)</param>
        /// <param name="breakTime">Break or deductible time during overtime (Thời gian nghỉ giữa ca OT)</param>
        /// <returns>Calculated Overtime as TimeSpan. Returns TimeSpan.Zero if no OT.</returns>
        public static TimeSpan CalculateDailyOt(TimeSpan start, TimeSpan end, TimeSpan standardEnd, TimeSpan breakTime)
        {
            // Edge case: Both times are zero
            if (start == TimeSpan.Zero && end == TimeSpan.Zero)
            {
                return TimeSpan.Zero;
            }

            TimeSpan adjustedEnd = end;

            // Handle midnight crossing (Ca làm việc qua đêm, ví dụ vào 22:00 hôm trước, về 06:00 sáng hôm sau)
            if (end < start)
            {
                adjustedEnd = end.Add(TimeSpan.FromHours(24));
            }

            // If employee checks out before or exactly at standard end time, OT is zero
            if (adjustedEnd <= standardEnd)
            {
                return TimeSpan.Zero;
            }

            // Formula: OT = EndTime - StandardEndTime - BreakTime
            TimeSpan rawOt = adjustedEnd - standardEnd - breakTime;

            // Overtime cannot be negative
            return rawOt < TimeSpan.Zero ? TimeSpan.Zero : rawOt;
        }
    }

    /// <summary>
    /// Model representing a daily work record with automatic recalculation and validation.
    /// Model đại diện cho bản ghi công nhật, tích hợp sẵn tính toán tự động và kiểm tra hợp lệ dữ liệu.
    /// </summary>
    public class DailyWorkRecord : ViewModelBase, IDataErrorInfo
    {
        private DateTime _date;
        private TimeSpan _startTime;
        private TimeSpan _endTime;
        private TimeSpan _standardEndTime = TimeSpan.FromHours(17.5); // Default 17:30
        private TimeSpan _breakTime = TimeSpan.Zero;
        private TimeSpan _dailyOt = TimeSpan.Zero;
        private string _validationError = string.Empty;

        public DailyWorkRecord(DateTime date, TimeSpan startTime, TimeSpan endTime)
        {
            _date = date;
            _startTime = startTime;
            _endTime = endTime;
            Recalculate();
        }

        /// <summary>
        /// Working Date. (Ngày làm việc)
        /// </summary>
        public DateTime Date
        {
            get => _date;
            set => SetField(ref _date, value);
        }

        /// <summary>
        /// Time when employee starts work. (Giờ vào ca)
        /// </summary>
        public TimeSpan StartTime
        {
            get => _startTime;
            set
            {
                if (SetField(ref _startTime, value))
                {
                    Validate();
                    Recalculate();
                }
            }
        }

        /// <summary>
        /// Actual checkout/end time. (Giờ tan ca thực tế)
        /// </summary>
        public TimeSpan EndTime
        {
            get => _endTime;
            set
            {
                if (SetField(ref _endTime, value))
                {
                    Validate();
                    Recalculate();
                }
            }
        }

        /// <summary>
        /// The company's official checkout time. (Giờ tan ca hành chính tiêu chuẩn, thường là 17:00 hoặc 17:30)
        /// </summary>
        public TimeSpan StandardEndTime
        {
            get => _standardEndTime;
            set
            {
                if (SetField(ref _standardEndTime, value))
                {
                    Validate();
                    Recalculate();
                }
            }
        }

        /// <summary>
        /// Unpaid break time during overtime hours. (Thời gian nghỉ không lương tính vào OT)
        /// </summary>
        public TimeSpan BreakTime
        {
            get => _breakTime;
            set
            {
                if (SetField(ref _breakTime, value))
                {
                    Validate();
                    Recalculate();
                }
            }
        }

        /// <summary>
        /// Automatically computed Overtime for this day. (Giờ OT tự động tính toán cho ngày)
        /// </summary>
        public TimeSpan DailyOt
        {
            get => _dailyOt;
            private set => SetField(ref _dailyOt, value);
        }

        /// <summary>
        /// Triggers calculations. Internal performance optimization avoids database access during calculation.
        /// </summary>
        private void Recalculate()
        {
            // Do not compute OT if there is an active validation error on critical fields
            if (!string.IsNullOrEmpty(this[nameof(EndTime)]) || !string.IsNullOrEmpty(this[nameof(StartTime)]))
            {
                DailyOt = TimeSpan.Zero;
                return;
            }

            // Special logic for Sunday: Sunday hours are entirely counted as OT
            if (Date.DayOfWeek == DayOfWeek.Sunday)
            {
                TimeSpan adjustedEnd = EndTime;
                if (EndTime < StartTime)
                {
                    adjustedEnd = EndTime.Add(TimeSpan.FromHours(24));
                }

                double durationMins = (adjustedEnd - StartTime).TotalMinutes;

                // Lunch deduction (12:00 - 13:00) if shift spans across lunch hours
                if (StartTime < TimeSpan.FromHours(12) && (EndTime >= TimeSpan.FromHours(13) || EndTime < StartTime))
                {
                    durationMins -= 60;
                }

                // Tea/Dinner break deduction if StandardEndTime is set to 17:30 (17.5h) and checkout is at or after 17:30
                if (StandardEndTime == TimeSpan.FromHours(17.5) && adjustedEnd >= TimeSpan.FromHours(17.5))
                {
                    durationMins -= 30;
                }

                DailyOt = durationMins > 0 ? TimeSpan.FromMinutes(durationMins) : TimeSpan.Zero;
                return;
            }

            DailyOt = OvertimeCalculator.CalculateDailyOt(StartTime, EndTime, StandardEndTime, BreakTime);
        }

        #region Data Validation (IDataErrorInfo Implementation)

        public string Error => _validationError;

        public string this[string columnName]
        {
            get
            {
                string result = string.Empty;

                switch (columnName)
                {
                    case nameof(StartTime):
                        if (StartTime < TimeSpan.Zero || StartTime >= TimeSpan.FromHours(24))
                        {
                            result = "Start time must be between 00:00 and 23:59.";
                        }
                        break;

                    case nameof(EndTime):
                        if (EndTime < TimeSpan.Zero || EndTime >= TimeSpan.FromHours(24))
                        {
                            result = "End time must be between 00:00 and 23:59.";
                        }
                        break;

                    case nameof(BreakTime):
                        if (BreakTime < TimeSpan.Zero)
                        {
                            result = "Break time cannot be negative.";
                        }
                        break;

                    case nameof(StandardEndTime):
                        if (StandardEndTime < TimeSpan.Zero || StandardEndTime >= TimeSpan.FromHours(24))
                        {
                            result = "Standard end time must be valid.";
                        }
                        break;
                }

                return result;
            }
        }

        private void Validate()
        {
            var errors = new List<string>();
            foreach (var prop in new[] { nameof(StartTime), nameof(EndTime), nameof(StandardEndTime), nameof(BreakTime) })
            {
                string err = this[prop];
                if (!string.IsNullOrEmpty(err))
                {
                    errors.Add(err);
                }
            }
            _validationError = string.Join("; ", errors);
            OnPropertyChanged(nameof(Error));
        }

        #endregion
    }

    /// <summary>
    /// ViewModel that aggregates daily records and automatically updates monthly totals upon changes.
    /// ViewModel quản lý và tổng hợp dữ liệu làm thêm của cả tháng, tự động đồng bộ khi thay đổi dữ liệu ngày.
    /// </summary>
    public class MonthlyTrackerViewModel : ViewModelBase
    {
        private TimeSpan _totalMonthlyOt = TimeSpan.Zero;
        private int _activeMonth;
        private int _activeYear;

        /// <summary>
        /// Observable collection of daily work records bound to the DataGrid or ListView.
        /// Danh sách quan sát được của các bản ghi ngày, được liên kết trực tiếp với UI.
        /// </summary>
        public ObservableCollection<DailyWorkRecord> DailyRecords { get; }

        /// <summary>
        /// Sum of all daily overtime hours for the active month. (Tổng số giờ OT của tháng)
        /// </summary>
        public TimeSpan TotalMonthlyOt
        {
            get => _totalMonthlyOt;
            private set => SetField(ref _totalMonthlyOt, value);
        }

        public int ActiveMonth
        {
            get => _activeMonth;
            set => SetField(ref _activeMonth, value);
        }

        public int ActiveYear
        {
            get => _activeYear;
            set => SetField(ref _activeYear, value);
        }

        public MonthlyTrackerViewModel(int year, int month)
        {
            _activeYear = year;
            _activeMonth = month;
            DailyRecords = new ObservableCollection<DailyWorkRecord>();

            // Listen to collection changes to wire/unwire property listeners
            DailyRecords.CollectionChanged += OnDailyRecordsCollectionChanged;
        }

        private void OnDailyRecordsCollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
        {
            if (e.NewItems != null)
            {
                foreach (DailyWorkRecord item in e.NewItems)
                {
                    item.PropertyChanged += OnRecordPropertyChanged;
                }
            }

            if (e.OldItems != null)
            {
                foreach (DailyWorkRecord item in e.OldItems)
                {
                    item.PropertyChanged -= OnRecordPropertyChanged;
                }
            }

            RecalculateMonthlyTotal();
        }

        private void OnRecordPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            // Cascade update: Recalculate monthly total immediately when a daily OT value changes
            if (e.PropertyName == nameof(DailyWorkRecord.DailyOt))
            {
                RecalculateMonthlyTotal();
            }
        }

        /// <summary>
        /// Performs an in-memory optimized summation of all daily overtime.
        /// Tính toán tổng cộng số giờ OT trong tháng một cách tối ưu trong bộ nhớ.
        /// </summary>
        public void RecalculateMonthlyTotal()
        {
            double totalHours = DailyRecords.Sum(r => r.DailyOt.TotalHours);
            TotalMonthlyOt = TimeSpan.FromHours(totalHours);
        }

        /// <summary>
        /// Populates dummy/initial data for demonstration and testing.
        /// Nạp dữ liệu giả lập ban đầu để kiểm thử.
        /// </summary>
        public void PopulateMonthData()
        {
            DailyRecords.Clear();
            int daysInMonth = DateTime.DaysInMonth(ActiveYear, ActiveMonth);

            for (int i = 1; i <= daysInMonth; i++)
            {
                var date = new DateTime(ActiveYear, ActiveMonth, i);
                
                // Mẫu dữ liệu: mặc định vào ca 08:00, tan ca 17:30 (Chưa có OT)
                var record = new DailyWorkRecord(date, TimeSpan.FromHours(8), TimeSpan.FromHours(17.5));
                
                // Cho một số ngày ngẫu nhiên làm OT
                if (i % 5 == 0) // Ngày 5, 10, 15, 20, 25, 30
                {
                    record.EndTime = TimeSpan.FromHours(20.5); // Tan lúc 20:30 (OT 3 tiếng)
                    record.BreakTime = TimeSpan.FromMinutes(30); // Nghỉ ăn tối 30 phút -> OT thực tế = 2.5 tiếng
                }

                DailyRecords.Add(record);
            }
        }
    }
}
