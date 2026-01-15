
import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { storage, saveCustomRoutine } from '../services/storage';
import { paymentService } from '../services/payment';
import { useNavigate } from 'react-router-dom';
import { CreateCustomRoutine } from '../components/CreateCustomRoutine';
import { Routine } from '../types';

export const Routines = () => {
  const [state, setState] = useState(storage.load());
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const hasPremiumAccess = paymentService.hasAccess(state.profile, 'premium_routines');

  const filters = ['Todos', 'Pérdida de Peso', 'Ganancia muscular', 'Tonificación', 'Resistencia', 'Movilidad / Flexibilidad', 'Mis Rutinas'];

  const filteredRoutines = activeFilter === 'Todos'
    ? state.routines
    : state.routines.filter(r => r.target === activeFilter || r.tags.includes(activeFilter));

  const handleSaveCustomRoutine = async (routine: Routine) => {
    try {
      // Add to local state immediately
      const updatedState = { ...state, routines: [...state.routines, routine] };
      setState(updatedState);
      storage.save(updatedState);

      // Try to save to Supabase if logged in  
      if (state.profile?.id) {
        await saveCustomRoutine(routine, state.profile.id);
      }

      setShowCreateModal(false);
      alert('¡Rutina creada exitosamente!');
    } catch (error) {
      console.error('Error saving custom routine:', error);
      alert('Rutina guardada localmente. Sincronizará cuando te conectes.');
      setShowCreateModal(false);
    }
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] font-tech">DATABASE ACCESS</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white">
            Biblioteca <span className="text-emerald-500 glow-text">Argon</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Badge color="zinc" className="text-xs px-4 py-2 bg-white/5 border-white/10">{filteredRoutines.length} PROTOCOLOS</Badge>
        </div>
      </header>

      {/* Create Custom Routine Button */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-black px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Crear mi propia rutina</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${activeFilter === filter
              ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]'
              : 'bg-black/40 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredRoutines.map(routine => {
          const isLocked = routine.isPremium && !hasPremiumAccess;

          return (
            <Card
              key={routine.id}
              className={`group p-0 overflow-hidden flex flex-col h-full bg-[#0F1210] transition-all duration-500 ${isLocked ? 'opacity-70 grayscale' : 'hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)]'}`}
              onClick={() => {
                if (isLocked) {
                  if (confirm("Esta rutina requiere plan PRO o ELITE. ¿Ir a suscripción?")) {
                    navigate('/subscription');
                  }
                } else {
                  navigate(`/routine/${routine.id}`);
                }
              }}
            >
              {/* Image Header with Tech Overlay */}
              <div className="relative h-56 overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900 skeleton-loader" />
                <img
                  src={routine.imageUrl}
                  alt={routine.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out grayscale-[30%] group-hover:grayscale-0"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1210] via-[#0F1210]/20 to-transparent" />

                {/* Lock Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-40 backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">PREMIUM ONLY</span>
                  </div>
                )}

                {/* Tech Markers */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  {routine.isAiGenerated && (
                    <Badge color="blue" className="shadow-lg backdrop-blur-md">AI CONSTRUCT</Badge>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 z-20">
                  <Badge color="zinc" className="bg-black/60 backdrop-blur border-white/10 text-white">{routine.target || routine.tags[0]}</Badge>
                </div>

                {/* Action Overlay */}
                {!isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-30">
                    <span className="text-emerald-400 font-black uppercase tracking-[0.2em] text-xs border border-emerald-500/50 px-6 py-3 rounded-full bg-black/50 backdrop-blur-md">
                      Inspeccionar
                    </span>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="p-6 flex-1 flex flex-col relative z-20 border-t border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-black italic uppercase text-white leading-none group-hover:text-emerald-400 transition-colors">
                    {routine.name}
                  </h3>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden mb-6">
                  <div className="bg-[#121513] p-3 text-center">
                    <span className="block text-white font-bold font-mono">{routine.duration}m</span>
                    <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">TIEMPO</span>
                  </div>
                  <div className="bg-[#121513] p-3 text-center">
                    <span className="block text-white font-bold font-mono">{routine.exercises.length}</span>
                    <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">EJERCICIOS</span>
                  </div>
                </div>

                <p className="text-zinc-400 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
                  {routine.description}
                </p>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Nivel de Intensidad</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`w-1 h-3 rounded-sm ${i < (routine.intensity / 10) ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Custom Routine Modal */}
      {showCreateModal && (
        <CreateCustomRoutine
          onSave={handleSaveCustomRoutine}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};
