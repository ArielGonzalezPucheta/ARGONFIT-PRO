
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge } from '../components/UI';
import { useNavigate } from 'react-router-dom';

// --- LAYOUT SHARED ---
const SupportLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode; badge?: string }> = ({ title, subtitle, children, badge }) => (
  <div className="min-h-screen pt-4 pb-32 animate-in fade-in duration-700 relative overflow-hidden">
     {/* Tech Background */}
     <div className="absolute inset-0 bg-[#050806] -z-20" />
     <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-emerald-900/5 to-transparent -z-10" />
     <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10 pointer-events-none" />
     
     <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        <header className="mb-16 border-b border-white/5 pb-12">
           <motion.div 
             initial={{ opacity: 0, x: -20 }} 
             animate={{ opacity: 1, x: 0 }} 
             className="flex items-center gap-3 mb-4"
           >
              <div className="w-2 h-8 bg-emerald-500 rounded-sm shadow-[0_0_15px_#10B981]" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] font-mono">{badge || "SUPPORT MODULE"}</span>
           </motion.div>
           <motion.h1 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }} 
             transition={{ delay: 0.1 }}
             className="text-5xl md:text-7xl font-black italic uppercase text-white tracking-tighter mb-4 leading-none"
           >
             {title}
           </motion.h1>
           <motion.p 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             transition={{ delay: 0.2 }}
             className="text-zinc-400 text-lg max-w-2xl leading-relaxed border-l-2 border-white/10 pl-6"
           >
             {subtitle}
           </motion.p>
        </header>
        {children}
     </div>
  </div>
);

// --- HELP CENTER COMPONENT ---
export const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const navigate = useNavigate();

  const faqs = [
    { 
      category: 'Entrenamiento',
      q: "¿Cómo recalibro mi nivel de experiencia?", 
      a: "Accede a Perfil > Modificar > Experiencia. El algoritmo Argon ajustará automáticamente el volumen y la intensidad de tus próximas rutinas basándose en este nuevo parámetro." 
    },
    { 
      category: 'Tecnología',
      q: "¿Cómo funcionan los sets RIR (Reps in Reserve)?", 
      a: "RIR es la cantidad de repeticiones que podrías haber hecho antes del fallo muscular. RIR 0 es fallo técnico. RIR 2 significa que te sobraron 2 reps. Usamos esto para autoregular la fatiga." 
    },
    { 
      category: 'Suscripción',
      q: "¿Qué sucede al finalizar la prueba gratuita?", 
      a: "Si no cancelas 24 horas antes, se procesará el cobro del plan seleccionado. Si cancelas, tu cuenta volverá al plan 'Free' con acceso limitado a la biblioteca básica." 
    },
    { 
      category: 'Nutrición',
      q: "¿El plan nutricional se actualiza solo?", 
      a: "Sí. Si actualizas tu peso en el perfil, puedes regenerar el plan en la sección Nutrición para ajustar las calorías y macronutrientes a tu nuevo TDEE." 
    },
    { 
      category: 'Offline',
      q: "¿Funciona la app sin conexión?", 
      a: "El registro de entrenamientos y la visualización de rutinas guardadas es 100% offline. Las funciones de IA y sincronización requieren conexión activa." 
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SupportLayout title="Centro de Ayuda" subtitle="Base de conocimientos neural para optimizar tu experiencia en Argon Fit.">
       
       {/* SEARCH BAR */}
       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3 }}
         className="mb-12"
       >
          <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
             <div className="relative bg-[#0F1210] border border-white/10 rounded-2xl flex items-center p-2 shadow-2xl">
                 <div className="w-12 h-12 flex items-center justify-center text-zinc-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <input 
                   type="text" 
                   placeholder="Buscar protocolo, error o concepto..." 
                   className="flex-1 bg-transparent text-white placeholder-zinc-600 outline-none text-lg font-medium h-12 px-2"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <div className="hidden md:flex items-center gap-2 pr-4">
                    <Badge color="zinc" className="opacity-50">ESC</Badge>
                    <span className="text-[10px] text-zinc-600 font-bold uppercase">TO CANCEL</span>
                 </div>
             </div>
          </div>
       </motion.div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* FAQ COLUMN */}
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Base de Datos ({filteredFaqs.length})</h3>
             </div>
             
             {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-[#101412] border ${activeAccordion === idx ? 'border-emerald-500/30 bg-emerald-900/5' : 'border-white/5'} rounded-xl overflow-hidden transition-all duration-300`}
                >
                   <button 
                     onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                     className="w-full flex items-center justify-between p-6 text-left group"
                   >
                      <div className="pr-4">
                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 block">{faq.category}</span>
                         <span className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{faq.q}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all ${activeAccordion === idx ? 'bg-emerald-500 text-black rotate-180' : 'bg-transparent text-zinc-500'}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                   </button>
                   <AnimatePresence>
                      {activeAccordion === idx && (
                         <motion.div 
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="px-6 pb-6"
                         >
                            <p className="text-zinc-400 text-sm leading-7 pt-4 border-t border-white/5">
                               {faq.a}
                            </p>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </motion.div>
             )) : (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <p className="text-zinc-500 font-mono text-sm">No se encontraron resultados en la base de datos.</p>
                </div>
             )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
             <Card className="bg-gradient-to-br from-emerald-900/20 to-[#101412] border-emerald-500/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
                <h4 className="font-bold text-white mb-1 text-sm uppercase tracking-wide">¿Asistencia Humana?</h4>
                <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                   Soporte de ingeniería para fallos críticos del sistema.
                </p>
                <Button onClick={() => navigate('/contact')} className="w-full h-9 text-[9px] shadow-lg shadow-emerald-900/20">
                   Contactar Soporte
                </Button>
             </Card>
          </div>
       </div>
    </SupportLayout>
  );
};

// --- SYSTEM STATUS COMPONENT ---
export const SystemStatus = () => {
  const [latency, setLatency] = useState<number[]>(Array(20).fill(20));

  // Simulate latency fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
        setLatency(prev => {
            const next = [...prev.slice(1), Math.floor(Math.random() * 40) + 10];
            return next;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const systems = [
    { name: 'API Gateway', status: 'operational', region: 'Global-East' },
    { name: 'Argon AI Engine', status: 'operational', region: 'US-Central' },
    { name: 'Database Clusters', status: 'operational', region: 'EU-West' },
    { name: 'Auth Services', status: 'operational', region: 'Global' },
    { name: 'Payment Processing', status: 'operational', region: 'Secure-Enclave' },
    { name: 'CDN & Assets', status: 'operational', region: 'Edge' }
  ];

  return (
    <SupportLayout title="Estado del Sistema" subtitle="Monitoreo en tiempo real de la infraestructura crítica de Argon Fit." badge="SYSTEM HEALTH">
        
        {/* GLOBAL STATUS BANNER */}
        <div className="mb-12">
           <div className="bg-[#101412] border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-emerald-900/10">
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_20px_#10B981] animate-ping absolute" />
                      <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_20px_#10B981] relative z-10" />
                  </div>
                  <div>
                      <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Todos los sistemas operativos</h2>
                      <p className="text-zinc-400 text-sm">Última actualización: hace unos segundos</p>
                  </div>
              </div>

              <div className="flex gap-4 relative z-10">
                  <div className="text-right">
                      <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">UPTIME (30D)</span>
                      <span className="text-2xl font-mono text-emerald-500 font-bold">99.99%</span>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-right">
                      <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">AVG LATENCY</span>
                      <span className="text-2xl font-mono text-white font-bold">24ms</span>
                  </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* SERVICES GRID */}
           <div className="space-y-4">
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Servicios Individuales</h3>
               {systems.map((sys, idx) => (
                  <motion.div 
                    key={sys.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-[#0F1210] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-emerald-500/20 transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
                        <div>
                            <span className="font-bold text-zinc-200 block text-sm">{sys.name}</span>
                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wide">{sys.region}</span>
                        </div>
                     </div>
                     <Badge color="emerald" className="bg-emerald-500/5 border-emerald-500/10 text-[9px]">OPERATIONAL</Badge>
                  </motion.div>
               ))}
           </div>

           {/* REAL-TIME METRICS */}
           <div className="space-y-8">
               <Card className="bg-[#0F1210] border-white/5 p-6 h-min">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Latencia de Red (ms)</h3>
                       <div className="flex gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-bold text-emerald-500">LIVE</span>
                       </div>
                   </div>
                   
                   {/* CSS Animated Bar Chart */}
                   <div className="flex items-end gap-1 h-32 w-full">
                       {latency.map((val, i) => (
                           <div 
                             key={i}
                             className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/50 transition-colors rounded-t-sm relative group"
                             style={{ height: `${val}%` }}
                           >
                              {/* Tooltip on hover */}
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-white/20 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                  {val * 2}ms
                              </div>
                           </div>
                       ))}
                   </div>
                   <div className="flex justify-between mt-2 text-[9px] font-mono text-zinc-600 uppercase">
                       <span>-60s</span>
                       <span>Ahora</span>
                   </div>
               </Card>

               <Card className="bg-[#0F1210] border-white/5 p-6">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Incidencias Recientes</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                            <div className="mt-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Mantenimiento Programado Completado</h4>
                                <p className="text-xs text-zinc-500 mt-1">Actualización del núcleo de IA v4.2 realizada con éxito. Sin tiempo de inactividad.</p>
                                <span className="text-[9px] font-mono text-zinc-600 mt-2 block">12 OCT - 04:00 UTC</span>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="mt-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Sistemas Nominales</h4>
                                <p className="text-xs text-zinc-500 mt-1">Todos los servicios operando bajo parámetros normales.</p>
                                <span className="text-[9px] font-mono text-zinc-600 mt-2 block">10 OCT - 12:00 UTC</span>
                            </div>
                        </div>
                    </div>
               </Card>
           </div>
        </div>
    </SupportLayout>
  );
};
