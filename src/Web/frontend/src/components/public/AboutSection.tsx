import { useEffect, useState } from 'react';
import { motion } from "framer-motion"
import { ContentApi } from '../../lib/api';

const DEFAULT_SKILLS = [
  { category: "Backend", name: "C#" },
  { category: "Backend", name: ".NET 9 / Core" },
  { category: "Backend", name: "ASP.NET Core Web API" },
  { category: "Backend", name: "Entity Framework Core" },
  { category: "Backend", name: "Dapper" },
  { category: "Database", name: "PostgreSQL" },
  { category: "Database", name: "SQL Server" },
  { category: "Database", name: "Redis" },
  { category: "DevOps & System", name: "Docker & Compose" },
  { category: "DevOps & System", name: "Nginx" },
  { category: "DevOps & System", name: "CI/CD & GitHub Actions" },
  { category: "DevOps & System", name: "Linux / Home Lab" },
  { category: "Architecture & AI", name: "Modular Monolith" },
  { category: "Architecture & AI", name: "RESTful API" },
  { category: "Architecture & AI", name: "Ollama / Local LLM" }
];

export function AboutSection() {
  const [skills, setSkills] = useState<any[]>(DEFAULT_SKILLS);

  useEffect(() => {
    ContentApi.getSkills()
      .then(data => {
        if (data && data.length > 0) {
          setSkills(data);
        }
      })
      .catch(console.error);
  }, []);

  // Group skills by category
  const categories = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  const SKILL_CATEGORIES = Object.entries(categories).map(([title, items]) => ({ title, items }));

  return (
    <section id="about" className="relative py-32 px-4 lg:px-8 bg-obsidian overflow-hidden">
      <div className="geo-line-h top-0" />
      
      <div className="container mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 lg:gap-24 relative z-10">
        
        {/* Left: Education & Info */}
        <div>
          <div className="mb-12 flex items-center">
            <h2 className="text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
              Học Vấn
            </h2>
            <div className="flex-grow h-[1px] bg-border ml-6" />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border-l-4 border-primary pl-6 py-2 mb-16"
          >
            <h3 className="text-2xl font-bold font-heading text-text-main uppercase mb-2">Cử Nhân CNTT</h3>
            <div className="text-primary font-mono text-sm uppercase tracking-widest mb-4">Ho Chi Minh City Open University (2020-2024)</div>
            <ul className="space-y-3 text-text-muted font-body">
              <li className="flex items-start"><span className="text-primary mr-2 font-mono">{`>`}</span> Tốt nghiệp loại Giỏi (Graduated with Distinction).</li>
              <li className="flex items-start"><span className="text-primary mr-2 font-mono">{`>`}</span> Đạt 3 Học bổng Khuyến khích Học tập.</li>
            </ul>
          </motion.div>

          <div className="mb-12 flex items-center">
            <h2 className="text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
              Tư Duy
            </h2>
            <div className="flex-grow h-[1px] bg-border ml-6" />
          </div>

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-border p-6 bg-surface hover:border-primary transition-colors"
            >
              <h4 className="text-primary font-mono text-sm uppercase tracking-widest mb-3">01 // Product Mindset</h4>
              <p className="text-text-muted leading-relaxed">Tập trung vào tính ổn định của hệ thống trên môi trường production và giá trị mang lại cho doanh nghiệp hơn là các giải pháp lý thuyết suông.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="border border-border p-6 bg-surface hover:border-primary transition-colors"
            >
              <h4 className="text-primary font-mono text-sm uppercase tracking-widest mb-3">02 // Technical Curiosity</h4>
              <p className="text-text-muted leading-relaxed">Tự triển khai lab cá nhân với Linux, Docker, và CI/CD để liên tục thử nghiệm công nghệ mới, đảm bảo tính mở rộng trong tương lai.</p>
            </motion.div>
          </div>
        </div>

        {/* Right: Skills Grid */}
        <div>
          <div className="mb-12 flex items-center">
            <h2 className="text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
              Kỹ Năng
            </h2>
            <div className="flex-grow h-[1px] bg-border ml-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border">
            {SKILL_CATEGORIES.map((skillGroup, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={skillGroup.title} 
                className="bg-obsidian p-8 hover:bg-surface transition-colors"
              >
                <h4 className="font-mono text-xs font-bold text-primary uppercase tracking-widest mb-6">
                  {skillGroup.title}
                </h4>
                <ul className="space-y-4">
                  {(skillGroup.items as string[]).map((skill: string) => (
                    <li key={skill} className="text-text-main font-body text-sm font-bold flex items-center">
                      <div className="w-1.5 h-1.5 bg-border mr-3 rounded-none" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
