
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '../components/UI';
import { storage } from '../services/storage';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export const CalendarView = () => {
  const [state] = useState(storage.load());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate()); // Default select today
  const navigate = useNavigate();

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();

  // Completed Sessions Map
  const sessionsMap = state.sessions.reduce((acc, s) => {
    const d = new Date(s.date).getDate();
    const m = new Date(s.date).getMonth();
    const y = new Date(s.date).getFullYear();
    if (m === currentDate.getMonth() && y === currentDate.getFullYear()) {
      acc[d] = s;
    }
    return acc;
  }, {} as Record<number, any>);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDay(null);
  };

  // Helper: Get Routine Scheduled for a specific date (Deterministic cycle based on day index)
  const getPlannedRoutine = (day: number) => {
    if (state.routines.length === 0) return null;
    // Simple logic: Cycle through routines based on day of month to simulate a schedule
    // In a real app, this would check a 'schedule' array in the DB.
    const routineIndex = (day - 1) % state.routines.length;
    return state.routines[routineIndex];
  };

  // Helper: Get Nutrition for a specific date (Based on Day of Week)
  const getNutritionForDay = (dayOfMonth: number) => {
      if (!state.nutritionPlan?.weekly) return null;
      const date = new Date(year, currentDate.getMonth(), dayOfMonth);
      const dayOfWeek = date.getDay(); 
      // Adjust Sunday (0) to be index 6, others shift down by 1 if array is Mon-Sun
      const arrayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
      return { 
          data: state.nutritionPlan.weekly[arrayIndex],
          index: arrayIndex,
          dayName: date.toLocaleDateString('es-ES', { weekday: 'long' })
      };
  };

  const handleDayClick = (dayOfMonth: number) => {
      setSelectedDay(dayOfMonth === selectedDay ? null : dayOfMonth);
  };

  const navigateToRoutine = () => {
      if (!selectedDay) return;
      const session = sessionsMap[selectedDay];
      const planned = getPlannedRoutine(selectedDay);
      
      // If session exists (completed), go to history or detail. 
      // For now, let's go to routine detail so they can see what they did/planned.
      if (session) {
         // If we had a session view, we'd go there. For now, go to the routine used.
         const routineId = state.routines.find(r => r.name === session.routineName)?.id || planned?.id;
         if (routineId) navigate(`/routine/${routineId}`);
      } else if (planned) {
         navigate(`/routine/${planned.id}`);
      }
  };

  const navigateToNutrition = () => {
      if (!selectedDay) return;
      const nutritionInfo = getNutritionForDay(selectedDay);
      if (nutritionInfo) {
          navigate('/nutrition', { state: { selectedDayIndex: nutritionInfo.index } });
      }
  };

  // Chart Data
  const monthlyChartData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const session = sessionsMap[day];
      return { day, volume: session ? session.totalVolume : 0 };
  });

  // Derived state for the selected day panel
  const selectedSession = selectedDay ? sessionsMap[selectedDay] : null;
  const selectedPlannedRoutine = selectedDay ? getPlannedRoutine(selectedDay) : null;
  const selectedNutrition = selectedDay ? getNutritionForDay(selectedDay) : null;
  const isSelectedToday = selectedDay === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700 space-y-4 pb-24">
      
      {/* --- HEADER --- */}
      <header className="flex justify-between items-end flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] font-mono">TACTICAL LOG</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white font-heading">
            {monthName} <span className="text-zinc-600 text-xl not-italic font-sans ml-1">{year}</span>
          </h1>
        </div>
        
        {/* Compact Navigator */}
        <div className="flex items-center gap-1 bg-[#0F1210] rounded-lg border border-emerald-500/20 p-1">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-emerald-500/10 rounded-md text-zinc-400 hover:text-white transition-colors">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-emerald-500/10 rounded-md text-zinc-400 hover:text-white transition-colors">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </header>

      {/* --- THE CALENDAR GRID --- */}
      <Card className="p-4 bg-[#0F1210] border-white/5 relative overflow-hidden backdrop-blur-xl flex-shrink-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        <div className="relative z-10">
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                    <div key={d} className="text-center text-[8px] font-black text-zinc-600 uppercase font-mono">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 md:gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const session = sessionsMap[day];
                    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                    const isSelected = selectedDay === day;
                    const planned = getPlannedRoutine(day);
                    
                    return (
                    <motion.div 
                        key={day}
                        layout
                        onClick={() => handleDayClick(day)}
                        className={`
                            relative h-14 md:h-20 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all group
                            ${isSelected 
                                ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] z-10 scale-105' 
                                : session 
                                    ? 'bg-emerald-900/10 border-emerald-500/30 hover:border-emerald-500/60' 
                                    : 'bg-[#151B18] border-white/5 hover:bg-white/5 hover:border-white/10'
                            }
                        `}
                    >
                        <span className={`text-[10px] font-mono font-bold absolute top-1 left-1.5 ${isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>{day}</span>
                        
                        {/* Indicators */}
                        <div className="flex flex-col items-center gap-1 mt-2">
                            {/* Workout Dot */}
                            {session ? (
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_currentColor]" />
                            ) : (
                                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full group-hover:bg-zinc-500 transition-colors" />
                            )}
                            
                            {/* Nutrition Line */}
                            <div className={`w-4 h-0.5 rounded-full ${session ? 'bg-blue-500/50' : 'bg-zinc-800 group-hover:bg-zinc-600'}`} />
                        </div>

                        {/* Planned Overlay Text (Desktop) */}
                        <span className="hidden md:block text-[7px] text-zinc-600 uppercase mt-1 px-1 truncate w-full text-center">
                            {session ? 'DONE' : planned?.tags[0] || 'REST'}
                        </span>
                    </motion.div>
                    );
                })}
            </div>
        </div>
      </Card>

      {/* --- DETAIL PANEL (LANDING STYLE) --- */}
      <AnimatePresence mode="wait">
        {selectedDay && (
            <motion.div
                key={selectedDay}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1"
            >
                {/* --- CARD 1: WORKOUT PLAN --- */}
                <Card 
                    className="p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer border-emerald-500/20 hover:border-emerald-500/50 transition-colors"
                    onClick={navigateToRoutine}
                >
                    {/* Background Routine Image */}
                    {selectedPlannedRoutine?.imageUrl && (
                        <div className="absolute inset-0 z-0">
                            <img src={selectedPlannedRoutine.imageUrl} className="w-full h-full object-cover opacity-10 group-hover:opacity-20 group-hover:scale-105 transition-all duration-700" alt="Routine BG" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F0D] to-transparent" />
                        </div>
                    )}
                    
                    <div className="relative z-10 flex justify-between items-start mb-2">
                        <Badge color={selectedSession ? 'emerald' : 'zinc'}>
                            {selectedSession ? 'COMPLETADO' : isSelectedToday ? 'PARA HOY' : 'PLANIFICADO'}
                        </Badge>
                        <div className="p-2 bg-white/5 rounded-full text-zinc-400 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-1">
                        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Protocolo Físico</h3>
                        <h2 className="text-2xl font-black italic text-white uppercase leading-none truncate">
                            {selectedSession ? selectedSession.routineName : (selectedPlannedRoutine?.name || "Descanso Activo")}
                        </h2>
                        <div className="flex gap-3 text-xs text-zinc-400 font-mono pt-2">
                            <span>{selectedPlannedRoutine?.exercises.length || 0} EJERCICIOS</span>
                            <span>{selectedPlannedRoutine?.duration || 0} MIN</span>
                            <span className="text-emerald-500">{selectedPlannedRoutine?.tags[0]}</span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white transition-colors">
                            {selectedSession ? 'Ver Resultados' : 'Iniciar Secuencia'} <span className="text-lg leading-none">→</span>
                        </div>
                    </div>
                </Card>

                {/* --- CARD 2: NUTRITION PLAN --- */}
                <Card 
                    className="p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer border-blue-500/20 hover:border-blue-500/50 transition-colors"
                    onClick={navigateToNutrition}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>

                    <div className="relative z-10 flex justify-between items-start mb-2">
                        <Badge color="blue">
                            {selectedNutrition?.dayName.toUpperCase() || 'PLAN'}
                        </Badge>
                        <div className="p-2 bg-white/5 rounded-full text-zinc-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-1">
                        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Plan Nutricional</h3>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-black italic text-white uppercase leading-none">
                                {selectedNutrition?.data.dailyMacros.calories || 0}
                            </h2>
                            <span className="text-xs font-bold text-blue-400 uppercase">KCAL</span>
                        </div>
                        
                        {/* Macro Mini-Bars */}
                        <div className="flex gap-1 mt-3 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: '30%' }} />
                            <div className="bg-blue-500 h-full" style={{ width: '40%' }} />
                            <div className="bg-orange-500 h-full" style={{ width: '30%' }} />
                        </div>
                        <div className="flex justify-between text-[8px] text-zinc-500 font-mono mt-1 uppercase">
                            <span>PRO</span>
                            <span>CARB</span>
                            <span>FAT</span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 group-hover:text-white transition-colors">
                            Ver Menú Detallado <span className="text-lg leading-none">→</span>
                        </div>
                    </div>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
