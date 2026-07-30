import { useEffect, useState } from 'react';
import { Badge } from "../ui/Badge"
import { motion } from "framer-motion"
import { ContentApi } from '../../lib/api';

export function ProjectsBento() {
  const [experiences, setExperiences] = useState<any[]>([]);

  useEffect(() => {
    ContentApi.getExperiences().then(setExperiences).catch(console.error);
  }, []);

  if (!experiences.length) return null;

  return (
    <section id="experience" className="relative py-32 px-4 lg:px-8 bg-surface overflow-hidden">
      {/* Horizontal Line separating sections */}
      <div className="geo-line-h top-0" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        
        <div className="mb-24 flex items-center">
          <div className="w-16 h-[2px] bg-primary mr-6" />
          <h2 className="text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
            Kinh Nghiệm <span className="text-primary">&</span> Dự Án
          </h2>
        </div>

        <div className="relative">
          {/* Timeline Vertical Line */}
          <div className="absolute left-0 md:left-48 top-0 bottom-0 w-[1px] bg-border z-0" />
          
          <div className="space-y-24">
            {experiences.map((exp, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                key={index} 
                className="relative grid md:grid-cols-12 gap-8 md:gap-12 items-start group"
              >
                
                {/* Timeline Node marker */}
                <div className="hidden md:block absolute left-48 w-3 h-3 bg-obsidian border-2 border-primary -translate-x-[6px] translate-y-2 rounded-none group-hover:bg-primary transition-colors" />

                {/* Period - Left col */}
                <div className="md:col-span-3 pt-1 relative z-10 bg-surface md:bg-transparent pr-4 inline-block md:block pl-6 md:pl-0">
                  <span className="text-xl md:text-3xl font-bold font-mono text-primary uppercase tracking-tighter">
                    {exp.period}
                  </span>
                </div>

                {/* Content - Right col */}
                <div className="md:col-span-9 relative z-10 pl-6 md:pl-0 border-l md:border-l-0 border-border md:border-transparent mt-4 md:mt-0">
                  <div className="border border-border p-6 md:p-10 bg-obsidian hover:border-primary transition-colors duration-300 relative overflow-hidden group/card">
                    {/* Background accent on hover */}
                    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover/card:translate-y-0 transition-transform duration-500 ease-out z-0" />
                    
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-4">
                        <h3 className="text-2xl font-bold font-heading text-text-main uppercase">{exp.role}</h3>
                        <div className="text-text-muted font-mono text-sm tracking-widest mt-2 md:mt-0">{exp.company}</div>
                      </div>
                      
                      <h4 className="text-xl font-bold font-heading text-text-main mb-6 uppercase tracking-tighter text-primary">
                        [ PROJECT: {exp.projectName} ]
                      </h4>

                      <ul className="space-y-4 mb-8">
                        {exp.highlights.map((item: string, i: number) => (
                          <li key={i} className="text-text-muted text-base leading-relaxed flex items-start font-body">
                            <span className="text-primary mr-3 mt-1 font-mono">{`>`}</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-2 pt-6 border-t border-border">
                        {exp.techStack.map((t: string) => (
                          <Badge key={t} variant="secondary">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
