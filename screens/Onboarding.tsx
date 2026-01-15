
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge, Card } from '../components/UI';
import { UserProfile, Goal } from '../types';
import { aiService } from '../services/ai';
import { storage, generateRoutines } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { paymentService } from '../services/payment'; // Import payment service

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- COMPONENTES EXTRAÍDOS PARA EVITAR RE-RENDERIZADO ---

const LangToggle = ({ language, setLanguage }: { language: 'es' | 'en', setLanguage: (l: 'es' | 'en') => void }) => (
  <div className="absolute top-6 right-6 z-50 flex bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-md">
    <button
      onClick={() => setLanguage('es')}
      className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${language === 'es' ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
    >ES</button>
    <button
      onClick={() => setLanguage('en')}
      className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${language === 'en' ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
    >EN</button>
  </div>
);

const NeonInput = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  icon,
  autoComplete
}: {
  label: string,
  value: string,
  onChange: (v: string) => void,
  type?: string,
  placeholder?: string,
  icon: React.ReactNode,
  autoComplete?: string
}) => (
  <div className="group relative w-full">
    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-emerald-500 transition-colors">{label}</label>
    <div className="relative flex items-center">
      <div className="absolute left-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-[#0F1210] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-medium placeholder:text-zinc-700 outline-none focus:bg-[#151B18] focus:border-emerald-500/50 transition-all"
      />
      {/* Animated Bottom Border */}
      <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-emerald-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-center" />
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [view, setView] = useState<'landing' | 'login' | 'wizard'>('landing');
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Iniciando...");
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    email: '',
    password: '',
    name: '',
    goal: 'Hipertrofia',
    experience: 'Intermedio',
    gender: 'Hombre',
    age: 25,
    weight: 75,
    height: 175,
    somatotype: 'Mesomorfo',
    frequency: 4,
    aiEnabled: true,
    streak: 0
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const updateNumericField = (field: keyof UserProfile, val: string) => {
    if (val === '') {
      setFormData(prev => ({ ...prev, [field]: undefined }));
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setFormData(prev => ({ ...prev, [field]: num }));
    }
  };

  const isPasswordValid = (formData.password?.length || 0) >= 6;
  // Validación básica para habilitar el botón de la landing
  const isLandingFormValid = formData.name && formData.name.length > 2 && isValidEmail(formData.email || '') && isPasswordValid;

  const handleLogin = async () => {
    const email = formData.email?.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError(language === 'es' ? "Credenciales incompletas." : "Incomplete credentials.");
      return;
    }

    setIsLoading(true);
    setLoadingText(language === 'es' ? "Accediendo al sistema..." : "Accessing system...");

    try {
      let profileFound: UserProfile | null = null;

      // 1. Intentar recuperación local desde el "Baúl de Cuentas" persistente
      const restoredState = storage.loginLocal(email, password);

      if (restoredState && restoredState.profile) {
        console.log("Login: Credenciales verificadas en almacenamiento local seguro.");
        profileFound = restoredState.profile;
        // Restaurar el estado completo para que la sesión sea válida
        storage.save(restoredState);
      }

      // 2. Si no se encontró localmente Y Supabase está configurado, intentar nube
      if (!profileFound && isSupabaseConfigured) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (!authError) {
          const cloudState = await storage.hydrateFromCloud();
          if (cloudState?.profile) {
            profileFound = cloudState.profile;
          }
        }
      }

      if (profileFound) {
        setLoadProgress(100);
        setLoadingText("Acceso Concedido");
        setTimeout(() => onComplete(profileFound!), 800);
      } else {
        throw new Error(language === 'es' ? "Usuario no encontrado o contraseña incorrecta." : "User not found or invalid password.");
      }

    } catch (err: any) {
      setIsLoading(false);
      // Evitamos mostrar errores técnicos de base de datos al usuario
      const msg = err.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("network")) {
        setError(language === 'es' ? "Modo Offline: Intenta usar tus credenciales locales." : "Offline Mode: Try local credentials.");
      } else {
        setError(msg || (language === 'es' ? "Error de acceso." : "Access error."));
      }
    }
  };

  const handleStartRegister = () => {
    if (!isLandingFormValid) {
      if (!formData.name) setError(language === 'es' ? "El nombre es requerido." : "Name is required.");
      else if (!isValidEmail(formData.email || '')) setError(language === 'es' ? "Email inválido." : "Invalid email.");
      else if (!isPasswordValid) setError(language === 'es' ? "La contraseña debe tener mínimo 6 caracteres." : "Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setView('wizard');
    setStep(1);
  };

  const handleFinishRegister = async () => {
    setIsLoading(true);
    setLoadProgress(10);
    setError(null);

    try {
      const email = formData.email?.trim().toLowerCase();
      if (!formData.age || !formData.weight || !formData.height) throw new Error("Parámetros incompletos.");

      setLoadingText(language === 'es' ? "Iniciando Protocolo..." : "Initiating Protocol...");

      // 1. Intentar registrar en Supabase (si falla, no bloqueamos, seguimos localmente)
      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signUp({
            email: email!,
            password: formData.password!,
            options: { data: { full_name: formData.name } }
          });
        } catch (e) {
          console.warn("Supabase registration skipped (Offline mode active)", e);
        }
      }

      setLoadProgress(30);

      // INICIALIZAR PLAN GRATUITO (User must upgrade manually)
      const freeSubscription = paymentService.startFree();

      const finalProfile = {
        ...formData,
        email,
        // Aseguramos guardar la contraseña para el login local
        password: formData.password,
        subscription: freeSubscription
      } as UserProfile;

      // 2. Generar Rutinas (AI o Fallback Estático)
      setLoadingText(language === 'es' ? "Compilando Rutinas..." : "Compiling Routines...");
      let routines = await aiService.generatePersonalizedRoutines(finalProfile, language);

      // Fallback de seguridad
      if (!routines || routines.length === 0) {
        const allStatic = generateRoutines();
        routines = allStatic.filter(r => r.tags.includes(finalProfile.goal) || r.tags.includes('General')).slice(0, 3);
        if (routines.length < 3) routines = allStatic.slice(0, 3);
      }
      setLoadProgress(60);

      // 3. Generar Nutrición
      setLoadingText(language === 'es' ? "Optimizando Nutrición..." : "Optimizing Nutrition...");
      const nutritionPlan = await aiService.generateNutritionPlan(finalProfile, language);
      setLoadProgress(90);

      const newState = {
        ...storage.load(),
        routines: routines,
        nutritionPlan: nutritionPlan || undefined,
        profile: finalProfile,
        language: language
      };

      // GUARDADO CRÍTICO LOCAL (SI O SI)
      // Esto guardará automáticamente en ACCOUNTS_KEY también
      storage.save(newState);

      // Intentar sincronización nube en segundo plano (Best effort)
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: finalProfile.email,
            name: finalProfile.name,
            data: {
              profile: finalProfile,
              routines: newState.routines,
              nutritionPlan: newState.nutritionPlan,
              personalRecords: newState.personalRecords,
              language: newState.language
            },
            updated_at: new Date().toISOString()
          });
        }
      }

      setLoadProgress(100);
      setLoadingText(language === 'es' ? "Base de Datos Actualizada" : "Database Updated");
      await new Promise(r => setTimeout(r, 800));
      onComplete(finalProfile);

    } catch (e: any) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050706] p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          <div className="w-40 h-40 relative mb-12">
            <motion.div
              className="absolute inset-0 border-t-2 border-emerald-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-4 border border-white/5 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-black italic text-emerald-500 font-heading glow-text">{loadProgress}%</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-[0.3em] font-heading mb-2">{loadingText}</h2>
          <div className="w-full h-[1px] bg-white/5 rounded-full overflow-hidden mt-6">
            <motion.div className="h-full bg-emerald-500 shadow-[0_0_15px_#10B981]" initial={{ width: 0 }} animate={{ width: `${loadProgress}%` }} />
          </div>
          <p className="text-zinc-700 text-[10px] uppercase tracking-[0.6em] font-tech mt-8 animate-pulse">Establishing Secure Neural Link</p>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-[#050706]">
        <LangToggle language={language} setLanguage={setLanguage} />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.08),transparent_60%)]" />

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="z-10 space-y-12 max-w-md w-full">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.4em] font-tech">System v4.2 // Online</span>
            </div>
            <h1 className="text-8xl font-black italic tracking-tighter uppercase mb-4 leading-none text-white font-heading">
              Argon<span className="text-emerald-500 glow-text">Fit</span>
            </h1>
            <p className="text-zinc-500 text-lg font-medium tracking-tight px-8">
              {language === 'es' ? 'La evolución de tu entrenamiento comienza aquí.' : 'The evolution of your training starts here.'}
            </p>
          </div>

          <Card className="p-8 space-y-6 bg-[#0A0F0D]/80 border-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl relative">
            <div className="space-y-5 text-left">
              <NeonInput
                label={language === 'es' ? 'Nombre Completo' : 'Full Name'}
                value={formData.name || ''}
                onChange={v => setFormData({ ...formData, name: v })}
                placeholder="Ej. Alex Mercer"
                autoComplete="name"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />
              <NeonInput
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={v => setFormData({ ...formData, email: v })}
                placeholder="user@argon.sys"
                autoComplete="email"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />
              <NeonInput
                label={language === 'es' ? 'Contraseña Maestra' : 'Master Password'}
                type="password"
                value={formData.password || ''}
                onChange={v => setFormData({ ...formData, password: v })}
                placeholder="******"
                autoComplete="new-password"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-red-400 text-[10px] font-black uppercase tracking-wider">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4 pt-4">
              <Button onClick={handleStartRegister} className="w-full h-16 text-xs shadow-lg shadow-emerald-900/20">
                {language === 'es' ? 'COMENZAR A ENTRENAR' : 'START TRAINING'}
              </Button>
              <div className="flex justify-center">
                <button onClick={() => { setView('login'); setError(null); }} className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors">
                  {language === 'es' ? '¿Ya tienes cuenta?' : 'Already synced?'} <span className="text-white border-b border-white/20">Login</span>
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative bg-[#050706]">
        <LangToggle language={language} setLanguage={setLanguage} />
        <div className="z-10 space-y-10 max-w-sm w-full">
          <div className="space-y-2">
            <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter font-heading">
              {language === 'es' ? 'Acceso Seguro' : 'Secure Portal'}
            </h2>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] font-tech">Credentials Verification</span>
          </div>
          <div className="space-y-5 text-left">
            <NeonInput
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={v => setFormData({ ...formData, email: v })}
              placeholder="Email"
              autoComplete="email"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            <NeonInput
              label={language === 'es' ? 'Clave' : 'Key'}
              type="password"
              value={formData.password || ''}
              onChange={v => setFormData({ ...formData, password: v })}
              placeholder="******"
              autoComplete="current-password"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            />
          </div>
          {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider bg-red-500/10 p-2 rounded-lg">{error}</p>}
          <Button onClick={handleLogin} className="w-full h-16">
            {language === 'es' ? 'ENTRAR' : 'AUTHENTICATE'}
          </Button>
          <button onClick={() => setView('landing')} className="text-zinc-600 mt-4 text-[10px] font-black uppercase tracking-[0.3em] font-tech hover:text-white transition-colors">
            ← {language === 'es' ? 'VOLVER' : 'BACK'}
          </button>
        </div>
      </div>
    );
  }

  // ... (Steps 1, 2, 3 remains identical to previous version)
  return (
    <div className="min-h-screen bg-[#050706] text-white p-6 md:p-12 flex flex-col relative overflow-hidden">
      <LangToggle language={language} setLanguage={setLanguage} />
      <div className="w-full h-[2px] bg-white/5 fixed top-0 left-0 z-50">
        <motion.div className="h-full bg-emerald-500 shadow-[0_0_15px_#10B981]" initial={{ width: 0 }} animate={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col flex-1 w-full justify-center relative z-10">

        {/* STEP 1: OBJECTIVE */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.8em] font-tech">Phase_01 // Objective</span>
              <h2 className="text-6xl md:text-8xl font-black italic uppercase text-white tracking-tighter font-heading">
                {language === 'es' ? 'TU MISIÓN' : 'YOUR MISSION'}
              </h2>
              <p className="text-zinc-500 max-w-lg mx-auto">
                {language === 'es' ? 'Selecciona el protocolo principal para reconfigurar tu biología.' : 'Select the primary protocol to reconfigure your biology.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {[
                {
                  id: 'Hipertrofia',
                  title: language === 'es' ? 'HIPERTROFIA' : 'HYPERTROPHY',
                  desc: language === 'es' ? 'Maximizar masa muscular' : 'Maximize muscle mass',
                  img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=800',
                  stats: { str: 70, cardio: 30 }
                },
                {
                  id: 'Fuerza',
                  title: language === 'es' ? 'FUERZA PURA' : 'RAW STRENGTH',
                  desc: language === 'es' ? 'Potencia y cargas máximas' : 'Power and max loads',
                  img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
                  stats: { str: 95, cardio: 10 }
                },
                {
                  id: 'Pérdida de Peso',
                  title: language === 'es' ? 'DEFINICIÓN' : 'SHREDDING',
                  desc: language === 'es' ? 'Quema de grasa acelerada' : 'Accelerated fat burn',
                  img: 'https://images.unsplash.com/photo-1538805060512-e282813563bd?auto=format&fit=crop&q=80&w=800',
                  stats: { str: 40, cardio: 90 }
                },
                {
                  id: 'Mantenimiento',
                  title: language === 'es' ? 'ATLETA HÍBRIDO' : 'HYBRID ATHLETE',
                  desc: language === 'es' ? 'Rendimiento y salud general' : 'Performance & general health',
                  img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800',
                  stats: { str: 60, cardio: 60 }
                }
              ].map((item) => {
                const isSelected = formData.goal === item.id;
                return (
                  <motion.div
                    key={item.id}
                    onClick={() => setFormData({ ...formData, goal: item.id as Goal })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative h-[240px] rounded-[2rem] overflow-hidden cursor-pointer group transition-all duration-500 border-2 ${isSelected ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-transparent hover:border-white/20'}`}
                  >
                    {/* Background Image */}
                    <img src={item.img} className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isSelected ? 'scale-110 grayscale-0' : 'grayscale-[50%] group-hover:grayscale-0 scale-100'}`} alt={item.title} />

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-300 ${isSelected ? 'opacity-90' : 'opacity-80 group-hover:opacity-60'}`} />

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg animate-in fade-in zoom-in">
                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                        TARGET ACQUIRED
                      </div>
                    )}

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 w-full p-8 z-10">
                      <h3 className={`text-3xl font-black italic uppercase tracking-tighter mb-1 transition-colors ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                        {item.title}
                      </h3>
                      <p className="text-zinc-400 text-sm font-medium mb-4">{item.desc}</p>

                      {/* Stats Bars */}
                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        <div className="flex-1">
                          <div className="flex justify-between text-[8px] uppercase font-bold text-zinc-500 mb-1">
                            <span>STR</span>
                            <span>{item.stats.str}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${item.stats.str}%` }} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-[8px] uppercase font-bold text-zinc-500 mb-1">
                            <span>END</span>
                            <span>{item.stats.cardio}%</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${item.stats.cardio}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="max-w-md mx-auto pt-8">
              <Button onClick={nextStep} className="w-full h-20 text-[11px] font-black tracking-[0.3em] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                {language === 'es' ? 'CONFIRMAR OBJETIVO' : 'CONFIRM OBJECTIVE'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: BIOMETRICS (REDESIGNED) */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.8em] font-tech">Phase_02 // Calibrate</span>
              <h2 className="text-5xl md:text-7xl font-black italic uppercase text-white tracking-tighter font-heading">
                {language === 'es' ? 'DATOS FÍSICOS' : 'BODY METRICS'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gender Selector */}
              <Card className="bg-[#101412] p-6 border-white/5 flex flex-col justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 block">
                  {language === 'es' ? 'Género' : 'Gender'}
                </span>
                <div className="flex gap-2 bg-[#050806] p-1 rounded-xl border border-white/5">
                  {['Hombre', 'Mujer'].map(g => (
                    <button
                      key={g}
                      onClick={() => setFormData({ ...formData, gender: g as any })}
                      className={`flex-1 py-4 rounded-lg text-xs font-black uppercase transition-all ${formData.gender === g ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {g === 'Hombre' ? (language === 'es' ? 'HOMBRE' : 'MALE') : (language === 'es' ? 'MUJER' : 'FEMALE')}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Body Type / Somatotype Selector */}
              <Card className="bg-[#101412] p-6 border-white/5 md:col-span-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 block">
                  {language === 'es' ? 'Tipo de Cuerpo (Somatotipo)' : 'Body Type (Somatotype)'}
                </span>
                <div className="grid grid-cols-3 gap-4">
                  {['Ectomorfo', 'Mesomorfo', 'Endomorfo'].map(type => (
                    <div
                      key={type}
                      onClick={() => setFormData({ ...formData, somatotype: type as any })}
                      className={`cursor-pointer rounded-xl p-4 border transition-all text-center group ${formData.somatotype === type ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-[#050806] border-white/5 text-zinc-500 hover:border-white/20'}`}
                    >
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center border-2 ${formData.somatotype === type ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-zinc-700 bg-transparent'}`}>
                        {/* Simple icons representing body types */}
                        {type === 'Ectomorfo' && <span className="font-black text-lg">|</span>}
                        {type === 'Mesomorfo' && <span className="font-black text-lg">V</span>}
                        {type === 'Endomorfo' && <span className="font-black text-lg">O</span>}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider block">{type}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Height Slider (Redesigned) */}
              <Card className="bg-[#101412] p-6 border-white/5 relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_currentColor]" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    {language === 'es' ? 'Altura' : 'Height'}
                  </span>
                </div>

                <div className="relative flex items-baseline justify-center gap-1 my-6 z-10">
                  <input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => updateNumericField('height', e.target.value)}
                    className="w-full bg-transparent text-center text-7xl font-black text-white italic tracking-tighter outline-none border-none p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none drop-shadow-xl"
                  />
                  <span className="absolute right-4 bottom-3 text-xs font-bold text-zinc-600 pointer-events-none">CM</span>
                </div>

                <div className="relative h-6 flex items-center">
                  <input
                    type="range"
                    min="140" max="220"
                    value={formData.height || 170}
                    onChange={(e) => updateNumericField('height', e.target.value)}
                    className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
              </Card>

              {/* Weight Slider (Redesigned) */}
              <Card className="bg-[#101412] p-6 border-white/5 relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_currentColor]" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    {language === 'es' ? 'Peso' : 'Weight'}
                  </span>
                </div>

                <div className="relative flex items-baseline justify-center gap-1 my-6 z-10">
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => updateNumericField('weight', e.target.value)}
                    className="w-full bg-transparent text-center text-7xl font-black text-white italic tracking-tighter outline-none border-none p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none drop-shadow-xl"
                  />
                  <span className="absolute right-4 bottom-3 text-xs font-bold text-zinc-600 pointer-events-none">KG</span>
                </div>

                <div className="relative h-6 flex items-center">
                  <input
                    type="range"
                    min="40" max="150" step="0.5"
                    value={formData.weight || 70}
                    onChange={(e) => updateNumericField('weight', e.target.value)}
                    className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
              </Card>

              {/* Age Input (Redesigned) */}
              <Card className="bg-[#101412] p-6 border-white/5 relative overflow-hidden group hover:border-orange-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_currentColor]" />
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                    {language === 'es' ? 'Edad' : 'Age'}
                  </span>
                </div>

                <div className="relative flex items-baseline justify-center gap-1 my-6 z-10">
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => updateNumericField('age', e.target.value)}
                    className="w-full bg-transparent text-center text-7xl font-black text-white italic tracking-tighter outline-none border-none p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none drop-shadow-xl"
                  />
                  <span className="absolute right-4 bottom-3 text-xs font-bold text-zinc-600 pointer-events-none">{language === 'es' ? 'AÑOS' : 'YRS'}</span>
                </div>

                <div className="relative h-6 flex items-center">
                  <input
                    type="range"
                    min="14" max="80"
                    value={formData.age || 25}
                    onChange={(e) => updateNumericField('age', e.target.value)}
                    className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none" />
              </Card>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={prevStep} className="px-10 h-16 bg-white/5 text-zinc-600 font-black uppercase tracking-[0.2em] font-tech rounded-2xl hover:text-white transition-colors">
                ← {language === 'es' ? 'ATRÁS' : 'BACK'}
              </button>
              <Button onClick={nextStep} className="flex-1 h-16 text-[10px] tracking-[0.3em]">
                {language === 'es' ? 'CALIBRAR SISTEMA' : 'CALIBRATE SYSTEM'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: CONFIRMATION & GENERATION */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-16 text-center max-w-xl mx-auto">
            <div className="relative">
              <div className="w-40 h-40 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-10 border border-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.1)] relative">
                <div className="absolute inset-0 rounded-full border border-emerald-500 animate-ping opacity-10" />
                <svg className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h2 className="text-7xl font-black italic uppercase text-white tracking-tighter font-heading">
                {language === 'es' ? 'ANALIZANDO ADN' : 'SEQUENCING DNA'}
              </h2>
              <p className="text-zinc-500 text-lg mt-6 font-medium tracking-tight leading-relaxed">
                {language === 'es'
                  ? 'Argon Fit está listo para generar 3 protocolos de entrenamiento y un plan nutricional adaptado a tu morfología.'
                  : 'Argon Fit is ready to generate 3 training protocols and a nutrition plan adapted to your morphology.'}
              </p>
              <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 inline-block">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Incluye 7 Días de Prueba Premium</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button onClick={handleFinishRegister} className="w-full h-24 text-xs tracking-[0.3em]">
                {language === 'es' ? 'ACTIVAR NÚCLEO ARGON' : 'ENGAGE ARGON CORE'}
              </Button>
              <button onClick={prevStep} className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.5em] font-tech hover:text-red-500 transition-colors">
                {language === 'es' ? 'CANCELAR' : 'ABORT_SEQUENCE'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
