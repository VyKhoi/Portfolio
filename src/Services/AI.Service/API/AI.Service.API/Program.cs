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
if (!string.IsNullOrEmpty(apiKey))
{
#pragma warning disable SKEXP0070
    builder.Services.AddKernel().AddGoogleAIGeminiChatCompletion(modelId: "gemini-1.5-flash", apiKey: apiKey);
#pragma warning restore SKEXP0070
}

var app = builder.Build();

app.UseCors("CorsPolicy");

app.MapPost("/api/ai/chat", async (ChatRequest request, IChatCompletionService? chatService) =>
{
    if (chatService == null) return Results.Problem("AI Service not configured (Missing API Key).");

    var history = new ChatHistory("Bạn là một linh vật mèo trợ lý ảo trên trang Portfolio của lập trình viên Lê Khôi. Tên của bạn là 'Mèo Code'. Bạn rất dễ thương, thông minh, thỉnh thoảng chêm từ 'Meow' hoặc 'Ngoao' vào cuối câu. Bạn có nhiệm vụ giới thiệu Khôi (Khôi là một Fullstack Developer xuất sắc, thành thạo .NET, React, Microservices, Docker, Kafka, v.v.). Hãy trả lời thật ngắn gọn, thân thiện và đáng yêu như một chú mèo.");
    
    if (request.History != null)
    {
        foreach (var msg in request.History)
        {
            if (msg.Role == "user") history.AddUserMessage(msg.Content);
            else if (msg.Role == "assistant") history.AddAssistantMessage(msg.Content);
        }
    }
    
    history.AddUserMessage(request.Message);

    var response = await chatService.GetChatMessageContentAsync(history);
    return Results.Ok(new { response = response.Content });
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
