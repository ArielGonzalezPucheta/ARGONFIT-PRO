
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { Card, Button, Badge } from '../components/UI';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export const RoutineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [state, setState] = useState(storage.load());

    const routine = state.routines.find(r => r.id === id) || state.routines[0];
    const [expandedEx, setExpandedEx] = useState<string | null>(null);

    // 1. Radar Data (Attributes)
    const radarData = [
        { subject: 'Fuerza', A: routine.stats?.strength || 70, fullMark: 100 },
        { subject: 'Cardio', A: routine.stats?.cardio || 40, fullMark: 100 },
        { subject: 'Técnica', A: routine.stats?.technique || 60, fullMark: 100 },
        { subject: 'Movilidad', A: routine.stats?.mobility || 50, fullMark: 100 },
        { subject: 'Impacto', A: routine.stats?.impact || 50, fullMark: 100 },
    ];

    // 2. Pie Data (Muscle Distribution)
    const muscleDistribution = routine.exercises.reduce((acc, ex) => {
        acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const pieData = Object.entries(muscleDistribution).map(([name, value]) => ({ name, value }));

    // 3. Area Data (Simulated Heart Rate / Intensity Curve)
    const areaData = Array.from({ length: 12 }, (_, i) => ({
        name: `${i * 5}m`,
        intensity: 50 + Math.random() * 40 + (i > 2 && i < 10 ? 20 : 0) // Peak in middle
    }));

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

    const handleExpand = (exerciseId: string) => {
        if (expandedEx === exerciseId) {
            setExpandedEx(null);
            return;
        }
        setExpandedEx(exerciseId);
    };

    return (
        <div className="min-h-screen pb-32 animate-in fade-in duration-700 bg-[#050806]">

            {/* --- HERO LANDING SECTION --- */}
            <div className="relative h-[85vh] min-h-[600px] -mx-4 md:-mx-8 -mt-8 overflow-hidden flex flex-col justify-end">
                {/* Parallax Background */}
                <div className="absolute inset-0">
                    <img
                        src={routine.imageUrl}
                        className="w-full h-full object-cover opacity-50 scale-105 animate-[pulse_10s_ease-in-out_infinite]"
                        alt="Hero"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050806] via-[#050806]/60 to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050806_120%)]" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-7xl mx-auto w-full px-8 pb-12 md:pb-20">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <div className="flex gap-3 mb-6">
                            <Badge color="emerald" className="bg-emerald-500 text-black shadow-[0_0_20px_#10B981]">PROTOCOL v4.0</Badge>
                            {routine.isAiGenerated && <Badge color="blue" className="bg-blue-500 text-black">AI ARCHITECT</Badge>}
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black italic uppercase text-white tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl">
                            {routine.name}
                        </h1>
                        <p className="text-zinc-300 text-xl md:text-2xl font-medium max-w-2xl leading-relaxed mb-8 border-l-4 border-emerald-500 pl-6">
                            {routine.description}
                        </p>

                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <Button
                                className="h-16 px-12 text-xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                                onClick={() => navigate('/workout')}
                            >
                                Iniciar Sesión
                            </Button>
                            <div className="flex items-center gap-6 text-zinc-400">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-widest">Duración</span>
                                    <span className="text-2xl font-black text-white italic">{routine.duration}m</span>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-widest">Volumen</span>
                                    <span className="text-2xl font-black text-white italic">{routine.exercises.length * 3} Sets</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 space-y-20">

                {/* --- ANALYTICS DASHBOARD --- */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-8 bg-emerald-500" />
                        <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white tracking-tighter">Análisis Táctico</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* 1. Radar Chart */}
                        <Card className="bg-[#101412] border-white/5 p-6 min-h-[350px] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity">
                                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </div>
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Perfil de Atributos</h3>
                            <div className="h-[250px] -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="Stats" dataKey="A" stroke="#10B981" strokeWidth={3} fill="#10B981" fillOpacity={0.4} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* 2. Muscle Distribution */}
                        <Card className="bg-[#101412] border-white/5 p-6 min-h-[350px] relative overflow-hidden group">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Enfoque Muscular</h3>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mt-[-20px]">
                                {pieData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded text-[10px] uppercase font-bold text-zinc-400">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        {entry.name}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* 3. Intensity Projection */}
                        <Card className="bg-[#101412] border-white/5 p-6 min-h-[350px] relative overflow-hidden group">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Proyección de Intensidad</h3>
                            <div className="h-[250px] -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={areaData}>
                                        <defs>
                                            <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                        <Area type="monotone" dataKey="intensity" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorIntensity)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-[10px] text-zinc-500 mt-2">ZONA CARDIACA ESTIMADA</p>
                        </Card>
                    </div>
                </div>

                {/* --- STRATEGY SECTION --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-white/5 pt-12">
                    <div className="lg:col-span-4">
                        <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-4">Estrategia & Ciencia</h3>
                        <h2 className="text-3xl font-black italic text-white mb-6">¿Por qué funciona este protocolo?</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-xl">🧬</div>
                                <div>
                                    <h4 className="font-bold text-white">Sobrecarga Progresiva</h4>
                                    <p className="text-sm text-zinc-400 mt-1">Diseñado para incrementar el volumen total semana tras semana.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-xl">⚡</div>
                                <div>
                                    <h4 className="font-bold text-white">Reclutamiento Motor</h4>
                                    <p className="text-sm text-zinc-400 mt-1">Selección de ejercicios compuesta para máxima activación de fibras.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- EXERCISE LIST (REDESIGNED) --- */}
                    <div className="lg:col-span-8">
                        <div className="flex justify-between items-end mb-6">
                            <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Secuencia de Operaciones</h3>
                            <span className="text-white font-bold">{routine.exercises.length} MOVIMIENTOS</span>
                        </div>

                        <div className="space-y-4">
                            {routine.exercises.map((ex, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div className={`bg-[#151B18] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${expandedEx === ex.exerciseId ? 'ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/10' : 'hover:border-white/20'}`}>
                                        {/* Header */}
                                        <div
                                            onClick={() => handleExpand(ex.exerciseId)}
                                            className="p-6 flex items-center gap-6 cursor-pointer"
                                        >
                                            <div className="text-4xl font-black italic text-white/10">{String(idx + 1).padStart(2, '0')}</div>
                                            <div className="flex-1">
                                                <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{ex.name}</h4>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge color="zinc" className="bg-black/30 border-white/5">{ex.muscleGroup}</Badge>
                                                    <span className="text-xs text-zinc-500 font-mono py-1">{ex.suggestedSets} SETS x {ex.suggestedReps}</span>
                                                </div>
                                            </div>
                                            <motion.div animate={{ rotate: expandedEx === ex.exerciseId ? 180 : 0 }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </motion.div>
                                        </div>

                                        {/* Body */}
                                        <AnimatePresence>
                                            {expandedEx === ex.exerciseId && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: 'auto' }}
                                                    exit={{ height: 0 }}
                                                    className="overflow-hidden bg-[#0A0F0D] border-t border-white/5"
                                                >
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {/* Image Container */}
                                                        {/* Image/Video Container */}
                                                        <div className="aspect-video bg-black rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center group shadow-lg">
                                                            {ex.videoUrl ? (
                                                                <iframe
                                                                    width="100%"
                                                                    height="100%"
                                                                    src={ex.videoUrl.replace("watch?v=", "embed/")}
                                                                    title={ex.name}
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0">
                                                                    <img
                                                                        src={ex.imageUrl || getFallbackImage(ex.muscleGroup)}
                                                                        alt={ex.name}
                                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                    />
                                                                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[9px] text-zinc-400 font-bold uppercase tracking-widest border border-white/10">
                                                                        {ex.imageUrl ? 'IMAGEN TÉCNICA' : 'REFERENCIA VISUAL'}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Ejecución</h5>
                                                                <p className="text-zinc-300 text-sm leading-relaxed">{ex.howTo || "Controla el movimiento. Fase excéntrica lenta, concéntrica explosiva."}</p>
                                                            </div>
                                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                                <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Beneficio Táctico</h5>
                                                                <p className="text-xs text-blue-200/60">{ex.benefits || "Construcción de base fundamental."}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
