// Personal products shown in the Projects section and on /projects/<slug> (+ /vi/projects/<slug>).
// Only things Khoi builds and runs himself. Tell the idea, not the tech stack.
// Adding a slug: also add it to nginx.conf (projects location). The sitemap is built from this list.
import type { Lang } from '../lib/i18n'

export interface ProjectSection {
  title: string
  text?: string
  points?: string[]
}

export interface ProjectCopy {
  name: string
  kind: string
  summary: string
  tagline: string
  role: string
  linkLabel: string
  sections: ProjectSection[]
  seoTitle: string
  seoDescription: string
  imageAlt: string
}

export interface Project {
  slug: string
  year: string
  url: Record<Lang, string>
  // Screenshots: 1200px for the project page, 800px for the home cards. Bump ?v= when a file changes (served with a 30-day cache)
  image: Record<Lang, string>
  thumb: Record<Lang, string>
  ogImage: Record<Lang, string>
  // schema.org type of the product itself, for the project page JSON-LD
  schemaType: 'WebApplication' | 'WebSite'
  copy: Record<Lang, ProjectCopy>
}

export const PROJECTS: Project[] = [
  {
    slug: 'chickennote',
    year: '2026',
    url: { en: 'https://note.dangvykhoi.com/en', vi: 'https://note.dangvykhoi.com/' },
    image: { en: '/projects/chickennote-en.webp?v=1', vi: '/projects/chickennote-vi.webp?v=1' },
    thumb: { en: '/projects/chickennote-en-800.webp?v=1', vi: '/projects/chickennote-vi-800.webp?v=1' },
    schemaType: 'WebApplication',
    ogImage: { en: '/projects/chickennote-en-og.jpg', vi: '/projects/chickennote-vi-og.jpg' },
    copy: {
      en: {
        name: 'ChickenNote',
        kind: 'Online notepad',
        summary: 'Online notes with no account. Pick a name, type, and the same page shows up on every device that opens that name.',
        tagline: 'A note page you open by name. Type on your computer, and it is already on your phone.',
        role: 'Idea, product decisions, testing, running it. AI wrote most of the code.',
        linkLabel: 'Open ChickenNote',
        sections: [
          {
            title: 'The problem',
            text: 'Moving a bit of text between my computer and my phone was always clumsy: a link, a log line, a screenshot. I would message it to myself, or sign in to some app first. I wanted something I could open in two seconds on any device, without signing up.',
          },
          {
            title: 'The idea',
            text: 'Every note page has a name. Open note.dangvykhoi.com/your-name, type, and anyone who opens the same name sees the same page, live. No account, no email. If the page matters, put a password on it.',
            points: [
              'Keeps working when the connection drops, and syncs once it is back.',
              'Several people can edit the same page at once, even draw on it together.',
              'Share a single page with its own link, read-only or editable, without giving away the name.',
              'Locked groups are encrypted on your device, so the server never sees that text.',
              'Notes never show up on Google.',
            ],
          },
          {
            title: 'How it was made',
            text: 'Honestly: vibe coded. I described what I wanted, AI wrote most of the code, and I tested it, pushed back and decided what stays. My part is the idea, the small details, and keeping it running on my own server at home.',
          },
          {
            title: 'What I learned',
            points: [
              'The small things take the longest: undo, pasting, two phones typing at the same time.',
              'Free and open to everyone means setting limits from day one: 30 MB per name, and pages nobody opens for 90 days get cleaned up.',
              'AI types fast, but deciding what to build and checking that it really works is still my job.',
            ],
          },
        ],
        seoTitle: 'ChickenNote, an online notepad with no account | Dang Vy Khoi',
        seoDescription: 'ChickenNote is a free online notepad by Dang Vy Khoi: pick a name, type, and the page syncs live between your computer and phone. The idea and how it was made.',
        imageAlt: 'ChickenNote home page: a free online notepad for your computer and phone',
      },
      vi: {
        name: 'ChickenNote',
        kind: 'Ghi chú online',
        summary: 'Ghi chú online không cần tài khoản. Đặt một cái tên, gõ, và mọi thiết bị mở cùng tên đó đều thấy cùng một trang.',
        tagline: 'Trang ghi chú mở bằng một cái tên. Gõ trên máy tính, mở điện thoại là đã thấy.',
        role: 'Ý tưởng, quyết định sản phẩm, test và vận hành. Phần lớn code do AI viết.',
        linkLabel: 'Mở ChickenNote',
        sections: [
          {
            title: 'Vấn đề',
            text: 'Chuyển một chút chữ giữa máy tính và điện thoại lúc nào cũng lỉnh kỉnh: một cái link, một dòng log, một tấm ảnh chụp màn hình. Tôi hay phải nhắn cho chính mình, hoặc đăng nhập vào app nào đó trước. Tôi muốn một thứ mở lên trong hai giây, ở máy nào cũng được, không cần đăng ký.',
          },
          {
            title: 'Ý tưởng',
            text: 'Mỗi trang ghi chú có một cái tên. Mở note.dangvykhoi.com/ten-cua-ban, gõ, và ai mở cùng tên sẽ thấy cùng trang đó ngay lập tức. Không tài khoản, không email. Trang nào quan trọng thì đặt mật khẩu.',
            points: [
              'Mất mạng vẫn dùng được, có mạng lại thì tự đồng bộ.',
              'Nhiều người sửa cùng một trang một lúc, vẽ chung cũng được.',
              'Chia sẻ riêng một trang bằng link riêng, chỉ xem hoặc được sửa, không lộ cái tên.',
              'Nhóm note có khoá được mã hoá ngay trên máy bạn, máy chủ không bao giờ đọc được.',
              'Ghi chú không bao giờ lên Google.',
            ],
          },
          {
            title: 'Cách làm',
            text: 'Nói thẳng: vibe code. Tôi mô tả thứ mình muốn, AI viết phần lớn code, còn tôi test, cãi lại và quyết định cái gì được giữ. Phần của tôi là ý tưởng, các chi tiết nhỏ và giữ nó chạy ổn trên máy chủ tự dựng ở nhà.',
          },
          {
            title: 'Điều rút ra',
            points: [
              'Mấy thứ nhỏ lại tốn công nhất: hoàn tác, dán nội dung, hai điện thoại cùng gõ một lúc.',
              'Miễn phí và mở cho mọi người thì phải đặt giới hạn ngay từ đầu: mỗi tên 30 MB, trang 90 ngày không ai mở sẽ được dọn.',
              'AI gõ code rất nhanh, nhưng quyết định làm gì và kiểm tra nó chạy đúng vẫn là việc của tôi.',
            ],
          },
        ],
        seoTitle: 'ChickenNote, ghi chú online không cần tài khoản | Đặng Vỹ Khôi',
        seoDescription: 'ChickenNote là trang ghi chú online miễn phí do Đặng Vỹ Khôi làm: đặt một cái tên, gõ, và trang đồng bộ ngay giữa máy tính với điện thoại. Ý tưởng và cách làm.',
        imageAlt: 'Trang chủ ChickenNote: ghi chú online miễn phí cho máy tính và điện thoại',
      },
    },
  },
  {
    slug: 'dangvykhoi-com',
    year: '2026',
    url: { en: 'https://dangvykhoi.com/', vi: 'https://dangvykhoi.com/vi' },
    image: { en: '/projects/dangvykhoi-com-en.webp?v=1', vi: '/projects/dangvykhoi-com-vi.webp?v=1' },
    thumb: { en: '/projects/dangvykhoi-com-en-800.webp?v=1', vi: '/projects/dangvykhoi-com-vi-800.webp?v=1' },
    schemaType: 'WebSite',
    ogImage: { en: '/projects/dangvykhoi-com-en-og.jpg', vi: '/projects/dangvykhoi-com-vi-og.jpg' },
    copy: {
      en: {
        name: 'dangvykhoi.com',
        kind: 'This website',
        summary: 'This site. A CV you can ask questions, with an assistant cat, running on an old laptop at my home.',
        tagline: 'My CV as a website, with a cat that answers questions about me.',
        role: 'Everything: idea, content, keeping it running. Built with AI help.',
        linkLabel: 'Back to the home page',
        sections: [
          {
            title: 'The problem',
            text: 'A PDF CV tells everyone the same thing and cannot answer a single question. I wanted one place that shows what I do, in English and Vietnamese, and that I fully own.',
          },
          {
            title: 'The idea',
            points: [
              'Sigma Cat: an assistant cat with its own personality, a bit sigma. It answers questions about me at any hour. It is my assistant, not me.',
              'It runs on a small AI model on my own machine instead of a paid AI service, so there is no bill per question.',
              'The whole site lives on an old laptop at home, next to ChickenNote. I push a change and it deploys itself.',
              'Everything written here can be changed from a small admin page, without touching code.',
            ],
          },
          {
            title: 'How it was made',
            text: 'Same as ChickenNote: AI did a lot of the typing. I decide what goes in, write the content, test it, and keep the server alive.',
          },
          {
            title: 'What I learned',
            points: [
              'Hosting at home shows you what the cloud hides: containers that do not come back after a restart, a disk slowly filling up with old builds.',
              'A small model on a 2 GB graphics card is enough for a friendly assistant, as long as it only talks about one topic.',
              'Every feature is one more thing to keep running, so I keep only a few.',
            ],
          },
        ],
        seoTitle: 'dangvykhoi.com, a CV with an AI assistant cat | Dang Vy Khoi',
        seoDescription: 'How Dang Vy Khoi built his personal site: a bilingual CV with Sigma Cat, a local AI assistant, hosted on an old laptop at home.',
        imageAlt: 'Home page of dangvykhoi.com with the Sigma Cat chat bubble',
      },
      vi: {
        name: 'dangvykhoi.com',
        kind: 'Chính trang này',
        summary: 'Chính trang này. Một bản CV hỏi được, có mèo trợ lý, chạy trên chiếc laptop cũ ở nhà tôi.',
        tagline: 'CV của tôi dưới dạng website, kèm một con mèo trả lời câu hỏi về tôi.',
        role: 'Tất cả: ý tưởng, nội dung, vận hành. Có AI phụ code.',
        linkLabel: 'Về trang chủ',
        sections: [
          {
            title: 'Vấn đề',
            text: 'CV dạng PDF nói với ai cũng y như nhau và không trả lời được câu hỏi nào. Tôi muốn một chỗ cho thấy tôi làm gì, có cả tiếng Anh lẫn tiếng Việt, và hoàn toàn do tôi nắm.',
          },
          {
            title: 'Ý tưởng',
            points: [
              'Sigma Cat: mèo trợ lý có tính cách riêng, hơi sigma. Nó trả lời câu hỏi về tôi bất kể giờ nào. Nó là trợ lý của tôi, không phải tôi.',
              'Nó chạy bằng một model AI nhỏ trên máy của tôi chứ không thuê dịch vụ AI trả phí, nên hỏi bao nhiêu cũng không tốn tiền.',
              'Cả trang nằm trên một chiếc laptop cũ ở nhà, cạnh ChickenNote. Tôi đẩy code lên là nó tự triển khai.',
              'Mọi chữ trên trang sửa được từ một trang quản trị nhỏ, không cần đụng code.',
            ],
          },
          {
            title: 'Cách làm',
            text: 'Giống ChickenNote: AI gõ phần lớn code. Tôi quyết định cái gì được đưa vào, viết nội dung, test và giữ cho máy chủ sống.',
          },
          {
            title: 'Điều rút ra',
            points: [
              'Tự host ở nhà mới thấy những thứ cloud giấu đi: container không tự chạy lại sau khi khởi động máy, ổ đĩa đầy dần vì các bản build cũ.',
              'Một model nhỏ trên card đồ hoạ 2 GB là đủ cho một trợ lý thân thiện, miễn là nó chỉ nói về một chủ đề.',
              'Mỗi tính năng thêm vào là thêm một thứ phải giữ cho chạy, nên tôi giữ ít thôi.',
            ],
          },
        ],
        seoTitle: 'dangvykhoi.com, CV có mèo trợ lý AI | Đặng Vỹ Khôi',
        seoDescription: 'Cách Đặng Vỹ Khôi làm website cá nhân: CV song ngữ có Sigma Cat, trợ lý AI chạy local, tự host trên laptop cũ ở nhà.',
        imageAlt: 'Trang chủ dangvykhoi.com với bong bóng chat Sigma Cat',
      },
    },
  },
]

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug)

export function projectPath(slug: string, lang: Lang) {
  return `${lang === 'vi' ? '/vi' : ''}/projects/${slug}`
}

export function findProject(slug: string | undefined) {
  return PROJECTS.find((p) => p.slug === slug)
}
