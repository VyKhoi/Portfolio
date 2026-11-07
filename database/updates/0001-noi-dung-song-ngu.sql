-- Bilingual content: rewrites the profile text and every experience row.
UPDATE "Profiles" SET
  "Title" = 'Software Engineer | .NET Backend',
  "TitleEn" = 'Software Engineer | .NET Backend',
  "Bio" = 'Tôi là lập trình viên với 3 năm kinh nghiệm, chủ yếu làm việc với .NET. Ngoài công việc chính, tôi thích tự làm những sản phẩm nhỏ của riêng mình. Cảm ơn bạn đã ghé qua!',
  "BioEn" = 'I''m a software developer with 3 years of experience, working mostly with .NET. Outside my day job, I enjoy building small products of my own. Thanks for stopping by!';

DELETE FROM "Experiences";

INSERT INTO "Experiences"
  ("Id", "Role", "RoleEn", "Company", "CompanyEn", "Period", "PeriodEn", "ProjectName", "ProjectNameEn", "Highlights", "HighlightsEn", "TechStack", "Order")
VALUES
  (gen_random_uuid(), 'Software Engineer (.NET)', 'Software Engineer (.NET)', 'Masan Group', 'Masan Group', '05/2026 - Hiện tại', '05/2026 - Present', '', '',
   '{}'::text[],
   '{}'::text[],
   '{}'::text[], 1),
  (gen_random_uuid(), 'Software Engineer (.NET)', 'Software Engineer (.NET)', 'Team độc lập', 'Independent Team', '2024 - 2026', '2024 - 2026', 'CRM/POS cho chuỗi salon', 'CRM/POS for Salon Chains',
   ARRAY['Xây phần lõi nhiều tenant dùng chung cho POS, web và ứng dụng di động.', 'Viết API .NET 8 cho đặt lịch, thanh toán, tính lương và báo cáo bằng EF Core và Dapper.', 'Tách dữ liệu riêng cho hơn 100 chi nhánh bằng row-level security và JWT.', 'Tích hợp thanh toán CardPointe; tự động hoá tính lương, SMS và hoa hồng bằng Hangfire.', 'Đồng bộ thời gian thực giữa dashboard, kiosk và ứng dụng di động bằng SignalR.']::text[],
   ARRAY['Built the multi-tenant core shared by the POS, web and mobile apps.', 'Wrote .NET 8 APIs for booking, billing, payroll and reporting with EF Core and Dapper.', 'Kept tenant data separate across 100+ branches with row-level security and JWT auth.', 'Integrated CardPointe payments; automated payroll, SMS and commission jobs with Hangfire.', 'Synced dashboards, kiosks and mobile apps in real time with SignalR.']::text[],
   ARRAY['.NET 8', 'C#', 'EF Core', 'Dapper', 'SignalR', 'Hangfire', 'MAUI']::text[], 2),
  (gen_random_uuid(), 'Backend Developer', 'Backend Developer', 'AEGONA Co., Ltd', 'AEGONA Co., Ltd', '2023 - 2024', '2023 - 2024', 'Dự án outsourcing (CRM, e-learning)', 'Outsourcing Projects (CRM, e-learning)',
   ARRAY['Làm backend cho các hệ thống CRM, e-learning và đặt lịch bằng ASP.NET Core và SQL Server.', 'Hỗ trợ phát triển API và tích hợp dịch vụ trên cả hệ thống monolith và microservices.', 'Cùng team refactor code cũ phía server và tối ưu câu truy vấn SQL.']::text[],
   ARRAY['Worked on the backend of CRM, e-learning and booking systems with ASP.NET Core and SQL Server.', 'Supported API development and service integration on monolith and microservices systems.', 'Helped refactor legacy server code and speed up SQL queries.']::text[],
   ARRAY['ASP.NET Core', 'SQL Server', 'Microservices']::text[], 3),
  (gen_random_uuid(), 'Full-stack Developer', 'Full-stack Developer', 'Dự án cá nhân', 'Personal Project', '2026 - Hiện tại', '2026 - Present', 'ChickenNote', 'ChickenNote',
   ARRAY['Trang ghi chú online không cần tài khoản: mở một cái tên, gõ, và chữ đồng bộ ngay giữa điện thoại với máy tính.', 'Vẫn dùng được khi mất mạng và tự gộp thay đổi khi có mạng lại.', 'Backend Go, frontend JavaScript thuần.']::text[],
   ARRAY['Online notes with no account: open a name, type, and it syncs between phone and PC right away.', 'Keeps working offline and merges the changes when the connection is back.', 'Go backend and plain JavaScript frontend.']::text[],
   ARRAY['Go', 'JavaScript', 'SSE', 'Docker', 'Linux']::text[], 4);
