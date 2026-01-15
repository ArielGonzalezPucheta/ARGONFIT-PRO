
import React, { useState } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { storage } from '../services/storage';
import { useNavigate } from 'react-router-dom';

export const History = () => {
  const [state] = useState(storage.load());
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <header className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Historial</h1>
            <p className="text-zinc-500">Repasa tus progresos y récords.</p>
        </div>
        <div className="hidden md:block">
            <Badge color="zinc">{state.sessions.length} SESIONES</Badge>
        </div>
      </header>

      <div className="space-y-4">
        {state.sessions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-[#101412] rounded-full flex items-center justify-center border border-white/5 mb-6 relative group">
                 <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-20" />
                 <svg className="w-10 h-10 text-zinc-600 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
             </div>
             <h3 className="text-2xl font-black italic uppercase text-white tracking-tight mb-2">Sin Registros</h3>
             <p className="text-zinc-500 max-w-sm mb-8 text-sm leading-relaxed">
                 Tu legado comienza con la primera repetición. Completa un entrenamiento para visualizar tus métricas de rendimiento.
             </p>
             <Button onClick={() => navigate('/workout')} className="h-12 px-8 text-xs shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                 INICIAR PRIMER ENTRENAMIENTO
             </Button>
          </div>
        ) : (
            state.sessions.map(session => (
              <Card key={session.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-emerald-500/30 transition-all">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex flex-col items-center justify-center text-emerald-500 font-bold border border-emerald-500/20">
                    <span className="text-lg leading-none">{new Date(session.date).getDate()}</span>
                    <span className="text-[9px] uppercase">{new Date(session.date).toLocaleString('es-ES', { month: 'short' })}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{session.routineName}</h4>
                    <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {session.durationMinutes} min</span>
                        <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> {session.exercises.length} Ejercicios</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full md:w-auto md:block text-right border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  <p className="text-2xl font-mono font-black text-white italic tracking-tighter">{(session.totalVolume/1000).toFixed(1)}k <span className="text-[10px] text-zinc-600 font-sans not-italic font-bold uppercase tracking-widest">VOL</span></p>
                  <div className="mt-1">
                      <Badge color="emerald" className="text-[9px]">COMPLETADO</Badge>
                  </div>
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};
