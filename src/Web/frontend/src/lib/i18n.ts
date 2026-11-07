import { useLocation } from 'react-router-dom';

export type Lang = 'vi' | 'en';

export function useLang(): Lang {
  const { pathname } = useLocation();
  return pathname === '/vi' || pathname.startsWith('/vi/') ? 'vi' : 'en';
}

// Content rows carry both languages (bio / bioEn). Falls back to Vietnamese when the English field is empty.
export function pick<T = string>(item: any, key: string, lang: Lang): T {
  if (lang === 'en') {
    const en = item?.[`${key}En`];
    if (Array.isArray(en) ? en.length > 0 : en) return en;
  }
  return item?.[key];
}

export const STRINGS = {
  vi: {
    skipToContent: 'Bỏ qua, tới nội dung',
    nav: { about: 'GIỚI THIỆU', experience: 'KINH NGHIỆM', contact: 'LIÊN HỆ' },
    downloadCv: 'TẢI CV',
    switchLabel: 'Xem bản tiếng Anh',
    openMenu: 'Mở menu điều hướng',
    closeMenu: 'Đóng menu điều hướng',
    hello: 'Xin chào, tôi là',
    photoAlt: 'Ảnh chân dung Đặng Vỹ Khôi',
    education: 'Học Vấn',
    degree: 'Cử Nhân CNTT',
    school: 'Đại học Mở TP.HCM (2020-2024)',
    eduPoints: ['Tốt nghiệp loại Giỏi.', 'Đạt 3 học bổng khuyến khích học tập.'],
    mindset: 'Cách Làm Việc',
    mindsetItems: [
      {
        title: '01 // Dùng được là chính',
        text: 'Tôi quan tâm phần mềm có chạy ổn và giúp được người dùng hay không, hơn là dùng công nghệ gì.',
      },
      {
        title: '02 // Thích học thêm',
        text: 'Tôi hay tự làm những dự án nhỏ để thử và học thêm những thứ mới.',
      },
    ],
    skills: 'Kỹ Năng',
    skillCategories: {
      'Backend & Core': 'Backend',
      'Architecture & Sec': 'Kiến trúc & Bảo mật',
      Databases: 'Cơ sở dữ liệu',
      Frontend: 'Frontend',
      'DevOps & Cloud': 'DevOps',
    } as Record<string, string>,
    experienceTitle: 'Kinh Nghiệm',
    projectPrefix: 'DỰ ÁN',
    contactTitle: ['BẮT ĐẦU', 'DỰ ÁN', 'MỚI.'],
    contactIntro: 'Cần trao đổi về công việc hoặc dự án thì cứ nhắn tôi.',
    phone: 'Điện thoại',
    address: 'Địa chỉ',
    addressValue: 'Gò Vấp, TP.HCM',
    sendMessage: 'Gửi Tin Nhắn',
    fullName: 'Họ và Tên',
    message: 'Nội dung',
    sending: 'ĐANG GỬI...',
    sent: 'ĐÃ GỬI THÀNH CÔNG',
    send: 'GỬI TIN NHẮN',
    sentNote: 'Cảm ơn bạn, tôi sẽ trả lời sớm.',
    tooMany: 'Bạn vừa gửi tin nhắn rồi, vui lòng đợi một lát rồi gửi tiếp.',
    sendFailed: 'Gửi chưa được. Bạn thử lại sau hoặc gửi email trực tiếp giúp tôi nhé.',
    chat: {
      bubble: 'Hỏi gì về anh Khôi hong? Bấm vào em nè 😼',
      open: 'Mở chat với Sigma Cat',
      close: 'Đóng cửa sổ chat',
      subtitle: 'Trợ lý AI Local (Qwen3.5 4B)',
      hint: 'Gợi ý: Hỏi về kỹ năng, kinh nghiệm của anh Khôi! 😼',
      inputLabel: 'Nhập câu hỏi cho Sigma Cat',
      placeholder: 'Hỏi gì về anh Khôi...',
      cooling: 'Đang thở 3s...',
      send: 'Gửi tin nhắn',
      wait: 'Vui lòng đợi 3s',
    },
  },
  en: {
    skipToContent: 'Skip to content',
    nav: { about: 'ABOUT', experience: 'EXPERIENCE', contact: 'CONTACT' },
    downloadCv: 'DOWNLOAD CV',
    switchLabel: 'Xem bản tiếng Việt',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    hello: "Hi, I'm",
    photoAlt: 'Portrait of Dang Vy Khoi',
    education: 'Education',
    degree: 'B.Sc. in Information Technology',
    school: 'Ho Chi Minh City Open University (2020-2024)',
    eduPoints: ['Graduated with Distinction.', '3 academic scholarships.'],
    mindset: 'How I Work',
    mindsetItems: [
      {
        title: '01 // Useful first',
        text: 'I care more about software that runs well and helps people than about which technology it uses.',
      },
      {
        title: '02 // Always learning',
        text: 'I keep building small projects to try and learn new things.',
      },
    ],
    skills: 'Skills',
    skillCategories: {
      'Backend & Core': 'Backend',
      'Architecture & Sec': 'Architecture & Security',
      Databases: 'Databases',
      Frontend: 'Frontend',
      'DevOps & Cloud': 'DevOps',
    } as Record<string, string>,
    experienceTitle: 'Experience',
    projectPrefix: 'PROJECT',
    contactTitle: ['START', 'A NEW', 'PROJECT.'],
    contactIntro: 'Want to talk about work or a project? Just send me a message.',
    phone: 'Phone',
    address: 'Location',
    addressValue: 'Go Vap, Ho Chi Minh City',
    sendMessage: 'Send a Message',
    fullName: 'Full Name',
    message: 'Message',
    sending: 'SENDING...',
    sent: 'MESSAGE SENT',
    send: 'SEND MESSAGE',
    sentNote: "Thanks, I'll get back to you soon.",
    tooMany: 'You just sent a message. Please wait a moment before sending another.',
    sendFailed: "That didn't go through. Please try again later or email me directly.",
    chat: {
      bubble: 'Curious about Khoi? Click me 😼',
      open: 'Open chat with Sigma Cat',
      close: 'Close chat window',
      subtitle: 'Local AI assistant (Qwen3.5 4B)',
      hint: "Tip: ask about Khoi's skills or experience! 😼",
      inputLabel: 'Type a question for Sigma Cat',
      placeholder: 'Ask about Khoi...',
      cooling: 'Catching breath 3s...',
      send: 'Send message',
      wait: 'Please wait 3s',
    },
  },
};

export function useT() {
  return STRINGS[useLang()];
}
