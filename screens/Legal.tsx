
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge } from '../components/UI';

// --- SHARED LAYOUT COMPONENT ---
const LegalLayout: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; badgeText?: string }> = ({ title, subtitle, children, badgeText }) => (
  <div className="min-h-screen pt-8 pb-32 animate-in fade-in duration-700 relative overflow-hidden">
    {/* Dynamic Background */}
    <div className="absolute inset-0 bg-[#050806] -z-20" />
    <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-emerald-900/5 to-transparent -z-10" />
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10 pointer-events-none" />

    <div className="max-w-4xl mx-auto px-6 relative z-10">
      <header className="space-y-6 mb-16 border-b border-white/5 pb-12 relative">
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="flex items-center gap-3 mb-4"
         >
            <div className="w-2 h-8 bg-emerald-500 rounded-sm shadow-[0_0_15px_#10B981]" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] font-mono">{badgeText || "LEGAL PROTOCOLS"}</span>
         </motion.div>
         
         <motion.h1 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none"
         >
           {title}
         </motion.h1>
         
         {subtitle && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.2 }}
              className="text-zinc-400 max-w-2xl text-lg leading-relaxed border-l-2 border-white/10 pl-6"
            >
              {subtitle}
            </motion.p>
         )}

         {/* Decorative Tech Elements */}
         <div className="absolute right-0 top-0 hidden md:block opacity-20">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="1" />
                <path d="M50 0 L50 100 M0 50 L100 50" stroke="white" strokeWidth="0.5" />
            </svg>
         </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-8"
      >
        {children}
      </motion.div>
    </div>
  </div>
);

// --- SECTION COMPONENT ---
const Section: React.FC<{ number: string; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <div className="group">
    <div className="flex items-baseline gap-4 mb-4">
        <span className="text-sm font-black text-emerald-500/50 font-mono group-hover:text-emerald-500 transition-colors">/{number}</span>
        <h3 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h3>
    </div>
    <div className="bg-[#101412] border border-white/5 rounded-2xl p-6 md:p-8 text-zinc-400 text-sm leading-7 space-y-4 hover:border-emerald-500/20 transition-all shadow-lg">
        {children}
    </div>
  </div>
);

// --- TERMS & CONDITIONS SCREEN ---
export const Terms = () => (
  <LegalLayout 
    title="Términos de Servicio" 
    subtitle="Acuerdo legal vinculante entre el Usuario y Argon Fit Technologies para el uso de la plataforma, servicios de suscripción y funcionalidades de IA."
    badgeText="AGREEMENT v4.2"
  >
       {/* Highlights */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
              { label: 'Jurisdicción', val: 'Global / Local Law', icon: '⚖️' },
              { label: 'Edad Mínima', val: '18 Años', icon: '🔞' },
              { label: 'Última Revisión', val: new Date().toLocaleDateString(), icon: '📅' }
          ].map((item) => (
              <div key={item.label} className="bg-[#151B18] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-xl">{item.icon}</div>
                  <div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{item.label}</p>
                      <p className="text-white font-bold text-sm">{item.val}</p>
                  </div>
              </div>
          ))}
       </div>

       <Section number="01" title="Aceptación y Alcance">
         <p>Al crear una cuenta, suscribirse a un plan (Pro/Elite) o utilizar la versión de prueba gratuita, usted acepta estos Términos. Este acuerdo rige el uso de la aplicación Argon Fit, incluyendo el "Argon AI Coach" y los servicios de procesamiento de pagos.</p>
         <p>Si no está de acuerdo con alguna cláusula, debe interrumpir el uso inmediatamente y cancelar cualquier suscripción activa a través de la plataforma de gestión correspondiente.</p>
       </Section>
       
       <Section number="02" title="Suscripciones y Pagos">
         <p><strong className="text-white">Periodo de Prueba:</strong> Los nuevos usuarios tienen derecho a una prueba gratuita de 7 días. Al finalizar, se cargará automáticamente el monto del plan seleccionado a menos que se cancele 24 horas antes.</p>
         <p><strong className="text-white">Facturación:</strong> Los pagos son procesados de forma segura a través de <strong>Mercado Pago</strong> o la pasarela designada. Argon Fit no almacena detalles completos de tarjetas de crédito.</p>
         <p><strong className="text-white">Política de Reembolso:</strong> Las suscripciones son no reembolsables una vez cobradas, salvo que la ley local exija lo contrario. La cancelación detiene la renovación automática, manteniendo el acceso hasta el final del ciclo.</p>
       </Section>

       <Section number="03" title="Exención de Responsabilidad (Salud)">
         <div className="p-4 bg-red-900/10 border-l-2 border-red-500 rounded-r-lg my-2">
            <p className="text-red-200 font-bold text-xs uppercase tracking-wide">ADVERTENCIA DE SEGURIDAD FÍSICA</p>
         </div>
         <p>Argon Fit no es un proveedor de servicios médicos. El contenido generado por IA (rutinas, dietas) es meramente informativo.</p>
         <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500">
             <li>Usted asume todos los riesgos inherentes al ejercicio físico.</li>
             <li>Debe consultar a un médico antes de iniciar cualquier programa de alta intensidad.</li>
             <li>Argon Fit no se hace responsable de lesiones, daños o muerte resultantes del uso de las rutinas sugeridas.</li>
         </ul>
       </Section>

       <Section number="04" title="Propiedad Intelectual y AI">
         <p>El algoritmo de entrenamiento, el código fuente y la marca "Argon Fit" son propiedad exclusiva. Las rutinas generadas por la IA para usted son para uso personal. No está permitida la reventa, distribución masiva o ingeniería inversa de los prompts utilizados para generar dicho contenido.</p>
       </Section>

       <div className="mt-12 p-8 bg-[#101412] border border-white/5 rounded-2xl text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
           <p className="text-xs font-mono text-zinc-500 mb-4">FIRMA DIGITAL DEL USUARIO</p>
           <div className="text-3xl font-heading font-black text-white italic tracking-tighter opacity-50 select-none">
               ACEPTADO_AL_REGISTRARSE
           </div>
       </div>
  </LegalLayout>
);

// --- PRIVACY POLICY SCREEN ---
export const Privacy = () => (
  <LegalLayout 
    title="Política de Privacidad"
    subtitle="Transparencia total sobre cómo recopilamos, encriptamos y procesamos sus datos biométricos y de comportamiento."
    badgeText="DATA SECURE"
  >
       {/* Visual Encryption Graphic */}
       <div className="relative h-48 bg-[#101412] rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center mb-12">
           <div className="absolute inset-0 bg-emerald-900/5" />
           <div className="flex items-center gap-8 md:gap-16 relative z-10">
               <div className="text-center">
                   <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-2 border border-white/10">👤</div>
                   <span className="text-[10px] font-bold text-zinc-500 uppercase">Usuario</span>
               </div>
               <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-24 relative">
                   <motion.div 
                     animate={{ x: [-20, 20], opacity: [0, 1, 0] }} 
                     transition={{ duration: 1.5, repeat: Infinity }}
                     className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#10B981] -translate-y-1/2"
                   />
               </div>
               <div className="text-center">
                   <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center mb-2 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                       <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   </div>
                   <span className="text-[10px] font-bold text-emerald-500 uppercase">AES-256 Encrypted</span>
               </div>
           </div>
       </div>

       <Section number="01" title="Recopilación de Datos">
         <p>Para el funcionamiento del "Algoritmo Argon", recopilamos los siguientes datos:</p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="bg-white/5 border-none p-4">
                <strong className="block text-emerald-400 text-xs uppercase tracking-widest mb-1">Biometría</strong>
                <span className="text-zinc-400">Peso, altura, edad, género, porcentaje de grasa estimado.</span>
            </Card>
            <Card className="bg-white/5 border-none p-4">
                <strong className="block text-emerald-400 text-xs uppercase tracking-widest mb-1">Rendimiento</strong>
                <span className="text-zinc-400">Registros de levantamiento (1RM), volumen total, frecuencia cardíaca (si se conecta), duración.</span>
            </Card>
         </div>
       </Section>

       <Section number="02" title="Uso de Inteligencia Artificial (Gemini API)">
         <p>Utilizamos la API de Google Gemini para procesar sus datos y generar recomendaciones. <strong className="text-white">Privacidad Diferencial:</strong></p>
         <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
            <li>Sus datos son anonimizados antes de ser enviados al motor de IA.</li>
            <li>No compartimos su nombre real, correo electrónico ni ubicación exacta con el proveedor de IA.</li>
            <li>Los datos de entrenamiento NO se utilizan para mejorar los modelos públicos de Google sin su consentimiento explícito.</li>
         </ul>
       </Section>

       <Section number="03" title="Almacenamiento y Seguridad">
         <p>Utilizamos una arquitectura híbrida:</p>
         <p><strong className="text-white">Local-First:</strong> La mayoría de sus datos de sesión residen en su dispositivo para un acceso rápido offline.</p>
         <p><strong className="text-white">Nube (Supabase):</strong> Las copias de seguridad y los perfiles de suscripción se almacenan en bases de datos PostgreSQL con seguridad de nivel empresarial (Row Level Security). Las transacciones de pago son manejadas exclusivamente por Mercado Pago; nosotros solo recibimos un "token" de estado.</p>
       </Section>

       <Section number="04" title="Derechos del Usuario (GDPR/CCPA)">
         <p>Usted es el dueño de sus datos. En cualquier momento puede:</p>
         <div className="flex flex-wrap gap-2 mt-3">
            <Badge color="zinc">Solicitar Exportación JSON</Badge>
            <Badge color="zinc">Eliminar Cuenta Permanentemente</Badge>
            <Badge color="zinc">Revocar Permisos de IA</Badge>
         </div>
       </Section>
  </LegalLayout>
);

// --- LICENSE SCREEN ---
export const License = () => (
    <LegalLayout 
      title="Licencia de Uso"
      subtitle="Acuerdo de Licencia de Usuario Final (EULA) para el software Argon Fit v4.0."
      badgeText="COMMERCIAL RESTRICTED"
    >
        {/* Certificate Visual */}
        <div className="bg-[#151B18] p-1.5 rounded-2xl border border-emerald-500/30 mb-10 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500 to-transparent opacity-20" />
            <div className="bg-[#0A0F0D] rounded-xl p-8 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                     <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Licencia Personal Limitada</h2>
                     <p className="text-zinc-500 font-mono text-xs mt-1">ID: ARG-{Math.random().toString(36).substr(2, 6).toUpperCase()}-USR</p>
                 </div>
                 <div className="flex gap-4">
                     <div className="text-center">
                         <span className="block text-xl font-bold text-white">✅</span>
                         <span className="text-[9px] font-bold text-zinc-500 uppercase">Uso Personal</span>
                     </div>
                     <div className="text-center">
                         <span className="block text-xl font-bold text-white">❌</span>
                         <span className="text-[9px] font-bold text-zinc-500 uppercase">Comercial</span>
                     </div>
                     <div className="text-center">
                         <span className="block text-xl font-bold text-white">❌</span>
                         <span className="text-[9px] font-bold text-zinc-500 uppercase">Redistribución</span>
                     </div>
                 </div>
            </div>
        </div>

        <Section number="01" title="Concesión de Licencia">
            <p>Argon Fit Technologies le otorga una licencia revocable, no exclusiva, intransferible y limitada para descargar, instalar y utilizar la Aplicación estrictamente de acuerdo con los términos de este Acuerdo.</p>
            <p>Esta licencia cubre el uso del software en dispositivos móviles y web propiedad del usuario o controlados por él.</p>
        </Section>

        <Section number="02" title="Restricciones Severas">
            <p>Usted acepta no hacer, y no permitir que otros hagan, lo siguiente:</p>
            <ul className="space-y-3 mt-2">
                <li className="flex items-start gap-3 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                    <span className="text-red-500 font-bold">⛔</span>
                    <span>Licenciar, vender, alquilar, arrendar, asignar, distribuir, transmitir, alojar, subcontratar o explotar comercialmente la Aplicación.</span>
                </li>
                <li className="flex items-start gap-3 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                    <span className="text-red-500 font-bold">⛔</span>
                    <span>Copiar el "Look and Feel", diseño de interfaz o lógica de gamificación para productos competitivos.</span>
                </li>
                <li className="flex items-start gap-3 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                    <span className="text-red-500 font-bold">⛔</span>
                    <span>Utilizar bots, scrapers o métodos automatizados para extraer rutinas o datos de la base de conocimientos de Argon.</span>
                </li>
            </ul>
        </Section>

        <Section number="03" title="Terminación">
            <p>Esta licencia terminará automáticamente si usted viola cualquiera de las restricciones. Al finalizar, debe dejar de usar la aplicación y destruir todas las copias.</p>
            <p className="mt-4 text-xs text-zinc-500 uppercase tracking-widest border-t border-white/5 pt-4">
                Jurisdicción: Este acuerdo se rige por las leyes del estado de constitución de Argon Fit Technologies.
            </p>
        </Section>
    </LegalLayout>
);

// --- CONTACT SCREEN ---
export const Contact = () => (
  <LegalLayout 
    title="Centro de Contacto" 
    subtitle="Canales de comunicación oficiales para soporte técnico, legal y comercial."
    badgeText="SUPPORT LINK"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
       {/* CONTACT FORM WITH TECH VISUALS */}
       <Card className="p-8 space-y-6 border-emerald-500/20 bg-[#101412] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          
          {/* Animated corner accent */}
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-4 right-4 text-[8px] text-emerald-500 font-black uppercase tracking-widest border border-emerald-500/30 px-2 py-1 rounded bg-black/40 backdrop-blur-md"
          >
              Secure Channel
          </motion.div>

          <h3 className="text-2xl font-black italic text-white uppercase relative z-10">Crear Ticket</h3>
          
          <form className="space-y-4 relative z-10" onSubmit={(e) => e.preventDefault()}>
             <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Asunto</label>
                <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors font-mono text-sm" placeholder="ID: ERR-404" />
             </div>
             <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Mensaje</label>
                <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors h-32 resize-none text-sm" placeholder="Descripción del incidente..." />
             </div>
             <Button className="w-full h-14 font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]">Transmitir</Button>
          </form>
       </Card>

       <div className="space-y-6 flex flex-col">
          {/* UPDATED EMAIL CARD */}
          <Card className="p-8 flex items-center gap-6 bg-gradient-to-r from-blue-900/10 to-transparent border-blue-500/20">
             <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             </div>
             <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Canal Oficial</p>
                <a href="mailto:argonfit.app@gmail.com" className="text-xl font-bold text-white hover:text-blue-400 transition-colors break-all">argonfit.app@gmail.com</a>
                <p className="text-xs text-blue-400/60 mt-1">SLA: 24 Horas</p>
             </div>
          </Card>

          {/* FUTURISTIC NETWORK VISUALIZATION (REPLACING ADDRESS) */}
          <div className="flex-1 min-h-[180px] rounded-3xl bg-[#0F1210] border border-white/5 relative overflow-hidden flex items-center justify-center">
             {/* Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
             
             {/* Radar Sweep */}
             <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(16,185,129,0)_0deg,rgba(16,185,129,0.1)_360deg)] animate-[spin_4s_linear_infinite]" />
             
             {/* Central Hub */}
             <div className="relative z-10 flex flex-col items-center gap-3">
                 <div className="relative">
                    <div className="w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center bg-black/50 backdrop-blur-md z-10 relative">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    {/* Pulsing Rings */}
                    <motion.div 
                        animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full border border-emerald-500/50"
                    />
                     <motion.div 
                        animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                        className="absolute inset-0 rounded-full border border-emerald-500/30"
                    />
                 </div>
                 <div className="text-center">
                     <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Global Uplink</span>
                     </div>
                     <p className="text-[10px] text-zinc-500 font-mono">Esperando transmisión de datos...</p>
                 </div>
             </div>
          </div>
       </div>
    </div>
  </LegalLayout>
);
