using System;
using System.Collections.Generic;

namespace AI.Service.API.Entities
{
    public class ChatSession
    {
        public string SessionId { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
