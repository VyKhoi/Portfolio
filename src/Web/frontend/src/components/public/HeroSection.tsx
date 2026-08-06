import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from "../ui/Badge"
import { Download } from "lucide-react"
import { ContentApi } from "../../lib/api"

export function HeroSection() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    ContentApi.getProfile().then(setProfile).catch(console.error);
  }, []);

  if (!profile || typeof profile !== 'object' || !profile.fullName) return <div className="min-h-screen flex items-center justify-center text-primary font-mono animate-pulse">SYSTEM BOOTING...</div>;

  return (
    <section className="relative min-h-screen pt-20 flex items-center bg-obsidian overflow-hidden border-b border-border">
      
      {/* Geometric Background Lines */}
      <div className="absolute top-0 bottom-0 left-[10%] w-[1px] bg-border z-0" />
      <div className="absolute top-0 bottom-0 right-[10%] w-[1px] bg-border z-0" />
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-border z-0" />
      
      <div className="container mx-auto px-4 lg:px-8 grid lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left: Oversized Typography Content (7 cols) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-7 flex flex-col items-start space-y-8 py-12"
        >
          <div className="space-y-4">
            <Badge className="mb-4">SYSTEM ARCHITECT</Badge>
            
            <h1 className="text-5xl sm:text-[4rem] md:text-[5rem] lg:text-[6.5rem] font-bold font-heading leading-[0.9] tracking-tighter text-text-main uppercase break-words">
              {profile.fullName.split(' ')[0]} {profile.fullName.split(' ')[1]} <br />
              <span className="text-outline-primary">{profile.fullName.split(' ')[2]}</span>
            </h1>
            <h2 className="text-lg md:text-2xl font-mono text-primary tracking-widest uppercase mt-4">
              {profile.title}
            </h2>
          </div>
          
          <p className="text-lg md:text-xl text-text-muted font-sans max-w-xl leading-relaxed border-l-2 border-primary pl-4">
            {profile.bio}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg font-mono text-xs text-text-muted">
            <a href={profile.githubLink} target="_blank" rel="noreferrer" className="flex items-center justify-center space-x-2 border border-border p-3 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all">
              <span>GITHUB</span>
            </a>
            <a href={profile.linkedinLink} target="_blank" rel="noreferrer" className="flex items-center justify-center space-x-2 border border-border p-3 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all">
              <span>LINKEDIN</span>
            </a>
            <a href={profile.cvPdfKey} target="_blank" rel="noreferrer" className="col-span-1 sm:col-span-2 flex items-center justify-center space-x-2 bg-surface text-primary border border-primary p-3 font-bold hover:bg-primary hover:text-obsidian transition-colors">
              <Download className="w-4 h-4" /> <span>DOWNLOAD CV</span>
            </a>
          </div>
        </motion.div>

        {/* Right: Offset Frame Profile Image (5 cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="lg:col-span-5 relative flex justify-center lg:justify-end items-center h-[500px] lg:h-full mt-12 lg:mt-0"
        >
          {/* Geometric offset frame */}
          <div className="absolute w-full max-w-[320px] md:max-w-[400px] aspect-[3/4] border-2 border-primary translate-x-4 translate-y-4 z-0 mx-auto lg:mr-4" />
          
          {/* Main Image Container */}
          <div className="relative w-full max-w-[320px] md:max-w-[400px] aspect-[3/4] z-10 bg-surface overflow-hidden group mx-auto lg:mr-4">
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-20 group-hover:bg-transparent transition-colors duration-500" />
            <img 
              src={profile.avatarKey} 
              alt="Dang Vy Khoi" 
              className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
            />
            {/* Overlay Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary z-30" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary z-30" />
          </div>
        </motion.div>

      </div>
    </section>
  )
}
