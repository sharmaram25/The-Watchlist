import React from 'react';
import { ArrowUpRight, Mail, Briefcase, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black overflow-hidden relative">
      
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[150px] mix-blend-overlay" />
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-cyan-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        
        <section className="mb-40 flex flex-col md:flex-row items-center gap-8 md:gap-0">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex-1 z-10"
            >
                <h2 className="text-cyan-500 font-mono text-sm mb-4 tracking-widest uppercase">The Creator</h2>
                <h1 className="text-7xl md:text-9xl font-serif font-bold leading-[0.85] tracking-tight mb-8">
                    Ram<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-white">Sharma</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed font-light">
                    Digital architect and creative technologist crafting fluid, cinematic web experiences. 
                    Merging performance with high-end aesthetics.
                </p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-64 h-64 md:w-80 md:h-80 relative shrink-0 md:-ml-32 lg:-ml-40"
            >
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-[40px] animate-pulse-slow" />
                <div className="w-full h-full rounded-full border-2 border-white/10 overflow-hidden relative shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-black/50">
                    <img 
                        src="/2.jpg" 
                        alt="Ram Sharma"
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                </div>
            </motion.div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-40">
             <div>
                 <motion.h3 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-4xl font-bold mb-8"
                 >
                     Philosophy
                 </motion.h3>
                 <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-gray-400 text-lg leading-relaxed mb-6"
                 >
                     I believe the web should be more than just static containers of information. 
                     It should be an immersive medium that respects the user's time while delighting their senses.
                 </motion.p>
                 <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-400 text-lg leading-relaxed"
                 >
                     "The Watchlist" demonstrates this via magnetic interactions, non-blocking state updates, 
                     and a 3D-aware layout engine that gives depth to flat content.
                 </motion.p>
             </div>
             
             <div className="space-y-8">
                 <div className="border-t border-white/20 pt-4">
                     <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-cyan-500">Current Focus</h4>
                     <p className="text-2xl font-serif">Immersive UI Engineering</p>
                 </div>
                 <div className="border-t border-white/20 pt-4">
                     <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-cyan-500">Tech Stack</h4>
                     <p className="text-2xl font-serif">React 19, Framer Motion, TypeScript</p>
                 </div>
                 <div className="border-t border-white/20 pt-4">
                     <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-cyan-500">Location</h4>
                     <p className="text-2xl font-serif">Digital Nomad</p>
                 </div>
             </div>
        </section>

        <section>
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row items-baseline justify-between border-t border-white/10 pt-20"
            >
                <div className="mb-10 md:mb-0 w-full max-w-2xl">
                    <h2 className="text-6xl md:text-8xl font-serif font-bold text-white mb-8">
                        Let's<br/>Collaborate.
                    </h2>
                    
                    <a 
                        href="mailto:sharmaram2504@gmail.com" 
                        className="group relative inline-flex items-center gap-6 text-3xl md:text-4xl font-light text-gray-300 hover:text-white transition-colors py-4 px-2 -ml-2"
                    >
                         <span className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 flex-shrink-0">
                             <Send size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                         </span>
                         <span className="relative overflow-hidden">
                            <span className="block group-hover:-translate-y-[150%] transition-transform duration-500">sharmaram2504@gmail.com</span>
                            <span className="absolute top-0 left-0 translate-y-[150%] group-hover:translate-y-0 transition-transform duration-500 text-cyan-400 font-serif italic">
                                Say Hello →
                            </span>
                         </span>
                    </a>
                </div>
                
                <div className="flex gap-8">
                     <a href="https://portfolio-ram-sharma.netlify.app/" target="_blank" rel="noreferrer" className="magnetic-target group flex items-center gap-2 text-xl hover:text-cyan-400 transition-colors bg-white/5 px-8 py-6 rounded-full border border-white/10 hover:border-cyan-500/50 hover:bg-white/10">
                         <Briefcase className="group-hover:scale-110 transition-transform" />
                         <span className="relative">
                             View Portfolio
                         </span>
                         <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                     </a>
                </div>
            </motion.div>
        </section>

      </div>
    </div>
  );
};

export default About;