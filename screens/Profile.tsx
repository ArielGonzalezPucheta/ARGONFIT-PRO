
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { Card, Button, Badge } from '../components/UI';
import { storage } from '../services/storage';
import { UserProfile } from '../types';

export const Profile = () => {
  const [state, setState] = useState(storage.load());
  const [profile, setProfile] = useState<UserProfile>(state.profile || {
    name: 'Usuario',
    age: 25,
    weight: 75,
    height: 175,
    gender: 'Hombre',
    goal: 'Hipertrofia',
    experience: 'Intermedio',
    frequency: 4,
    aiEnabled: true,
    streak: 0,
    email: '',
    avatarUrl: undefined
  });

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- REAL-TIME CALCULATIONS ---
  const stats = useMemo(() => {
    const h = profile.height / 100;
    const bmi = profile.weight / (h * h);
    
    // Mifflin-St Jeor Equation
    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    bmr = profile.gender === 'Hombre' ? bmr + 5 : bmr - 161;
    
    // Activity Multiplier based on Frequency
    const activityMultipliers = { 2: 1.2, 3: 1.375, 4: 1.55, 5: 1.725, 6: 1.9, 7: 1.9 };
    const tdee = bmr * ((activityMultipliers as any)[profile.frequency] || 1.2);

    return {
        bmi: bmi.toFixed(1),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        bmiColor: bmi < 18.5 ? '#60A5FA' : bmi < 25 ? '#10B981' : bmi < 30 ? '#F59E0B' : '#EF4444',
        bmiLabel: bmi < 18.5 ? 'BAJO PESO' : bmi < 25 ? 'NORMAL' : bmi < 30 ? 'SOBREPESO' : 'OBESIDAD'
    };
  }, [profile]);

  // Mock Data for "Athlete Attributes" Radar
  const radarData = useMemo(() => {
     const goalMap = {
         'Fuerza': [90, 40, 60, 50, 80],
         'Hipertrofia': [70, 50, 80, 60, 60],
         'Pérdida de Peso': [50, 90, 50, 70, 40],
         'Mantenimiento': [60, 70, 60, 60, 50]
     };
     const values = goalMap[profile.goal] || [60, 60, 60, 60, 60];
     
     return [
         { subject: 'STR', A: values[0], fullMark: 100 },
         { subject: 'END', A: values[1], fullMark: 100 },
         { subject: 'AES', A: values[2], fullMark: 100 },
         { subject: 'MOB', A: values[3], fullMark: 100 },
         { subject: 'PWR', A: values[4], fullMark: 100 },
     ];
  }, [profile.goal]);

  // Data for Radial Charts (BMI & TDEE)
  const bmiRadialData = [{ name: 'BMI', value: parseFloat(stats.bmi), fill: stats.bmiColor }];
  const tdeeRadialData = [{ name: 'TDEE', value: stats.tdee / 40, fill: '#10B981' }]; // Scaled for visual

  const handleSave = () => {
    const newState = { ...state, profile };
    setState(newState);
    storage.save(newState);
    setIsEditing(false);
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProfile = { ...profile, avatarUrl: reader.result as string };
        setProfile(newProfile);
        const newState = { ...state, profile: newProfile };
        setState(newState);
        storage.save(newState);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAI = () => {
      const newVal = !profile.aiEnabled;
      const newProfile = { ...profile, aiEnabled: newVal };
      setProfile(newProfile);
      const newState = { ...state, profile: newProfile };
      setState(newState);
      storage.save(newState);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-40 animate-in fade-in duration-700 relative">
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      {/* --- ID CARD HEADER --- */}
      <motion.div 
        layout
        className="relative rounded-[2rem] overflow-hidden bg-[#0A0F0D] border border-white/10 p-6 md:p-8 group shadow-2xl"
      >
         {/* Scanning Line Animation */}
         <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/50 shadow-[0_0_20px_#10B981] animate-[scanline_3s_linear_infinite] opacity-30 pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Avatar Hexagon with Rotating Rings */}
            <motion.div 
               whileHover={{ scale: 1.05 }}
               className="relative group cursor-pointer" 
               onClick={() => fileInputRef.current?.click()}
            >
               <div className="w-28 h-28 md:w-32 md:h-32 clip-hexagon bg-zinc-900 border border-emerald-500/50 flex items-center justify-center overflow-hidden relative z-20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                   {profile.avatarUrl ? (
                       <img src={profile.avatarUrl} alt="User" className="w-full h-full object-cover" />
                   ) : (
                       <span className="text-5xl font-black text-emerald-500 font-heading">{profile.name.charAt(0)}</span>
                   )}
                   <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                       <span className="text-[10px] font-bold text-white uppercase tracking-widest">UPLOAD</span>
                   </div>
               </div>
               
               {/* Animated HUD Rings */}
               <div className="absolute inset-[-15px] border border-dashed border-emerald-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
               <div className="absolute inset-[-8px] border-2 border-transparent border-t-emerald-500/60 border-b-emerald-500/60 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
            </motion.div>

            <div className="flex-1 text-center md:text-left space-y-2">
               <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                   <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-widest">SYSTEM ONLINE</span>
                   </div>
                   <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                       LVL.{Math.floor(profile.streak/7)+1} ACCESS
                   </span>
               </div>
               
               <div className="space-y-1">
                   {isEditing ? (
                       <input 
                         className="bg-black/50 border-b-2 border-emerald-500 text-3xl md:text-5xl font-black italic text-white uppercase outline-none w-full text-center md:text-left font-heading"
                         value={profile.name}
                         onChange={e => updateField('name', e.target.value)}
                         autoFocus
                       />
                   ) : (
                       <motion.h1 layoutId="profileName" className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-tighter font-heading">
                           {profile.name}
                       </motion.h1>
                   )}
                   <p className="text-zinc-500 text-xs font-mono tracking-widest">
                       SUBJECT_ID: <span className="text-emerald-500">{state.profile?.email ? state.profile.email.split('@')[0].toUpperCase() : 'GUEST_001'}</span>
                   </p>
               </div>

               <div className="pt-2">
                   <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} variant={isEditing ? 'primary' : 'secondary'} className="h-8 px-6 text-[9px] w-full md:w-auto">
                       {isEditing ? 'GUARDAR CAMBIOS' : 'MODIFICAR PERFIL'}
                   </Button>
               </div>
            </div>

            {/* AI Status Toggle (Right Side) */}
            <div className="hidden md:flex flex-col items-end">
                <div onClick={toggleAI} className="cursor-pointer group flex flex-col items-end gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Argon AI Core</span>
                    <div className={`w-16 h-8 rounded-full border border-white/10 p-1 flex items-center transition-all ${profile.aiEnabled ? 'bg-emerald-500/20 border-emerald-500/50 justify-end' : 'bg-black justify-start'}`}>
                        <motion.div layout className={`w-6 h-6 rounded-full shadow-lg ${profile.aiEnabled ? 'bg-emerald-400 shadow-[0_0_10px_#34D399]' : 'bg-zinc-600'}`} />
                    </div>
                </div>
            </div>
         </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* --- LEFT: BIOMETRIC CONTROL PANEL (HUD STYLE) --- */}
          <div className="lg:col-span-8 space-y-6">
              
              {/* Biometric Data Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                      { label: 'Peso Corporal', val: profile.weight, unit: 'KG', field: 'weight', max: 150, color: 'emerald' },
                      { label: 'Altura Total', val: profile.height, unit: 'CM', field: 'height', max: 220, color: 'blue' },
                      { label: 'Edad Biológica', val: profile.age, unit: 'AÑOS', field: 'age', max: 90, color: 'orange' }
                  ].map((item) => (
                      <motion.div
                        key={item.label}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`bg-[#101412] border ${isEditing ? 'border-white/20 shadow-lg shadow-emerald-900/20' : 'border-white/5'} rounded-[2rem] p-5 relative overflow-hidden group transition-all duration-300`}
                      >
                          {/* Progress Bar Background */}
                          <div className="absolute bottom-0 left-0 h-1 bg-zinc-800 w-full">
                              <motion.div 
                                className={`h-full ${item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'blue' ? 'bg-blue-500' : 'bg-orange-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.val / item.max) * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                          </div>
                          
                          <div className="flex justify-between items-start mb-2">
                              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{item.label}</label>
                              <div className={`w-1.5 h-1.5 rounded-full ${item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'blue' ? 'bg-blue-500' : 'bg-orange-500'} opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_10px_currentColor] transition-all`} />
                          </div>
                          
                          <div className="flex items-baseline gap-1 mt-2">
                              <input 
                                disabled={!isEditing}
                                type="number" 
                                value={item.val} 
                                onChange={e => updateField(item.field as any, parseFloat(e.target.value))}
                                className={`w-full bg-transparent text-4xl font-black italic text-white outline-none disabled:opacity-80 font-heading transition-colors ${isEditing ? 'focus:text-emerald-400' : ''}`}
                              />
                              <span className="text-[10px] font-bold text-zinc-600 font-mono">{item.unit}</span>
                          </div>
                      </motion.div>
                  ))}
              </div>

              {/* Secondary Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Card className="bg-[#101412] border-white/5 p-4 flex flex-col justify-center">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Género</label>
                       <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                           {['Hombre', 'Mujer'].map(g => (
                               <button 
                                  key={g}
                                  disabled={!isEditing}
                                  onClick={() => updateField('gender', g)}
                                  className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase transition-all ${profile.gender === g ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                               >
                                   {g}
                               </button>
                           ))}
                       </div>
                   </Card>
                   
                   <Card className="bg-[#101412] border-white/5 p-4 flex flex-col justify-center">
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Objetivo Principal</label>
                       <div className="relative">
                           <select 
                             disabled={!isEditing}
                             value={profile.goal}
                             onChange={e => updateField('goal', e.target.value)}
                             className="w-full bg-black/50 text-white font-bold text-xs rounded-lg px-4 py-3 border border-white/10 outline-none focus:border-emerald-500/50 disabled:opacity-50 appearance-none font-mono tracking-wide"
                           >
                               <option value="Hipertrofia">HIPERTROFIA</option>
                               <option value="Fuerza">FUERZA</option>
                               <option value="Pérdida de Peso">PÉRDIDA DE PESO</option>
                               <option value="Mantenimiento">MANTENIMIENTO</option>
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                           </div>
                       </div>
                   </Card>
              </div>
              
              {/* --- METABOLIC DASHBOARD (RADIALS) --- */}
              <div className="grid grid-cols-2 gap-4">
                  {/* BMI Visualizer */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="bg-[#151B18] border border-white/5 rounded-[2rem] p-0 relative overflow-hidden h-[180px] flex items-center justify-between pr-4 shadow-lg"
                  >
                      <div className="w-[140px] h-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                             <RadialBarChart innerRadius="70%" outerRadius="100%" data={bmiRadialData} startAngle={180} endAngle={0} cy="70%">
                                <RadialBar background={{ fill: '#333' }} dataKey="value" cornerRadius={10} />
                             </RadialBarChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                              <span className="text-2xl font-black text-white italic">{stats.bmi}</span>
                          </div>
                      </div>
                      <div className="flex-1 text-right py-6">
                          <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Índice Masa Corporal</h4>
                          <Badge className="ml-auto" style={{ backgroundColor: `${stats.bmiColor}20`, color: stats.bmiColor, borderColor: `${stats.bmiColor}40` }}>{stats.bmiLabel}</Badge>
                          <p className="text-[9px] text-zinc-600 mt-2 leading-tight">Cálculo basado en relación peso/altura estándar.</p>
                      </div>
                  </motion.div>

                  {/* TDEE Visualizer */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="bg-[#151B18] border border-white/5 rounded-[2rem] p-0 relative overflow-hidden h-[180px] flex items-center justify-between pr-4 shadow-lg"
                  >
                      <div className="w-[140px] h-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                             <RadialBarChart innerRadius="70%" outerRadius="100%" data={tdeeRadialData} startAngle={180} endAngle={-180} cy="50%">
                                <RadialBar background={{ fill: '#333' }} dataKey="value" cornerRadius={10} />
                             </RadialBarChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <div className="text-emerald-500 animate-pulse text-2xl">⚡</div>
                          </div>
                      </div>
                      <div className="flex-1 text-right py-6">
                          <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Gasto Diario (TDEE)</h4>
                          <span className="text-3xl font-black text-white italic tracking-tighter block">{stats.tdee}</span>
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">KCAL / DÍA</span>
                      </div>
                  </motion.div>
              </div>
          </div>

          {/* --- RIGHT: ATHLETE TYPE RADAR --- */}
          <Card className="lg:col-span-4 bg-[#101412] border-white/5 p-6 flex flex-col relative overflow-hidden h-full min-h-[500px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none" />
              <div className="flex justify-between items-center mb-6 z-10">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Análisis Vectorial</h3>
                  <Badge color="zinc" className="text-[9px]">{profile.goal}</Badge>
              </div>
              
              <div className="flex-1 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#10B981', fontSize: 9, fontWeight: 900, fontFamily: 'monospace' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Stats" dataKey="A" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.2} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #10B981', borderRadius: '4px' }}
                            itemStyle={{ color: '#10B981', fontSize: '10px', fontWeight: 'bold' }}
                          />
                      </RadarChart>
                  </ResponsiveContainer>
                  
                  {/* Radar Scanner Animation */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="w-[70%] h-[70%] border border-emerald-500/20 rounded-full animate-ping opacity-20" />
                       <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent absolute top-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite]" />
                  </div>
              </div>

              <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5 text-center z-10">
                  <p className="text-[9px] text-zinc-400 font-mono">
                      EL PERFIL ACTUAL ESTÁ OPTIMIZADO PARA <span className="text-emerald-500 font-bold">{profile.goal.toUpperCase()}</span>.
                  </p>
              </div>
          </Card>
      </div>
    </div>
  );
};
