
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar } from 'recharts';
import { Card, Button, Badge } from '../components/UI';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';
import { paymentService } from '../services/payment';
import { NutritionPlan, Meal, DailyPlan } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B'];

export const Nutrition = () => {
    const [state, setState] = useState(storage.load());
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<NutritionPlan | undefined>(state.nutritionPlan);
    const [selectedMeal, setSelectedMeal] = useState<{ type: string; data: Meal } | null>(null);
    const [activeMacroIndex, setActiveMacroIndex] = useState<number | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    const hasAccess = paymentService.hasAccess(state.profile, 'nutrition');

    // RUNTIME VERIFICATION LOGS
    useEffect(() => {
        console.group("Nutrition Logic Audit");
        console.log("Current Profile:", state.profile);
        console.log("Subscription:", state.profile?.subscription);
        console.log("Plan:", state.profile?.subscription?.plan);
        console.log("Status:", state.profile?.subscription?.status);
        console.log("Has Access:", hasAccess);
        console.groupEnd();
    }, [state.profile, hasAccess]);

    useEffect(() => {
        if (location.state?.selectedDayIndex !== undefined) {
            setSelectedDayIndex(location.state.selectedDayIndex);
        }
    }, [location]);

    const generatePlan = async () => {
        if (!state.profile) return;
        setLoading(true);
        const newPlan = await aiService.generateNutritionPlan(state.profile, state.language);
        if (newPlan) {
            setPlan(newPlan);
            const newState = { ...state, nutritionPlan: newPlan };
            setState(newState);
            storage.save(newState);
        }
        setLoading(false);
    };

    if (!state.profile) return null;

    // --- LOCKED STATE ---
    if (!hasAccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto animate-in fade-in duration-700">
                <div className="bg-[#101412] p-12 rounded-[3rem] border border-white/10 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                        <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>

                    <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-4">
                        Acceso Restringido
                    </h1>
                    <p className="text-zinc-400 text-lg mb-8">
                        El módulo de Nutrición Adaptativa IA requiere un plan <span className="text-emerald-500 font-bold">PRO</span> o <span className="text-blue-500 font-bold">ELITE</span>.
                    </p>

                    <Button onClick={() => navigate('/subscription')} className="h-14 px-10 w-full text-xs shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        DESBLOQUEAR AHORA
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-8">
                <div className="relative w-32 h-32">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <div className="absolute inset-4 border-4 border-blue-500/20 border-b-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-black italic uppercase text-white animate-pulse">
                        Procesando Bio-Datos...
                    </h2>
                    <div className="mt-4 flex gap-2 justify-center">
                        <Badge color="zinc">Analizando Metabolismo</Badge>
                    </div>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto animate-in fade-in duration-700">
                <Card className="mb-10 p-12 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <svg className="w-24 h-24 text-emerald-500/50 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter mb-4">
                        Plan Nutricional IA
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Genera una matriz dietética basada en evidencia científica, adaptada a tu firma biométrica.
                    </p>
                </Card>
                <Button onClick={generatePlan} className="h-18 px-12 text-sm w-full md:w-auto">
                    Inicializar Generador
                </Button>
            </div>
        );
    }

    // Determine current day data
    const weeklyPlan = plan.weekly || [];
    const currentDailyPlan: DailyPlan | null = weeklyPlan.length > 0 ? weeklyPlan[selectedDayIndex] : null;

    const activeMeals = currentDailyPlan ? currentDailyPlan.meals : plan.meals;
    const activeDailyMacros = currentDailyPlan ? currentDailyPlan.dailyMacros : plan.dailyMacros;

    const macroData = [
        { name: state.language === 'es' ? 'Proteína' : 'Protein', value: activeDailyMacros?.protein || 0, color: COLORS[0], cal: (activeDailyMacros?.protein || 0) * 4 },
        { name: state.language === 'es' ? 'Carbos' : 'Carbs', value: activeDailyMacros?.carbs || 0, color: COLORS[1], cal: (activeDailyMacros?.carbs || 0) * 4 },
        { name: state.language === 'es' ? 'Grasas' : 'Fats', value: activeDailyMacros?.fats || 0, color: COLORS[2], cal: (activeDailyMacros?.fats || 0) * 9 },
    ];

    const activeMacro = activeMacroIndex !== null ? macroData[activeMacroIndex] : null;

    return (
        <div className="pb-24 space-y-12 animate-in slide-in-from-bottom-4 duration-700 relative">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Badge color="emerald">AI OPTIMIZED</Badge>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                            SYNC_ID: {new Date(plan.lastUpdated).getTime().toString().substr(-6)}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
                        Protocolo <span className="text-emerald-500">{plan.dietType}</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mt-4 text-lg font-medium leading-relaxed border-l-2 border-emerald-500/30 pl-4">{plan.description}</p>
                </div>
                <div className="bg-[#101412] p-6 rounded-2xl border border-white/5 min-w-[200px] text-center">
                    <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">OBJETIVO DIARIO</span>
                    <span className="text-6xl font-black italic text-white tracking-tighter leading-none">{activeDailyMacros?.calories || 0}</span>
                    <span className="block text-emerald-500 font-black text-xs uppercase tracking-widest mt-1">KILOCALORÍAS</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* MACRO CHART CARD */}
                <Card className="flex flex-col items-center justify-between p-8 lg:col-span-1 min-h-[450px] relative">
                    <div className="absolute top-4 left-6">
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Distribución Energética</h3>
                    </div>

                    <div className="w-full aspect-square relative max-w-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={macroData}
                                    innerRadius="60%"
                                    outerRadius="80%"
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                    onMouseEnter={(_, index) => setActiveMacroIndex(index)}
                                    onMouseLeave={() => setActiveMacroIndex(null)}
                                >
                                    {macroData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            opacity={activeMacroIndex === null || activeMacroIndex === index ? 1 : 0.2}
                                            stroke={activeMacroIndex === index ? '#fff' : 'none'}
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className={`text-5xl font-black italic tracking-tighter transition-colors ${activeMacro ? 'text-white' : 'text-zinc-700'}`}>
                                {activeMacro ? activeMacro.value : (activeDailyMacros?.calories || 0)}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: activeMacro ? activeMacro.color : '#52525b' }}>
                                {activeMacro ? 'GRAMOS' : 'TOTAL'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 w-full mt-4">
                        {macroData.map((m, i) => (
                            <div
                                key={m.name}
                                onMouseEnter={() => setActiveMacroIndex(i)}
                                onMouseLeave={() => setActiveMacroIndex(null)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${activeMacroIndex === i ? 'bg-white/5 border-white/20' : 'bg-transparent border-transparent hover:bg-white/5'
                                    }`}
                            >
                                <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ backgroundColor: m.color }} />
                                <span className="text-xl font-black text-white">{m.value}g</span>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{m.name}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* HYDRATION CARD */}
                    <Card variant="active" className="relative overflow-hidden flex flex-col justify-between p-0 h-full">
                        {/* Background Wave Animation */}
                        <div className="absolute inset-0 z-0 bg-[#0f172a] overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 opacity-80"
                                style={{
                                    maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 320\'%3E%3Cpath fill=\'%23000\' fill-opacity=\'1\' d=\'M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\'%3E%3C/path%3E%3C/svg%3E")',
                                    maskSize: '200% 100%',
                                    animation: 'wave 15s linear infinite'
                                }}
                            ></div>
                            <style>{`
                         @keyframes wave {
                           0% { mask-position: 0% 0%; }
                           100% { mask-position: 100% 0%; }
                         }
                       `}</style>
                        </div>

                        <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <h4 className="text-xs font-black text-blue-200 uppercase tracking-[0.2em] bg-blue-900/40 px-3 py-1 rounded-full border border-blue-500/30 backdrop-blur-md">Hidratación</h4>
                                <svg className="w-8 h-8 text-blue-300 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>

                            <div className="mt-8">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-7xl font-black italic text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{plan.hydrationGoal}</span>
                                    <span className="text-2xl font-bold text-blue-200 uppercase">Litros</span>
                                </div>
                                <p className="text-blue-200/70 text-sm mt-2 font-medium max-w-[200px]">Objetivo diario para maximizar rendimiento cognitivo y físico.</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-0 flex flex-col relative overflow-hidden border-emerald-500/10 h-full bg-[#0F1210]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Suplementación</h4>
                            <Badge color="zinc">CHEMISTRY</Badge>
                        </div>
                        <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                            {plan.supplements && plan.supplements.map((sup, idx) => (
                                <a
                                    key={sup}
                                    href={`https://www.google.com/search?q=${encodeURIComponent(sup + ' benefits evidence')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-4 p-3 rounded-xl bg-[#0A0F0D] border border-white/5 hover:border-emerald-500/30 hover:bg-[#121614] transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-600 group-hover:text-emerald-500 group-hover:border group-hover:border-emerald-500/20 transition-all">
                                        {idx + 1}
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white">{sup}</span>
                                    <svg className="w-4 h-4 text-zinc-700 ml-auto group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <div className="space-y-8 pt-8">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-white" />
                    <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">Matriz de Ingesta {currentDailyPlan ? `// ${currentDailyPlan.day.toUpperCase()}` : ''}</h3>
                </div>

                {/* DAY SELECTOR MOVED HERE */}
                {weeklyPlan.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                        {weeklyPlan.map((dayPlan, idx) => {
                            const isLocked = !hasAccess && idx > 0;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDayIndex(idx)}
                                    className={`flex-1 min-w-[100px] p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden ${selectedDayIndex === idx
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                        : isLocked
                                            ? 'bg-red-900/10 border-red-500/20 text-zinc-600 opacity-70 cursor-not-allowed hover:bg-red-900/20'
                                            : 'bg-[#101412] border-white/5 text-zinc-500 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-xs font-black uppercase tracking-widest">{dayPlan.day}</span>
                                    {selectedDayIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                    {isLocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {(!hasAccess && selectedDayIndex > 0) ? (
                    <div className="col-span-1 md:col-span-2 xl:col-span-4 h-96 flex flex-col items-center justify-center bg-[#101412] border border-dashed border-zinc-800 rounded-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05),transparent_70%)]" />

                        <div className="w-16 h-16 bg-red-900/10 rounded-full flex items-center justify-center mb-6 border border-white/5 relative z-10 group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-8 h-8 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>

                        <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter mb-2 relative z-10">
                            Día {weeklyPlan[selectedDayIndex].day} Bloqueado
                        </h3>
                        <p className="text-zinc-500 max-w-sm text-center mb-8 relative z-10">
                            La periodización nutricional completa está reservada para atletas PRO y ELITE.
                        </p>

                        <Button onClick={() => navigate('/subscription')} className="relative z-10 shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] border-red-500/20 text-red-100">
                            DESBLOQUEAR MATRIX SEMANAL
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {(Object.entries(activeMeals || {}) as [string, Meal][]).map(([type, meal], idx) => (
                            <Card
                                key={`${type}-${selectedDayIndex}`} // Add key to force re-render on day change
                                onClick={() => setSelectedMeal({ type, data: meal })}
                                className="p-8 hover:border-emerald-500/40 hover:bg-[#151B18] group flex flex-col h-full relative"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <Badge color={type === 'snack' ? 'zinc' : 'emerald'} className="shadow-lg">{type}</Badge>
                                    <div className="text-right">
                                        <span className="block text-3xl font-black italic text-white leading-none group-hover:text-emerald-400 transition-colors">{meal.calories}</span>
                                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">KCAL</span>
                                    </div>
                                </div>

                                <h4 className="text-xl font-black text-white mb-3 leading-tight min-h-[56px]">{meal.name}</h4>

                                <div className="mt-auto pt-6 border-t border-white/5 grid grid-cols-3 gap-2">
                                    {[
                                        { l: 'PRO', v: meal.macros?.p || 0, c: 'text-emerald-500' },
                                        { l: 'CARB', v: meal.macros?.c || 0, c: 'text-blue-500' },
                                        { l: 'FAT', v: meal.macros?.f || 0, c: 'text-orange-500' }
                                    ].map(m => (
                                        <div key={m.l} className="text-center">
                                            <span className={`block text-lg font-black ${m.c}`}>{m.v}</span>
                                            <span className="text-[8px] text-zinc-600 font-bold uppercase">{m.l}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedMeal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedMeal(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="bg-[#0F1210] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl relative z-10 flex flex-col md:flex-row"
                        >
                            <button
                                onClick={() => setSelectedMeal(null)}
                                className="absolute top-6 right-6 z-20 w-12 h-12 bg-black/50 hover:bg-emerald-500 hover:text-black rounded-full flex items-center justify-center text-white transition-all border border-white/10"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <div className="w-full md:w-2/5 bg-[#0A0F0D] p-10 flex flex-col items-center justify-center relative border-r border-white/5">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
                                <Badge className="mb-8 scale-110">{selectedMeal.type}</Badge>

                                <div className="w-full max-w-[240px] aspect-square relative mb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart
                                            innerRadius="40%"
                                            outerRadius="100%"
                                            data={[
                                                { name: 'Grasas', value: selectedMeal.data.macros?.f || 0, fill: '#F59E0B' },
                                                { name: 'Carbos', value: selectedMeal.data.macros?.c || 0, fill: '#3B82F6' },
                                                { name: 'Proteína', value: selectedMeal.data.macros?.p || 0, fill: '#10B981' }
                                            ]}
                                            startAngle={180}
                                            endAngle={0}
                                            barSize={20}
                                        >
                                            <RadialBar background={{ fill: '#1a1a1a' }} dataKey="value" cornerRadius={10} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-16">
                                        <span className="text-5xl font-black text-white italic tracking-tighter">{selectedMeal.data.calories}</span>
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">KCAL</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-3/5 p-10 md:p-14 overflow-y-auto bg-[#0F1210]">
                                <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-6 leading-none">
                                    {selectedMeal.data.name}
                                </h2>

                                <div className="space-y-8">
                                    {/* INSTRUCTIONS SECTION (New) */}
                                    {selectedMeal.data.instructions && selectedMeal.data.instructions.length > 0 && (
                                        <div className="bg-[#151B18] rounded-2xl p-6 border border-white/5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Instrucciones de Preparación</h4>
                                            </div>
                                            <ul className="space-y-3">
                                                {selectedMeal.data.instructions.map((inst, i) => (
                                                    <li key={i} className="flex gap-4 text-sm text-zinc-300">
                                                        <span className="text-emerald-500 font-bold font-mono text-xs mt-0.5">{(i + 1).toString().padStart(2, '0')}</span>
                                                        <span className="leading-relaxed">{inst}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Ingredientes Clave</h4>
                                        <ul className="space-y-3">
                                            {selectedMeal.data.ingredients && selectedMeal.data.ingredients.map((ing, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5" />
                                                    {ing}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {selectedMeal.data.tips && (
                                        <div>
                                            <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Notas</h4>
                                            <ul className="space-y-2">
                                                {selectedMeal.data.tips.map((tip, i) => (
                                                    <li key={i} className="text-sm text-zinc-400 italic pl-4 border-l border-zinc-700">
                                                        "{tip}"
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
