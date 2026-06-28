using System;
using System.Linq;
using OvertimeTracker.Core;

namespace OvertimeTracker.ConsoleApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.WriteLine("=== CHƯƠNG TRÌNH KIỂM THỬ TỰ ĐỘNG TÍNH TOÁN OVERTIME (C#) ===");

            // 1. Khởi tạo Monthly Tracker cho Tháng 6 năm 2026
            var tracker = new MonthlyTrackerViewModel(2026, 6);
            tracker.PopulateMonthData();

            Console.WriteLine($"\nĐã tạo danh sách tháng với {tracker.DailyRecords.Count} ngày.");
            Console.WriteLine($"Tổng OT ban đầu của tháng: {tracker.TotalMonthlyOt.TotalHours} giờ.");

            // Đăng ký sự kiện thay đổi tổng giờ OT tháng để kiểm tra UI Refresh
            tracker.PropertyChanged += (s, e) =>
            {
                if (e.PropertyName == nameof(MonthlyTrackerViewModel.TotalMonthlyOt))
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"[UI REFRESH - EVENT] Tổng OT tháng thay đổi thành: {tracker.TotalMonthlyOt.TotalHours} giờ.");
                    Console.ResetColor();
                }
            };

            // 2. Chạy thử các trường hợp kiểm thử (Test Cases)
            Console.WriteLine("\n--- KIỂM TRA LOGIC TÍNH TOÁN NGÀY LẺ (DAILY OT) ---");

            // Test Case 1: OT bình thường (Tan ca 20:30, chuẩn 17:30, nghỉ 30 phút -> OT = 2.5h)
            var record1 = tracker.DailyRecords.First(r => r.Date.Day == 1);
            Console.WriteLine($"\n[Ngày 01]: Giờ vào: {record1.StartTime}, Giờ ra (mặc định): {record1.EndTime}");
            Console.WriteLine($"Thay đổi Giờ Ra của Ngày 1 thành 20:30...");
            record1.EndTime = TimeSpan.FromHours(20.5); // 20:30
            record1.BreakTime = TimeSpan.FromMinutes(30); // Nghỉ 30 phút
            Console.WriteLine($"=> Giờ OT Ngày 1 tính được: {record1.DailyOt.TotalHours} giờ. (Kỳ vọng: 2.5 giờ)");

            // Test Case 2: Ca qua đêm (Midnight Crossing) (Vào 22:00, Ra 06:00 sáng hôm sau, chuẩn 17:30 (không tính ca chiều), nghỉ 1h)
            var record2 = tracker.DailyRecords.First(r => r.Date.Day == 2);
            Console.WriteLine($"\n[Ngày 02]: Đặt ca qua đêm: Vào 22:00, Ra 06:00 sáng hôm sau");
            record2.StartTime = TimeSpan.FromHours(22);
            record2.EndTime = TimeSpan.FromHours(6);
            record2.StandardEndTime = TimeSpan.FromHours(17.5); // Giờ chuẩn của ca thường
            record2.BreakTime = TimeSpan.FromHours(1); // Nghỉ 1h
            // Giờ ra thực tế sau khi điều chỉnh ca đêm là 06:00 + 24h = 30h. 
            // OT = 30h - 17.5h - 1h = 11.5h
            Console.WriteLine($"=> Giờ OT Ngày 2 tính được: {record2.DailyOt.TotalHours} giờ. (Kỳ vọng: 11.5 giờ)");

            // Test Case 3: Về sớm hoặc đúng giờ chuẩn (Không có OT)
            var record3 = tracker.DailyRecords.First(r => r.Date.Day == 3);
            Console.WriteLine($"\n[Ngày 03]: Tan lúc 17:00 (Sớm hơn giờ chuẩn 17:30)");
            record3.EndTime = TimeSpan.FromHours(17);
            Console.WriteLine($"=> Giờ OT Ngày 3 tính được: {record3.DailyOt.TotalHours} giờ. (Kỳ vọng: 0 giờ)");

            // Test Case 4: Kiểm tra dữ liệu đầu vào không hợp lệ (Validation Error)
            var record4 = tracker.DailyRecords.First(r => r.Date.Day == 4);
            Console.WriteLine($"\n[Ngày 04]: Nhập giờ ra âm (-2:00) hoặc vượt quá 24h (25:00)");
            record4.EndTime = TimeSpan.FromHours(-2);
            Console.WriteLine($"=> Trạng thái lỗi Validation: {record4.Error}");
            Console.WriteLine($"=> Giờ OT Ngày 4 sau khi lỗi: {record4.DailyOt.TotalHours} giờ (Bị khóa về 0 khi có lỗi)");

            // Reset về hợp lệ
            record4.EndTime = TimeSpan.FromHours(18.5); // 18:30 (OT 1h)
            Console.WriteLine($"=> Sửa lại giờ ra hợp lệ (18:30): Lỗi: '{record4.Error}', OT: {record4.DailyOt.TotalHours} giờ.");

            // Test Case 5: Ngày Chủ Nhật (OT tính từ đầu, trừ 1h ăn trưa, và trừ thêm 30p nghỉ nếu StandardEndTime = 17:30 và checkout >= 17:30)
            var record5 = tracker.DailyRecords.First(r => r.Date.Day == 7); // Ngày 7 là Chủ Nhật
            Console.WriteLine($"\n[Ngày 07 - Chủ Nhật]: Vào: 08:00, Ra: 17:30, Giờ chuẩn cài đặt: 17:30");
            record5.StartTime = TimeSpan.FromHours(8);
            record5.EndTime = TimeSpan.FromHours(17.5); // 17:30
            record5.StandardEndTime = TimeSpan.FromHours(17.5); // Giờ chuẩn 17:30
            // Tổng giờ: 9.5h. Trừ 1h ăn trưa (08:00 < 12:00 và 17:30 >= 13:00) -> 8.5h.
            // Trừ thêm 30p vì StandardEndTime = 17:30 và checkout >= 17:30 -> 8.0h.
            Console.WriteLine($"=> Giờ OT Chủ Nhật tính được: {record5.DailyOt.TotalHours} giờ. (Kỳ vọng: 8.0 giờ)");

            Console.WriteLine("\n--- KẾT THÚC KIỂM THỬ ---");
            Console.WriteLine($"Tổng OT cuối cùng trong tháng: {tracker.TotalMonthlyOt.TotalHours} giờ.");
            Console.ReadLine();
        }
    }
}
