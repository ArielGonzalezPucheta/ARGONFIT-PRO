
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { storage } from '../services/storage';
import { WorkoutSession, SetRecord, ExerciseTemplate } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Workout = () => {
  const [state, setState] = useState(storage.load());
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const restIntervalRef = useRef<number | null>(null);

  // State for the "Tech Guide" Drawer
  const [activeGuideExercise, setActiveGuideExercise] = useState<ExerciseTemplate | null>(null);

  // Metric Mode: RIR (Reps In Reserve) or RPE (Rate of Perceived Exertion)
  const [metricMode, setMetricMode] = useState<'RIR' | 'RPE'>('RIR');

  useEffect(() => {
    if (!state.activeSession) {
      const routine = state.routines[0];
      const lastSession = state.sessions.find(s => s.routineId === routine.id);

      const newSession: WorkoutSession = {
        id: Math.random().toString(36).substr(2, 9),
        routineId: routine.id,
        routineName: routine.name,
        date: new Date().toISOString(),
        startTime: Date.now(),
        durationMinutes: 0,
        totalVolume: 0,
        exercises: routine.exercises.map(ex => {
          const lastExData = lastSession?.exercises.find(le => le.id === ex.exerciseId);
          return {
            id: ex.exerciseId,
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: Array.from({ length: ex.suggestedSets }, (_, i) => ({
              id: Math.random().toString(36).substr(2, 9),
              weight: lastExData?.sets[i]?.weight || 0,
              reps: lastExData?.sets[i]?.reps || 0,
              rir: 2,
              completed: false
            }))
          };
        })
      };
      const newState = { ...state, activeSession: newSession };
      setState(newState);
      storage.save(newState);
    }

    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const startRest = () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);

    setRestTimer(60);
    restIntervalRef.current = window.setInterval(() => {
      setRestTimer(t => {
        if (t !== null && t > 0) return t - 1;
        if (restIntervalRef.current) clearInterval(restIntervalRef.current);
        return null;
      });
    }, 1000);
  };

  const updateSet = (exerciseIdx: number, setIdx: number, data: Partial<SetRecord>) => {
    if (!state.activeSession) return;
    const newSession = { ...state.activeSession };
    const currentSet = newSession.exercises[exerciseIdx].sets[setIdx];

    const isTogglingComplete = data.completed !== undefined && data.completed !== currentSet.completed;

    newSession.exercises[exerciseIdx].sets[setIdx] = { ...currentSet, ...data };

    if (isTogglingComplete && data.completed === true) {
      startRest();
    }

    setState({ ...state, activeSession: newSession });
    storage.save({ ...state, activeSession: newSession });
  };

  const finishWorkout = () => {
    if (!state.activeSession) return;
    const totalVolume = state.activeSession.exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((sAcc, s) => s.completed ? sAcc + (s.weight * s.reps) : sAcc, 0), 0);

    const completedSession: WorkoutSession = {
      ...state.activeSession,
      endTime: Date.now(),
      durationMinutes: Math.floor(elapsed / 60),
      totalVolume
    };

    const today = new Date().toDateString();
    const lastWorkoutDate = state.profile?.lastWorkoutDate ? new Date(state.profile.lastWorkoutDate).toDateString() : null;
    let newStreak = state.profile?.streak || 0;

    if (lastWorkoutDate !== today) {
      newStreak += 1;
    }

    const newState = {
      ...state,
      sessions: [completedSession, ...state.sessions],
      activeSession: null,
      profile: {
        ...state.profile!,
        streak: newStreak,
        lastWorkoutDate: new Date().toISOString()
      }
    };

    // Save to local storage
    setState(newState);
    storage.save(newState);

    // Explicitly save session to Supabase History Table
    storage.addSessionToCloud(completedSession);

    navigate('/');
  };

  const openGuide = (exerciseId: string) => {
    const routineId = state.activeSession?.routineId;
    const routine = state.routines.find(r => r.id === routineId);
    const template = routine?.exercises.find(e => e.exerciseId === exerciseId);
    if (template) {
      setActiveGuideExercise(template);
    }
  };

  const getFallbackImage = (muscle: string) => {
    const map: Record<string, string> = {
      'Pecho': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop',
      'Espalda': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=800&auto=format&fit=crop',
      'Piernas': 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?q=80&w=800&auto=format&fit=crop',
      'Hombros': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop',
      'Bíceps': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop',
      'Tríceps': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop',
      'Core': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop',
      'Cardio': 'https://images.unsplash.com/photo-1538805060512-e282813563bd?q=80&w=800&auto=format&fit=crop'
    };
    return map[muscle] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop';
  };

  const toggleMetricMode = () => {
    setMetricMode(prev => prev === 'RIR' ? 'RPE' : 'RIR');
  };

  if (!state.activeSession) return null;

  return (
    <div className="min-h-screen pb-40 bg-[#050806] -mx-4 md:-mx-8 -mt-8 relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 bg-[#050806]/80 backdrop-blur-xl z-50 border-b border-white/5 px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_2s_infinite]" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">LIVE SESSION</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black italic uppercase text-white tracking-tighter leading-none">{state.activeSession.routineName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">TIEMPO TOTAL</span>
              <span className="font-mono text-2xl text-emerald-500 font-bold tabular-nums">
                {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Button variant="primary" className="h-12 px-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105" onClick={finishWorkout}>
              TERMINAR
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Timer Bar (below header) */}
      <div className="md:hidden bg-[#0A0F0D] border-b border-white/5 py-2 px-4 flex justify-center">
        <span className="font-mono text-xl text-emerald-500 font-bold tabular-nums tracking-wider">
          {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 space-y-8">
        {/* ... (Workout content) ... */}
        <AnimatePresence>
          {restTimer !== null && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#151B18] border border-emerald-500/30 p-4 rounded-2xl shadow-2xl flex items-center gap-6 w-[90%] md:w-auto min-w-[300px]"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#1f2937" strokeWidth="4" fill="none" />
                  <circle cx="32" cy="32" r="28" stroke="#10B981" strokeWidth="4" fill="none" strokeDasharray="175" strokeDashoffset={175 - (175 * restTimer) / 60} className="transition-all duration-1000 ease-linear" />
                </svg>
                <span className="absolute text-xl font-bold text-white tabular-nums">{restTimer}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">DESCANSO SUGERIDO</p>
                <p className="text-white font-medium text-sm">Recupérate para el siguiente set.</p>
              </div>
              <button onClick={() => setRestTimer(null)} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-black uppercase hover:bg-emerald-500/20">
                SALTAR
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {state.activeSession.exercises.map((ex, exIdx) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: exIdx * 0.05 }}
            className="group"
          >
            <div className="flex items-end justify-between mb-4 pl-2 border-l-4 border-emerald-500">
              <div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-1">{ex.muscleGroup}</span>
                <h3 className="text-2xl md:text-3xl font-black italic uppercase text-white tracking-tighter leading-none">{ex.name}</h3>
              </div>
              <button
                onClick={() => openGuide(ex.id)}
                className="text-xs font-bold text-emerald-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20"
              >
                Guía Técnica <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>

            <div className="bg-[#101412] border border-white/5 rounded-3xl overflow-hidden shadow-lg relative">
              <div className="grid grid-cols-12 gap-2 py-3 px-4 bg-[#151B18] border-b border-white/5 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">
                <div className="col-span-1">SET</div>
                <div className="col-span-4">KG</div>
                <div className="col-span-3">REPS</div>
                <div
                  className="col-span-2 cursor-pointer hover:text-emerald-500 transition-colors flex items-center justify-center gap-1"
                  onClick={toggleMetricMode}
                  title="Click para cambiar métrica"
                >
                  {metricMode} <span className="text-[8px] opacity-50">⇄</span>
                </div>
                <div className="col-span-2">DONE</div>
              </div>

              <div className="p-2 space-y-1">
                {ex.sets.map((set, setIdx) => {
                  // Logic to display RPE if selected
                  const displayValue = metricMode === 'RPE'
                    ? (set.rir !== undefined ? 10 - set.rir : '')
                    : (set.rir !== undefined ? set.rir : '');

                  return (
                    <motion.div
                      key={set.id}
                      layout
                      initial={false}
                      animate={{
                        backgroundColor: set.completed ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                        opacity: set.completed ? 0.6 : 1
                      }}
                      className={`grid grid-cols-12 gap-2 items-center py-3 px-2 rounded-xl border transition-all duration-300 ${set.completed ? 'border-emerald-500/10' : 'border-transparent hover:bg-white/5'
                        }`}
                    >
                      <div className="col-span-1 flex justify-center">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${set.completed ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                          {setIdx + 1}
                        </div>
                      </div>

                      <div className="col-span-4 px-1">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            className={`w-full bg-[#0A0F0D] border ${set.completed ? 'border-emerald-500/20 text-emerald-500' : 'border-white/10 text-white focus:border-emerald-500'} rounded-lg py-3 text-center text-lg font-black outline-none transition-all placeholder:text-zinc-700 tabular-nums`}
                            value={set.weight || ''}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              updateSet(exIdx, setIdx, { weight: isNaN(val) ? 0 : Math.max(0, val) });
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-bold pointer-events-none">KG</span>
                        </div>
                      </div>

                      <div className="col-span-3 px-1">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          className={`w-full bg-[#0A0F0D] border ${set.completed ? 'border-emerald-500/20 text-emerald-500' : 'border-white/10 text-white focus:border-emerald-500'} rounded-lg py-3 text-center text-lg font-black outline-none transition-all placeholder:text-zinc-700 tabular-nums`}
                          value={set.reps || ''}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            updateSet(exIdx, setIdx, { reps: isNaN(val) ? 0 : Math.max(0, val) });
                          }}
                        />
                      </div>

                      <div className="col-span-2 px-1">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          inputMode="numeric"
                          placeholder="-"
                          className="w-full bg-transparent border-b-2 border-white/10 py-2 text-center text-sm font-bold text-zinc-400 outline-none focus:border-orange-500 focus:text-orange-500 transition-colors placeholder:text-zinc-800 tabular-nums"
                          value={displayValue}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              // Store always as RIR
                              const rirValue = metricMode === 'RPE' ? Math.max(0, 10 - val) : val;
                              updateSet(exIdx, setIdx, { rir: rirValue });
                            } else {
                              updateSet(exIdx, setIdx, { rir: undefined }); // Clear value? Types might expect number
                            }
                          }}
                        />
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => updateSet(exIdx, setIdx, { completed: !set.completed })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${set.completed
                            ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-600 border border-white/5 hover:border-white/20 hover:text-white'
                            }`}
                        >
                          {set.completed ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <div className="w-4 h-4 rounded-md border-2 border-current opacity-50" />
                          )}
                        </motion.button>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}

        <div className="pt-8 pb-12">
          <div className="bg-[#151B18] border border-white/5 rounded-3xl p-8 text-center space-y-4">
            <h3 className="text-xl font-black italic text-white uppercase">¿Terminaste por hoy?</h3>
            <p className="text-zinc-400 max-w-md mx-auto">Asegúrate de haber registrado todos tus sets. El descanso es donde ocurre el crecimiento.</p>
            <Button variant="primary" className="w-full max-w-sm mx-auto h-14 text-lg shadow-[0_0_30px_rgba(16,185,129,0.2)]" onClick={finishWorkout}>
              FINALIZAR ENTRENAMIENTO
            </Button>
          </div>
        </div>
      </div>

      {/* --- TECH GUIDE DRAWER/MODAL --- */}
      <AnimatePresence>
        {activeGuideExercise && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveGuideExercise(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full md:w-[600px] h-full bg-[#101412] border-l border-white/10 shadow-2xl overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="mb-2">{activeGuideExercise.muscleGroup}</Badge>
                    <h2 className="text-3xl font-black italic uppercase text-white leading-none">{activeGuideExercise.name}</h2>
                  </div>
                  <button onClick={() => setActiveGuideExercise(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Video Container (Replaced with Image) */}
                {/* Video Container */}
                <div className="aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-lg">
                  {activeGuideExercise.videoUrl ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={activeGuideExercise.videoUrl.replace("watch?v=", "embed/")}
                      title={activeGuideExercise.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <img
                        src={activeGuideExercise.imageUrl || getFallbackImage(activeGuideExercise.muscleGroup)}
                        alt={activeGuideExercise.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[9px] text-zinc-400 font-bold uppercase tracking-widest border border-white/10">
                        {activeGuideExercise.imageUrl ? 'IMAGEN TÉCNICA' : 'REFERENCIA VISUAL'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">Ejecución Técnica</h4>
                    <div className="bg-[#151B18] rounded-xl p-6 border border-white/5 leading-relaxed text-zinc-300 font-medium">
                      {activeGuideExercise.howTo || "Concéntrate en la fase excéntrica del movimiento (bajada) y explota en la concéntrica (subida). Mantén la tensión constante."}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Enfoque</h5>
                      <p className="text-white text-sm font-bold">Hipertrofia / Fuerza</p>
                    </div>
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                      <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Dificultad</h5>
                      <p className="text-white text-sm font-bold">{activeGuideExercise.difficulty || 'Intermedio'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Pro Tip</h4>
                    <div className="flex items-start gap-4 p-4 border-l-2 border-emerald-500 bg-gradient-to-r from-emerald-500/5 to-transparent">
                      <div className="pt-1">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <p className="text-sm text-zinc-300 italic">
                        {activeGuideExercise.benefits || "Mantén el core apretado para proteger tu espalda baja y maximizar la transferencia de fuerza."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
