
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { storage } from '../services/storage';
import { Card, Button, Badge } from '../components/UI';

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHTS = [20, 15, 10];

export const PlateCalculator = () => {
  const navigate = useNavigate();
  const [state] = useState(storage.load());
  const [targetWeight, setTargetWeight] = useState(60);
  const [barWeight, setBarWeight] = useState(20);

  // Configuración visual de los discos (Standard Color Coding + Cyberpunk Glow)
  const plateConfig: Record<number, { height: string, width: string, bgClass: string, shadow: string, text: string }> = {
    25:   { height: 'h-32 md:h-56', width: 'w-8 md:w-14', bgClass: 'bg-red-600', shadow: 'shadow-red-500/50', text: 'text-red-950' }, 
    20:   { height: 'h-32 md:h-56', width: 'w-7 md:w-12', bgClass: 'bg-blue-600', shadow: 'shadow-blue-500/50', text: 'text-blue-950' }, 
    15:   { height: 'h-28 md:h-48', width: 'w-6 md:w-10', bgClass: 'bg-yellow-500', shadow: 'shadow-yellow-500/50', text: 'text-yellow-950' }, 
    10:   { height: 'h-24 md:h-40', width: 'w-5 md:w-8',  bgClass: 'bg-emerald-600', shadow: 'shadow-emerald-500/50', text: 'text-emerald-950' }, 
    5:    { height: 'h-20 md:h-28', width: 'w-4 md:w-6',  bgClass: 'bg-white', shadow: 'shadow-white/50', text: 'text-black' }, 
    2.5:  { height: 'h-16 md:h-20', width: 'w-3 md:w-5',  bgClass: 'bg-zinc-800', shadow: 'shadow-black/50', text: 'text-zinc-400' }, 
    1.25: { height: 'h-12 md:h-14', width: 'w-2 md:w-4',  bgClass: 'bg-zinc-500', shadow: 'shadow-zinc-500/50', text: 'text-black' } 
  };

  const calculatedPlates = useMemo((): number[] => {
    let weightPerSide = (targetWeight - barWeight) / 2;
    if (weightPerSide <= 0) return [];
    const plates: number[] = [];
    let remaining = weightPerSide;
    AVAILABLE_PLATES.forEach(p => {
      while (remaining >= p - 0.01) { 
        plates.push(p);
        remaining -= p;
      }
    });
    return plates;
  }, [targetWeight, barWeight]);

  const groupedPlates = useMemo(() => {
    const counts: Record<number, number> = {};
    calculatedPlates.forEach(p => counts[p] = (counts[p] || 0) + 1);
    return Object.entries(counts).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
  }, [calculatedPlates]);

  // Filtrado de rutinas inteligentes
  const recommendedRoutines = useMemo(() => {
      if (!state.profile) return state.routines.slice(0, 3);
      
      const userGoal = state.profile.goal;
      const userExp = state.profile.experience || 'Intermedio';

      // Filtrar por objetivo principal
      let filtered = state.routines.filter(r => r.tags.includes(userGoal));
      
      // Si hay pocas, rellenar con rutinas de Fuerza o Generales
      if (filtered.length < 2) {
          filtered = [...filtered, ...state.routines.filter(r => r.tags.includes('Fuerza') || r.tags.includes('Full Body'))];
      }

      // Priorizar nivel de dificultad cercano al usuario
      filtered.sort((a, b) => {
          const aMatch = a.tags.includes(userExp) ? 1 : 0;
          const bMatch = b.tags.includes(userExp) ? 1 : 0;
          return bMatch - aMatch;
      });

      return filtered.slice(0, 3); // Mostrar top 3
  }, [state.routines, state.profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setTargetWeight(val);
    else if (e.target.value === '') setTargetWeight(0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] font-tech">SYSTEM MODULE // CALC_V4</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
                    Calculadora <span className="text-emerald-500 text-stroke">Táctica</span>
                </h1>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
                <div className="text-right">
                    <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peso Total</span>
                    <span className="text-2xl font-mono text-white font-bold">{targetWeight} kg</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-right">
                    <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">Discos/Lado</span>
                    <span className="text-2xl font-mono text-emerald-500 font-bold">{calculatedPlates.length}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: CONTROLS */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* CONTROL PANEL */}
                <div className="bg-[#0F1210] border border-white/10 p-6 rounded-[2rem] relative overflow-hidden shadow-2xl group">
                    {/* Animated Border Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    {/* 1. BARRA SELECTOR */}
                    <div className="relative z-10 mb-8">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 block">Peso de la Barra</span>
                        <div className="flex bg-[#050806] p-1.5 rounded-xl border border-white/5">
                            {BAR_WEIGHTS.map(w => (
                                <button
                                    key={w}
                                    onClick={() => { setBarWeight(w); if(targetWeight < w) setTargetWeight(w); }}
                                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
                                        barWeight === w 
                                        ? 'text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                                        : 'text-zinc-500 hover:text-white'
                                    }`}
                                >
                                    {barWeight === w && (
                                        <motion.div layoutId="barSelect" className="absolute inset-0 bg-emerald-500" />
                                    )}
                                    <span className="relative z-10">{w}kg</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. TARGET WEIGHT DIAL */}
                    <div className="relative z-10 mb-8 p-6 bg-[#050806] rounded-2xl border border-white/5 flex flex-col items-center">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">OBJETIVO (KG)</span>
                        <div className="flex items-center w-full justify-between gap-4">
                            <button 
                                onClick={() => setTargetWeight(prev => Math.max(barWeight, prev - 2.5))}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                            </button>
                            
                            <input 
                                type="number"
                                value={targetWeight === 0 ? '' : targetWeight}
                                onChange={handleInputChange}
                                className="bg-transparent text-6xl md:text-7xl font-black italic text-white tracking-tighter text-center outline-none w-full max-w-[200px] drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                placeholder="0"
                            />

                            <button 
                                onClick={() => setTargetWeight(prev => prev + 2.5)}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* 3. INVENTORY LIST */}
                    <div className="relative z-10">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            INVENTARIO REQUERIDO (POR LADO)
                        </span>
                        <div className="space-y-2">
                             <AnimatePresence mode='popLayout'>
                                {groupedPlates.length > 0 ? groupedPlates.map(([weightStr, count]) => {
                                    const w = parseFloat(weightStr);
                                    const conf = plateConfig[w];
                                    return (
                                        <motion.div 
                                            key={weightStr}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-[#050806] px-4 py-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-colors shadow-lg"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-8 rounded-sm ${conf.bgClass} shadow-[0_0_10px_currentColor] opacity-80`} />
                                                <span className="font-bold text-white text-lg font-mono">{weightStr} <span className="text-xs text-zinc-600">KG</span></span>
                                            </div>
                                            <div className="bg-white/5 px-3 py-1 rounded-md">
                                                <span className="font-black text-emerald-500 text-sm">x{count}</span>
                                            </div>
                                        </motion.div>
                                    );
                                }) : (
                                    <div className="p-6 text-center border-2 border-dashed border-white/5 rounded-xl">
                                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Esperando Carga...</p>
                                    </div>
                                )}
                             </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: HOLOGRAPHIC VISUALIZER */}
            <div className="lg:col-span-8 h-full min-h-[500px]">
                <div className="h-full bg-[#050806] rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-8 shadow-2xl">
                     
                     {/* Cyberpunk Grid Background */}
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
                     <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                     <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                     {/* Total Weight Display */}
                     <motion.div 
                        key={targetWeight}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-10 left-1/2 -translate-x-1/2 text-center z-20"
                     >
                         <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 rounded-full backdrop-blur-md mb-2">
                             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Visualización Activa</span>
                         </div>
                     </motion.div>

                     {/* --- THE BAR SETUP --- */}
                     <div className="relative w-full flex items-center justify-center py-20 perspective-[1000px]">
                        
                        {/* Bar Shaft (Glowing) */}
                        <div className="absolute w-full max-w-5xl h-4 md:h-6 bg-zinc-400 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] z-0 bg-gradient-to-b from-zinc-300 to-zinc-600" />

                        {/* Center Hub */}
                        <div className="relative z-20 w-24 h-24 md:w-32 md:h-32 bg-[#1a1f1c] rounded-full border-4 border-zinc-700 shadow-2xl flex flex-col items-center justify-center">
                             <div className="absolute inset-0 rounded-full border border-white/5 animate-spin-slow" />
                             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">ARGON</span>
                             <span className="text-3xl font-black text-white italic">{barWeight}</span>
                        </div>

                        {/* LEFT SIDE PLATES */}
                        <div className="absolute right-1/2 mr-14 md:mr-18 h-full flex flex-row-reverse items-center gap-1 z-10">
                            <AnimatePresence mode='popLayout'>
                                {calculatedPlates.map((p, i) => {
                                    const conf = plateConfig[p];
                                    return (
                                        <motion.div
                                            key={`l-${i}`}
                                            layout
                                            initial={{ x: -100, opacity: 0, rotateY: 45 }}
                                            animate={{ x: 0, opacity: 1, rotateY: 0 }}
                                            exit={{ x: -50, opacity: 0, scale: 0.8 }}
                                            transition={{ type: "spring", stiffness: 150, damping: 18, mass: 0.8 }}
                                            className={`rounded-[3px] border-l border-t border-white/30 relative overflow-hidden ${conf.width} ${conf.height} ${conf.bgClass} ${conf.shadow} shadow-lg backdrop-blur-sm`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/20 pointer-events-none" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-center w-full">
                                                <span className={`text-[8px] md:text-xs font-black ${conf.text} tracking-tighter opacity-90`}>{p}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* RIGHT SIDE PLATES */}
                        <div className="absolute left-1/2 ml-14 md:ml-18 h-full flex items-center gap-1 z-10">
                             <AnimatePresence mode='popLayout'>
                                {calculatedPlates.map((p, i) => {
                                    const conf = plateConfig[p];
                                    return (
                                        <motion.div
                                            key={`r-${i}`}
                                            layout
                                            initial={{ x: 100, opacity: 0, rotateY: -45 }}
                                            animate={{ x: 0, opacity: 1, rotateY: 0 }}
                                            exit={{ x: 50, opacity: 0, scale: 0.8 }}
                                            transition={{ type: "spring", stiffness: 150, damping: 18, mass: 0.8 }}
                                            className={`rounded-[3px] border-r border-t border-white/30 relative overflow-hidden ${conf.width} ${conf.height} ${conf.bgClass} ${conf.shadow} shadow-lg backdrop-blur-sm`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-transparent to-black/20 pointer-events-none" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 text-center w-full">
                                                <span className={`text-[8px] md:text-xs font-black ${conf.text} tracking-tighter opacity-90`}>{p}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                     </div>
                </div>
            </div>
        </div>

        {/* --- PERSONALIZED RECOMMENDATIONS (NEW & IMPROVED) --- */}
        <div className="mt-24 border-t border-white/5 pt-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 px-2">
                <div>
                    <Badge color="emerald" className="mb-2">AI RECOMMENDED</Badge>
                    <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                        Protocolos Sugeridos
                    </h3>
                    <p className="text-zinc-500 text-sm mt-1">
                        Basado en tu perfil: <span className="text-white font-bold">{state.profile?.goal}</span> ({state.profile?.experience})
                    </p>
                </div>
                <Button onClick={() => navigate('/routines')} variant="secondary" className="text-xs h-10 px-6">
                    VER LIBRERÍA COMPLETA
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedRoutines.map((routine, idx) => (
                    <Card 
                        key={routine.id}
                        onClick={() => navigate(`/routine/${routine.id}`)}
                        className="group cursor-pointer hover:border-emerald-500/40 bg-[#0F1210] p-0 overflow-hidden transition-all duration-500 hover:-translate-y-1"
                    >
                         <div className="h-40 relative overflow-hidden">
                             <img src={routine.imageUrl} alt={routine.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#0F1210] to-transparent" />
                             
                             {/* Match Percentage Badge */}
                             <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                 {95 - (idx * 5)}% MATCH
                             </div>
                         </div>
                         
                         <div className="p-6 relative z-10 -mt-10">
                             <div className="flex gap-2 mb-3">
                                 {routine.tags.slice(0, 2).map(t => (
                                     <span key={t} className="text-[9px] font-bold text-zinc-300 border border-white/10 px-2 py-1 rounded bg-black/60 backdrop-blur-md uppercase tracking-wider">{t}</span>
                                 ))}
                             </div>
                             
                             <h4 className="text-xl font-black italic uppercase text-white mb-2 leading-none group-hover:text-emerald-400 transition-colors">{routine.name}</h4>
                             
                             <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                 <div className="flex items-center gap-2 text-zinc-500">
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                     <span className="text-xs font-bold">{routine.duration} MIN</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mr-2">INTENSIDAD</span>
                                     {Array.from({length: 5}).map((_, i) => (
                                         <div key={i} className={`w-1 h-3 rounded-sm ${i < (routine.intensity / 20) ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                                     ))}
                                 </div>
                             </div>
                         </div>
                    </Card>
                ))}
            </div>
        </div>

    </div>
  );
};
