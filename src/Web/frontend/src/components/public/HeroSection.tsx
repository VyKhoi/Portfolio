import { motion } from 'framer-motion';
import { Badge } from "../ui/Badge";
import { Download } from "lucide-react";
import { useCachedContent } from "../../lib/contentCache";

const DEFAULT_PROFILE = {
  fullName: "ĐẶNG VỸ KHÔI",
  title: "Software Engineer | .NET Backend",
  bio: "Kỹ sư phần mềm với hơn 2 năm kinh nghiệm xây dựng các hệ thống SaaS tại Tập đoàn Masan (Masan Group), chuyên sâu về .NET 9, C#, PostgreSQL và kiến trúc hệ thống ổn định.",
  avatarKey: "/profile.jpg",
  cvPdfKey: "/cv.pdf",
  githubLink: "https://github.com/vykhoi",
  linkedinLink: "https://linkedin.com/in/vykhoi"
};

export function HeroSection() {
  const profile = useCachedContent<any>(
    'profile',
    DEFAULT_PROFILE,
    data => Boolean(data && data.fullName),
  );

  const nameParts = (profile?.fullName || "ĐẶNG VỸ KHÔI").trim().split(' ');
  const firstName = nameParts[0] || "ĐẶNG";
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : (nameParts[1] || "VỸ");
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "KHÔI";

  return (
    <section className="relative min-h-dvh pt-16 lg:pt-20 flex items-center bg-obsidian overflow-hidden border-b border-border">
      
      {/* Geometric Background Lines (hidden on narrow mobile screens so they don't slice through text) */}
      <div className="hidden lg:block absolute top-0 bottom-0 left-[10%] w-[1px] bg-border z-0" />
      <div className="hidden lg:block absolute top-0 bottom-0 right-[10%] w-[1px] bg-border z-0" />
      <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-[1px] bg-border z-0" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-0 grid lg:grid-cols-12 gap-8 lg:gap-8 items-center relative z-10">
        
        {/* Left: Oversized Typography Content (7 cols) */}
        <motion.div 
          initial={{ opacity: 1, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="lg:col-span-7 flex flex-col items-start space-y-6 lg:space-y-8 lg:py-12"
        >
          <div className="space-y-3 sm:space-y-4">
            <Badge className="mb-2 sm:mb-4">SYSTEM ARCHITECT</Badge>
            
            <h1 className="text-[2.75rem] sm:text-[4rem] md:text-[5rem] lg:text-[6.5rem] font-bold font-heading leading-[0.92] tracking-tighter text-text-main uppercase break-words">
              {firstName} {middleName} <br />
              <span className="text-outline-primary">{lastName}</span>
            </h1>
            <h2 className="text-sm sm:text-lg md:text-2xl font-mono text-primary tracking-widest uppercase pt-2">
              {profile.title}
            </h2>
          </div>
          
          <p className="text-base sm:text-lg md:text-xl text-text-muted font-sans max-w-xl leading-relaxed border-l-2 border-primary pl-4">
            {profile.bio}
          </p>
          
          <div className="grid grid-cols-2 gap-3 w-full max-w-lg font-mono text-xs text-text-muted">
            <a href={profile.githubLink} target="_blank" rel="noreferrer" className="flex items-center justify-center space-x-2 border border-border p-3 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all">
              <span>GITHUB</span>
            </a>
            <a href={profile.linkedinLink} target="_blank" rel="noreferrer" className="flex items-center justify-center space-x-2 border border-border p-3 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all">
              <span>LINKEDIN</span>
            </a>
            <a href={profile.cvPdfKey} target="_blank" rel="noreferrer" className="col-span-2 flex items-center justify-center space-x-2 bg-surface text-primary border border-primary p-3.5 font-bold hover:bg-primary hover:text-obsidian transition-colors">
              <Download className="w-4 h-4" /> <span>DOWNLOAD CV</span>
            </a>
          </div>
        </motion.div>

        {/* Right: Offset Frame Profile Image (5 cols) */}
        <motion.div
          initial={{ opacity: 1, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="lg:col-span-5 relative flex justify-center lg:justify-end items-center py-4 pb-8 lg:py-0 lg:h-full"
        >
          {/* Geometric offset frame */}
          <div className="absolute w-full max-w-[270px] sm:max-w-[320px] md:max-w-[400px] aspect-[3/4] border-2 border-primary translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 z-0 mx-auto lg:mr-4" />
          
          {/* Main Image Container */}
          <div className="relative w-full max-w-[270px] sm:max-w-[320px] md:max-w-[400px] aspect-[3/4] z-10 bg-surface overflow-hidden group mx-auto lg:mr-4">
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-20 group-hover:bg-transparent transition-colors duration-500" />
            <img 
              src={profile.avatarKey === "/profile.jpg" ? "/profile.jpg?v=2" : profile.avatarKey} 
              alt="Đặng Vỹ Khôi - Software Engineer (.NET Backend)" 
              width={400}
              height={533}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
            />
            {/* Overlay Corner Accents */}
            <div className="absolute top-0 left-0 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-l-4 border-primary z-30" />
            <div className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-r-4 border-primary z-30" />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
