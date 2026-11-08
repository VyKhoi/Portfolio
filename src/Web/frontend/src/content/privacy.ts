// Privacy policy text (Personal Data Protection Law 91/2025/QH15). Keep it in line with the backend:
// DataRetentionWorker (chat 90 days, contact 12 months), ContactController (consent), notification workers (no visitor content).
export const PRIVACY = {
  vi: {
    title: 'Chính sách quyền riêng tư',
    description: 'Trang dangvykhoi.com thu thập dữ liệu gì, để làm gì, giữ bao lâu và cách yêu cầu xoá.',
    updated: 'Cập nhật: 08/11/2026',
    intro:
      'dangvykhoi.com là trang cá nhân của Đặng Vỹ Khôi. Trang chỉ thu những gì cần để trả lời bạn, không quảng cáo, không bán hay chia sẻ dữ liệu cho ai.',
    sections: [
      {
        title: 'Form liên hệ',
        items: [
          'Thu: họ tên, email, nội dung tin nhắn và thời điểm bạn đồng ý.',
          'Để làm gì: đọc và trả lời bạn.',
          'Giữ bao lâu: tối đa 12 tháng, sau đó tự xoá.',
        ],
      },
      {
        title: 'Chat với Sigma Cat',
        items: [
          'Sigma Cat là trợ lý AI, không phải người thật. Câu trả lời do máy tạo ra và có thể sai.',
          'Thu: nội dung bạn hỏi, câu trả lời và một mã phiên ngẫu nhiên lưu trong trình duyệt của bạn.',
          'Để làm gì: trả lời bạn và xem lại để làm trợ lý tốt hơn.',
          'AI chạy trên máy chủ riêng của Khôi, không gửi câu hỏi cho công ty AI nào.',
          'Giữ bao lâu: 90 ngày, sau đó tự xoá. Đừng gửi thông tin nhạy cảm (CCCD, tài khoản ngân hàng, sức khoẻ...).',
        ],
      },
      {
        title: 'Dữ liệu kỹ thuật',
        items: [
          'Địa chỉ IP chỉ được giữ tạm trong bộ nhớ để chống spam. Nhật ký máy chủ có IP và tự xoay vòng sau vài ngày.',
          'Trình duyệt của bạn lưu mã phiên chat và bản sao nội dung trang để tải nhanh hơn. Không có cookie theo dõi, không Google Analytics.',
          'Cơ sở dữ liệu được sao lưu để phòng sự cố, mỗi bản giữ tối đa 14 ngày. Dữ liệu đã xoá còn trong bản sao lưu tới khi bản đó hết hạn.',
        ],
      },
      {
        title: 'Dữ liệu đi qua đâu',
        items: [
          'Máy chủ đặt tại Việt Nam. Truy cập đi qua Cloudflare để bảo vệ và tăng tốc trang.',
          'Khi có tin mới, Khôi nhận thông báo qua email và Telegram. Thông báo chỉ báo là có tin, không kèm tên, email hay nội dung của bạn.',
        ],
      },
      {
        title: 'Quyền của bạn',
        items: [
          'Bạn có quyền xem, sửa, xoá dữ liệu của mình hoặc rút lại đồng ý bất cứ lúc nào.',
          'Gửi email tới dangvykhoi@gmail.com, kèm email bạn đã dùng hoặc nội dung đã chat để Khôi tìm đúng. Khôi xử lý trong vòng 72 giờ.',
          'Nếu bạn dưới 16 tuổi, hãy hỏi cha mẹ trước khi gửi thông tin.',
        ],
      },
    ],
    contact: 'Người chịu trách nhiệm: Đặng Vỹ Khôi · dangvykhoi@gmail.com',
    back: '← Về trang chủ',
    switchLabel: 'English',
  },
  en: {
    title: 'Privacy Policy',
    description: 'What dangvykhoi.com collects, why, how long it is kept and how to ask for deletion.',
    updated: 'Updated: 8 November 2026',
    intro:
      "dangvykhoi.com is Dang Vy Khoi's personal website. It only collects what it needs to reply to you. No ads, and your data is never sold or shared.",
    sections: [
      {
        title: 'Contact form',
        items: [
          'Collected: your name, email, message and the time you gave consent.',
          'Why: to read and reply to you.',
          'Kept: up to 12 months, then deleted automatically.',
        ],
      },
      {
        title: 'Chat with Sigma Cat',
        items: [
          'Sigma Cat is an AI assistant, not a person. Its replies are machine-generated and can be wrong.',
          'Collected: your questions, the replies and a random session ID stored in your browser.',
          'Why: to answer you and to review conversations so the assistant gets better.',
          "The AI runs on Khoi's own server. Your questions are not sent to any AI company.",
          'Kept: 90 days, then deleted automatically. Please do not share sensitive information (ID numbers, bank details, health...).',
        ],
      },
      {
        title: 'Technical data',
        items: [
          'Your IP address is only held in memory to stop spam. Server logs include IP addresses and rotate out after a few days.',
          'Your browser stores the chat session ID and a copy of the page content so the site loads faster. No tracking cookies, no Google Analytics.',
          'The database is backed up in case of failure, and each backup is kept for at most 14 days. Deleted data stays in a backup until that backup expires.',
        ],
      },
      {
        title: 'Where data goes',
        items: [
          'The server is in Vietnam. Traffic passes through Cloudflare for protection and speed.',
          'When a new message arrives, Khoi gets an email and a Telegram notice. They only say there is a new message, without your name, email or words.',
        ],
      },
      {
        title: 'Your rights',
        items: [
          'You can ask to see, correct or delete your data, or withdraw consent, at any time.',
          'Email dangvykhoi@gmail.com with the email you used or what you chatted about so Khoi can find it. Requests are handled within 72 hours.',
          'If you are under 16, please ask a parent before sending your information.',
        ],
      },
    ],
    contact: 'Data controller: Dang Vy Khoi · dangvykhoi@gmail.com',
    back: '← Back to home',
    switchLabel: 'Tiếng Việt',
  },
} as const;

export const PRIVACY_PATH = { vi: '/vi/privacy', en: '/privacy' } as const;
