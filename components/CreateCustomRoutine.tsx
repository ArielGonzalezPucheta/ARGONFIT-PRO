import React, { useState, useMemo } from 'react';
import { ExerciseTemplate, Routine } from '../types';
import { MASTER_EXERCISE_POOL } from '../services/storage';
import { Button, Card } from './UI';

interface CreateCustomRoutineProps {
    onSave: (routine: Routine) => void;
    onCancel: () => void;
}

export const CreateCustomRoutine: React.FC<CreateCustomRoutineProps> = ({ onSave, onCancel }) => {
    const [routineName, setRoutineName] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<ExerciseTemplate[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('Push');

    // Flatten all exercises from MASTER_EXERCISE_POOL
    const allExercises = useMemo(() => {
        const exercises: Array<ExerciseTemplate & { category: string }> = [];
        Object.entries(MASTER_EXERCISE_POOL).forEach(([category, exList]) => {
            exList.forEach((ex: any, idx: number) => {
                exercises.push({
                    exerciseId: `custom_${category}_${idx}`,
                    name: ex.name,
                    muscleGroup: ex.muscle,
                    suggestedSets: 3,
                    suggestedReps: '10-12',
                    videoUrl: ex.video,
                    imageUrl: ex.img,
                    howTo: ex.desc,
                    category
                });
            });
        });
        return exercises;
    }, []);

    const filteredExercises = useMemo(() => {
        let filtered = allExercises.filter(ex => ex.category === activeCategory);
        if (searchTerm) {
            filtered = filtered.filter(ex =>
                ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [allExercises, activeCategory, searchTerm]);

    const handleAddExercise = (exercise: ExerciseTemplate & { category: string }) => {
        if (selectedExercises.length >= 15) {
            alert('Máximo 15 ejercicios por rutina');
            return;
        }
        const { category, ...exerciseData } = exercise;
        setSelectedExercises([...selectedExercises, exerciseData]);
    };

    const handleRemoveExercise = (index: number) => {
        setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
    };

    const handleUpdateExercise = (index: number, field: 'suggestedSets' | 'suggestedReps', value: any) => {
        const updated = [...selectedExercises];
        updated[index] = { ...updated[index], [field]: value };
        setSelectedExercises(updated);
    };

    const handleSave = () => {
        if (!routineName.trim()) {
            alert('Por favor ingresa un nombre para la rutina');
            return;
        }
        if (selectedExercises.length === 0) {
            alert('Agrega al menos 1 ejercicio');
            return;
        }

        const newRoutine: Routine = {
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: routineName,
            description: 'Rutina personalizada creada por el usuario',
            duration: selectedExercises.length * 5,
            target: 'Mis Rutinas',
            tags: ['Custom', 'Personalizada'],
            imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
            intensity: 60,
            resistance: 'Media',
            stats: { strength: 50, cardio: 50, technique: 50, mobility: 50, impact: 50 },
            exercises: selectedExercises,
            isAiGenerated: false,
            isPremium: false
        };

        onSave(newRoutine);
    };

    const categories = ['Push', 'Pull', 'Legs', 'Cardio'];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-6xl bg-[#0F1210] border-white/10 my-8">
                {/* Header */}
                <div className="border-b border-white/10 pb-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-black italic uppercase text-white">
                            Crear <span className="text-emerald-500 glow-text">Rutina</span>
                        </h2>
                        <button
                            onClick={onCancel}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Routine Name Input */}
                    <input
                        type="text"
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        placeholder="Nombre de tu rutina..."
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        maxLength={50}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Panel - Exercise Selector */}
                    <div>
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">EJERCICIOS DISPONIBLES</span>
                            </div>

                            {/* Search Bar */}
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar ejercicio..."
                                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500/50 mb-3"
                            />

                            {/* Category Filters */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${activeCategory === cat
                                                ? 'bg-emerald-500 text-black border-emerald-500'
                                                : 'bg-black/40 text-zinc-400 border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Exercise List */}
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredExercises.map((exercise) => (
                                <div
                                    key={exercise.exerciseId}
                                    className="bg-black/40 border border-white/10 rounded-lg p-3 flex items-center justify-between hover:border-emerald-500/50 transition-colors group"
                                >
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-sm">{exercise.name}</h4>
                                        <p className="text-zinc-500 text-xs">{exercise.muscleGroup}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddExercise(exercise)}
                                        disabled={selectedExercises.some(e => e.exerciseId === exercise.exerciseId)}
                                        className="px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded text-xs font-bold hover:bg-emerald-500 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        {selectedExercises.some(e => e.exerciseId === exercise.exerciseId) ? '✓' : '+'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel - Selected Exercises */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-sm" />
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">
                                TU RUTINA ({selectedExercises.length}/15)
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedExercises.length === 0 ? (
                                <div className="text-center py-12 text-zinc-600">
                                    <p className="text-sm">Agrega ejercicios para construir tu rutina</p>
                                </div>
                            ) : (
                                selectedExercises.map((exercise, index) => (
                                    <div
                                        key={`${exercise.exerciseId}_${index}`}
                                        className="bg-black/40 border border-white/10 rounded-lg p-4"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="text-white font-bold text-sm mb-1">{exercise.name}</h4>
                                                <p className="text-zinc-500 text-xs">{exercise.muscleGroup}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveExercise(index)}
                                                className="text-red-500 hover:text-red-400 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">Series</label>
                                                <input
                                                    type="number"
                                                    value={exercise.suggestedSets}
                                                    onChange={(e) => handleUpdateExercise(index, 'suggestedSets', parseInt(e.target.value) || 3)}
                                                    min={1}
                                                    max={10}
                                                    className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">Reps</label>
                                                <input
                                                    type="text"
                                                    value={exercise.suggestedReps}
                                                    onChange={(e) => handleUpdateExercise(index, 'suggestedReps', e.target.value)}
                                                    placeholder="8-12"
                                                    className="w-full px-2 py-1 bg-black/60 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-emerald-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                    <Button
                        onClick={onCancel}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!routineName.trim() || selectedExercises.length === 0}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Guardar Rutina
                    </Button>
                </div>
            </Card>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
        </div>
    );
};
