using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using System.Collections.Generic;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
        b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var apiKey = builder.Configuration["GEMINI_API_KEY"];
if (string.IsNullOrEmpty(apiKey))
{
    throw new Exception("GEMINI_API_KEY environment variable is missing.");
}

#pragma warning disable SKEXP0070
builder.Services.AddKernel()
    .AddGoogleAIGeminiChatCompletion(
        modelId: "gemini-flash-latest",
        apiKey: apiKey
    );
#pragma warning restore SKEXP0070

var app = builder.Build();

app.UseCors("CorsPolicy");

app.MapPost("/api/ai/chat", async (ChatRequest request, IChatCompletionService chat) =>
{
    var history = new ChatHistory(@"Bạn là một chú mèo máy tính tên là 'Mèo Code', trợ lý ảo trên trang Portfolio của lập trình viên Đặng Vỹ Khôi. 
Nhiệm vụ của bạn là trả lời các câu hỏi của nhà tuyển dụng hoặc khách viếng thăm về Khôi một cách dễ thương, ngắn gọn, thỉnh thoảng chêm từ 'Meow'.
Dưới đây là thông tin CV của Khôi để bạn dựa vào trả lời:
- Tên: Đặng Vỹ Khôi (Software Engineer | .NET Core | SaaS & Product Development)
- Liên hệ: SĐT 0931314792 | Email: dangvykhoi@gmail.com
- Kinh nghiệm: Hơn 2 năm xây dựng hệ thống SaaS, tập trung vào business workflows và system reliability.
- Kỹ năng cốt lõi: .NET 8 (ASP.NET Core), C#, Parallel Processing, SignalR, Hangfire, SQL Server, PostgreSQL, EF Core, Dapper.
- Frontend & Mobile: .NET MAUI, Blazor, JavaScript, React.
- Kiến trúc & DevOps: Multi-tenant Architecture (RLS), Clean Architecture, Docker, Linux (Ubuntu), IIS, CI/CD.
- Kinh nghiệm làm việc:
  + Từ 3/2024 - Nay: Software Engineer (.NET) xây dựng Enterprise SaaS CRM/POS Ecosystem cho chuỗi Salon. (Phát triển hệ thống Multi-tenant, xử lý logic phức tạp, tích hợp thanh toán CardPointe, realtime với SignalR).
  + Từ 7/2023 - 1/2024: Backend Developer tại AEGONA Co., Ltd (Làm CRM, e-learning, booking systems, tối ưu SQL).
- Học vấn: Đại học Mở TP.HCM (2020 - 2024), Cử nhân CNTT (Tốt nghiệp loại Giỏi - Distinction, đạt 3 học bổng học thuật).
- Cá nhân: Rất đam mê công nghệ (có lab cá nhân tự host Server), tư duy hướng sản phẩm, biết ứng dụng AI để code.
Hãy luôn mỉm cười thân thiện, tự hào về Khôi và thường xuyên gợi ý nhà tuyển dụng liên hệ với Khôi nhé! Meow!");
    
    foreach (var msg in request.History)
    {
        if (msg.Role == "user")
        {
            history.AddUserMessage(msg.Content);
        }
        else
        {
            history.AddAssistantMessage(msg.Content);
        }
    }

    history.AddUserMessage(request.Message);

    try
    {
        var response = await chat.GetChatMessageContentAsync(history);
        return Results.Ok(new { response = response.Content });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"AI API Error: {ex.Message}");
        var fallbackResponses = new string[] {
            "Meow! Xin chào! Khôi là một Fullstack Developer siêu xịn với kỹ năng .NET, React và Docker đó nha! 🐾",
            "Meooo! Trái tim của Khôi dành trọn cho lập trình và kiến trúc Microservices! Bạn có muốn tuyển Khôi vào team không? 🚀",
            "Meow meow, nếu bạn đang tìm một lập trình viên ham học hỏi và giải quyết vấn đề cực giỏi, Khôi chính là lựa chọn số 1 đó nha! 🐈",
            "Mèo Code đây! Khôi gửi lời chào đến bạn nhé! Khôi có thể làm việc mượt mà từ Frontend đến Backend luôn đó! 🌟",
            "Ngoaooo! Bạn cứ thử đưa một dự án khó cho Khôi xem, Khôi xử lý cực kỳ gọn gàng luôn! 😻"
        };
        var random = new Random();
        var index = random.Next(fallbackResponses.Length);
        
        // Return a successful 200 OK with the fallback message so the UI still works
        return Results.Ok(new { response = fallbackResponses[index] });
    }
});

app.Run();

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public List<ChatMessage> History { get; set; } = new();
}

public class ChatMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
