
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '../components/UI';
import { ICONS } from '../constants';
import { storage, statsEngine } from '../services/storage';
import { aiService } from '../services/ai';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const [state, setState] = useState(storage.load());
  const [quote, setQuote] = useState("Cargando motivación...");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simular un mensaje motivacional rotativo o de IA
    const messages = [
      "La disciplina te lleva donde la motivación no alcanza.",
      "Cada repetición cuenta. Haz que valga la pena.",
      "Tu único límite eres tú mismo.",
      "Construyendo una mejor versión, día a día."
    ];
    setQuote(messages[Math.floor(Math.random() * messages.length)]);

    // Simulate data loading for skeleton effect
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const totalVolume = state.sessions.reduce((acc, s) => acc + s.totalVolume, 0);
  const activeHours = Math.floor(state.sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60);
  const readiness = statsEngine.getReadiness(state.sessions);
  const isLoggedIn = !!state.profile;
  const userName = state.profile?.name?.split(' ')[0] || 'Atleta';

  // Datos para el gráfico (simplificados y limpios)
  const chartData = [...state.sessions].reverse().slice(-7).map(s => ({
    day: new Date(s.date).toLocaleDateString(state.language === 'es' ? 'es-ES' : 'en-US', { weekday: 'short' }).charAt(0).toUpperCase(),
    vol: s.totalVolume / 1000 // En toneladas para que el número sea legible
  }));

  // Rellenar días vacíos si no hay suficientes datos para que el gráfico se vea bien
  while (chartData.length < 7) {
    chartData.unshift({ day: '-', vol: 0 });
  }

  const nextRoutine = state.routines[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto">
      
      {/* 1. HEADER: Saludo humano y limpio */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-zinc-400 text-sm font-medium tracking-wide mb-1 uppercase">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Hola, <span className="text-emerald-500">{userName}</span>
          </h1>
          <p className="text-zinc-500 mt-2 max-w-md text-sm md:text-base">
            "{quote}"
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-[#151B18] px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${readiness.score > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Estado: {readiness.label}</span>
            </div>
            {isLoggedIn && (
                 <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                    {state.profile?.avatarUrl ? (
                        <img src={state.profile.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-500 font-bold">{userName.charAt(0)}</div>
                    )}
                 </div>
            )}
        </div>
      </header>

      {/* 2. STATS ROW: Tarjetas Bento Grid Limpias */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Volumen Total', val: `${(totalVolume/1000).toFixed(1)}k`, unit: 'Kg', icon: ICONS.Volume },
          { label: 'Tiempo Activo', val: activeHours, unit: 'Horas', icon: ICONS.Timer },
          { label: 'Racha Actual', val: state.profile?.streak || 0, unit: 'Días', icon: ICONS.Flame },
          { label: 'Peso Corporal', val: state.profile?.weight || '--', unit: 'Kg', icon: ICONS.Profile },
        ].map((stat, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between h-32 hover:border-emerald-500/30 transition-colors bg-[#101412]">
             <div className="flex justify-between items-start">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                <span className="text-emerald-500/50">{stat.icon}</span>
             </div>
             <div>
                <span className="text-3xl font-bold text-white">{stat.val}</span>
                <span className="text-xs text-zinc-600 font-bold ml-1 uppercase">{stat.unit}</span>
             </div>
          </Card>
        ))}
      </div>

      {/* 3. MAIN SECTION: Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col min-h-[400px] bg-[#101412]">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Actividad Reciente</h3>
              <Badge color="zinc">Últimos 7 días</Badge>
           </div>
           
           <div className="flex-1 w-full min-h-0 relative">
             {isLoading ? (
               // Skeleton Loader
               <div className="absolute inset-0 flex items-end justify-between gap-2 animate-pulse">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-full bg-white/5 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                  ))}
               </div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={40}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#71717a', fontSize: 12, fontWeight: 600}} 
                        dy={10}
                     />
                     <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`${value.toFixed(1)} Ton`, 'Volumen']}
                     />
                     <Bar 
                        dataKey="vol" 
                        fill="#10B981" 
                        radius={[6, 6, 0, 0]} 
                        fillOpacity={0.8}
                        animationDuration={1500}
                     />
                  </BarChart>
               </ResponsiveContainer>
             )}
           </div>
        </Card>

        {/* Next Workout & Actions */}
        <div className="space-y-6 flex flex-col">
           
           {/* CTA Principal */}
           <Card 
             onClick={() => navigate('/workout')}
             className="flex-1 p-6 relative overflow-hidden flex flex-col justify-center items-center text-center group bg-gradient-to-b from-emerald-900/10 to-[#101412] border-emerald-500/30 cursor-pointer hover:border-emerald-500/60 transition-all"
           >
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
               <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-black mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Entrenar Ahora</h3>
               <p className="text-zinc-400 text-sm mb-6 max-w-[200px]">Registra una nueva sesión o continúa tu progreso.</p>
               <Button className="w-full pointer-events-none">
                  INICIAR SESIÓN
               </Button>
           </Card>

           {/* Quick Suggestion */}
           {nextRoutine && (
               <Card className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => navigate(`/routine/${nextRoutine.id}`)}>
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={nextRoutine.imageUrl} className="w-full h-full object-cover grayscale opacity-80" alt="Routine" />
                  </div>
                  <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Sugerido para hoy</p>
                      <h4 className="text-white font-bold truncate">{nextRoutine.name}</h4>
                      <div className="flex gap-2 mt-1">
                          <span className="text-xs text-zinc-500">{nextRoutine.duration} min</span>
                          <span className="text-xs text-zinc-500">•</span>
                          <span className="text-xs text-zinc-500">{nextRoutine.exercises.length} Ejercicios</span>
                      </div>
                  </div>
                  <div className="ml-auto text-zinc-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
               </Card>
           )}

           <div className="grid grid-cols-2 gap-4">
               <button onClick={() => navigate('/nutrition')} className="p-4 rounded-2xl bg-[#151B18] border border-white/5 hover:border-white/20 transition-all text-left group">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-black transition-colors">
                      {ICONS.Nutrition}
                  </div>
                  <span className="text-sm font-bold text-zinc-300 group-hover:text-white">Plan Dieta</span>
               </button>
               <button onClick={() => navigate('/calculator')} className="p-4 rounded-2xl bg-[#151B18] border border-white/5 hover:border-white/20 transition-all text-left group">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-2 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                      {ICONS.Calculator}
                  </div>
                  <span className="text-sm font-bold text-zinc-300 group-hover:text-white">Discos</span>
               </button>
           </div>
        </div>
      </div>

    </div>
  );
};
