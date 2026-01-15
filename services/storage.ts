
import { AppState, Routine, WorkoutSession, ExerciseTemplate } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { trackerService } from './tracker'; // Importar el nuevo servicio

const STORAGE_KEY = 'argon_fit_data_v4';
const ACCOUNTS_KEY = 'argon_fit_accounts_db_v4'; // Almacén persistente de cuentas locales
const ROUTINE_VERSION = 2; // Version control for routine generation

// --- CURATED IMAGE LIBRARY (Verified High Quality Unsplash IDs) ---
const IMAGE_LIBRARY = {
  'Fuerza': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1200'
  ],
  'Hipertrofia': [
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1574680096141-9877b4544b91?auto=format&fit=crop&q=80&w=1200'
  ],
  'Pierna': [
    'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&q=80&w=1200', // WORKING IMAGE for Legs Intermediate
    'https://images.unsplash.com/photo-1434608519344-49d77a699ded?auto=format&fit=crop&q=80&w=1200'
  ],
  'Cardio': [
    'https://images.unsplash.com/photo-1538805060512-e282813563bd?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1552674605-46d536d2e609?auto=format&fit=crop&q=80&w=1200'
  ],
  'General': [
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=1200'
  ]
};

// --- MASTER EXERCISE POOL ---
export const MASTER_EXERCISE_POOL: Record<string, any[]> = {
  'Push': [
    { name: 'Bench Press', muscle: 'Pecho', video: 'https://www.youtube.com/watch?v=vcBig73ojpE', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800', desc: 'Acué©state en el banco, baja la barra controladamente hasta tocar el pecho y empuja explosivamente hacia arriba sin bloquear codos.' },
    { name: 'Overhead Press', muscle: 'Hombros', video: 'https://www.youtube.com/watch?v=QAQ64hK4Xxs', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=800', desc: 'De pie, manté©n el core firme y empuja la barra verticalmente desde los hombros hasta bloquear los codos sobre la cabeza.' },
    { name: 'Incline DB Press', muscle: 'Pecho', video: 'https://www.youtube.com/watch?v=8iPEnn-ltC8', img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=800', desc: 'En banco inclinado (30-45Â°), baja las mancuernas hasta el nivel del pecho abriendo ligeramente los codos y empuja hacia arriba.' },
    { name: 'Tricep Dips', muscle: 'Tré­ceps', video: 'https://www.youtube.com/watch?v=2z8JmcrW-As', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=800', desc: 'Manté©n el cuerpo vertical, baja flexionando los codos hasta 90 grados y empuja para volver a subir, manteniendo los codos pegados.' },
    { name: 'Lateral Raises', muscle: 'Hombros', video: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=800', desc: 'Eleva los brazos hacia los lados hasta la altura de los hombros con una ligera flexié³n de codos, controlando la bajada.' },
    { name: 'Cable Flys', muscle: 'Pecho', video: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800', desc: 'Da un paso al frente, junta las manos al centro del pecho contrayendo los pectorales y regresa lento sintiendo el estiramiento.' }
  ],
  'Pull': [
    { name: 'Deadlift', muscle: 'Espalda', video: 'https://www.youtube.com/watch?v=op9kVnSso6Q', img: 'https://images.unsplash.com/photo-1517963879433-6cd21977460d?auto=format&fit=crop&q=80&w=800', desc: 'Pies al ancho de caderas, agarra la barra, manté©n la espalda recta y empuja el suelo con las piernas para levantar el peso.' },
    { name: 'Pull Ups', muscle: 'Espalda', video: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', img: 'https://images.unsplash.com/photo-1598971639058-211a74a96c91?auto=format&fit=crop&q=80&w=800', desc: 'Cué©lgate de la barra, retrae las escé¡pulas y tracciona verticalmente hasta pasar la barbilla por encima de la barra.' },
    { name: 'Barbell Row', muscle: 'Espalda', video: 'https://www.youtube.com/watch?v=9efgcGunU90', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&q=80&w=800', desc: 'Inclina el torso 45Â°, manté©ng la espalda neutra y tracciona la barra hacia la cadera apretando la espalda alta.' },
    { name: 'Face Pulls', muscle: 'Hombros', video: 'https://www.youtube.com/watch?v=rep-qVOkqgk', img: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=800', desc: 'Tracciona la cuerda hacia la frente separando las manos al final, enfocé¡ndote en los deltoides posteriores y rotacié³n externa.' },
    { name: 'Bicep Curls', muscle: 'Bé­ceps', video: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=800', desc: 'De pie, manté©n los codos pegados al torso y flexiona los antebrazos contrayendo el bé­ceps al mé¡ximo arriba.' },
    { name: 'Hammer Curls', muscle: 'Bé­ceps', video: 'https://www.youtube.com/watch?v=zC3nLlEvin4', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=800', desc: 'Con agarre neutro (palmas enfrentadas), flexiona los codos manteniendo la tensié³n en el braquial y antebrazo.' }
  ],
  'Legs': [
    { name: 'Squat', muscle: 'Piernas', video: 'https://www.youtube.com/watch?v=SW_C1A-rejs', img: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?auto=format&fit=crop&q=80&w=800', desc: 'Barra en trapecios, pies al ancho de hombros, baja la cadera rompiendo el paralelo y sube empujando el suelo.' },
    { name: 'Leg Press', muscle: 'Piernas', video: 'https://www.youtube.com/watch?v=yZktSeFTPJY', img: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&q=80&w=800', desc: 'Pies en plataforma, baja controlando el peso hasta que las rodillas se acerquen al pecho y empuja sin bloquear rodillas.' },
    { name: 'Romanian Deadlift', muscle: 'Isquios', video: 'https://www.youtube.com/watch?v=JCXUYuzwNrM', img: 'https://images.unsplash.com/photo-1603287681836-e60567a2d119?auto=format&fit=crop&q=80&w=800', desc: 'Rodillas semi-flexionadas, lleva la cadera hacia atré¡s bajando la barra pegada a las piernas hasta sentir estiramiento en isquios.' },
    { name: 'Lunges', muscle: 'Piernas', video: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U', img: 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?auto=format&fit=crop&q=80&w=800', desc: 'Da un paso largo, baja la rodilla trasera casi al suelo manteniendo el torso recto y regresa a la posicié³n inicial.' },
    { name: 'Leg Extensions', muscle: 'Cué¡driceps', video: 'https://www.youtube.com/watch?v=YyvSfVjQeL0', img: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&q=80&w=800', desc: 'Sentado, extiende las rodillas contrayendo los cué¡driceps al mé¡ximo en la parte superior y baja lento y controlado.' },
    { name: 'Calf Raises', muscle: 'Gemelos', video: 'https://www.youtube.com/watch?v=-M4-G8p8fmc', img: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&q=80&w=800', desc: 'Eleva los talones lo mé¡s posible contrayendo los gemelos y baja hasta sentir un estiramiento profundo.' }
  ],
  'Cardio': [
    { name: 'Burpees', muscle: 'Full Body', video: 'https://www.youtube.com/watch?v=TU8QYVW0gDU', img: 'https://images.unsplash.com/photo-1517963879433-6cd21977460d?auto=format&fit=crop&q=80&w=800', desc: 'Realiza una flexié³n de pecho, incorpé³rate con un salto explosivo y aplaude por encima de la cabeza. Manté©n ritmo.' },
    { name: 'Box Jumps', muscle: 'Piernas', video: 'https://www.youtube.com/watch?v=52r_Ul5k03g', img: 'https://images.unsplash.com/photo-1538805060512-e282813563bd?auto=format&fit=crop&q=80&w=800', desc: 'Frente al cajé³n, carga la cadera y salta explosivamente aterrizando suavemente con ambos pies sobre la superficie.' },
    { name: 'Mountain Climbers', muscle: 'Core', video: 'https://www.youtube.com/watch?v=nmwgirgXLYM', img: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=800', desc: 'En posicié³n de plancha alta, lleva las rodillas alternadamente al pecho a velocidad alta manteniendo la cadera baja.' },
    { name: 'Jump Rope', muscle: 'Cardio', video: 'https://www.youtube.com/watch?v=u3zgHI8QnqE', img: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?auto=format&fit=crop&q=80&w=800', desc: 'Saltos cortos y ré¡pidos sobre las puntas de los pies, moviendo la cuerda principalmente con el giro de mué±ecas.' }
  ]
};

// --- ROUTINE GENERATORS ---

// 2. ADDITIONAL_ROUTINES (35+ Items)
export const ADDITIONAL_ROUTINES: Routine[] = [
  // --- 1. Pé‰RDIDA DE PESO (7 Routines) ---
  {
    id: 'RT_LOSS_01', name: 'Metabolic Inferno', target: 'Pé©rdida de Peso', description: 'HIIT de alta intensidad para maximizar quema calé³rica.', duration: 30,
    tags: ['HIIT', 'Cardio'], imageUrl: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&q=80&w=1200',
    intensity: 95, resistance: 'Media', stats: { strength: 40, cardio: 95, technique: 50, mobility: 40, impact: 80 },
    exercises: [
      { exerciseId: 'l1_1', name: 'Burpees', muscleGroup: 'Full Body', suggestedSets: 4, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=TU8QYVW0gDU', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6cd21977460d?w=800' },
      { exerciseId: 'l1_2', name: 'Mountain Climbers', muscleGroup: 'Core', suggestedSets: 4, suggestedReps: '40s', videoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM', imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_02', name: 'Cardio Kickboxing', target: 'Pé©rdida de Peso', description: 'Artes marciales para quemar grasa.', duration: 45,
    tags: ['Cardio', 'Boxeo'], imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=1200',
    intensity: 85, resistance: 'Baja', stats: { strength: 30, cardio: 90, technique: 60, mobility: 60, impact: 60 },
    exercises: [
      { exerciseId: 'l2_1', name: 'Shadow Boxing', muscleGroup: 'Cardio', suggestedSets: 5, suggestedReps: '3min', videoUrl: 'https://www.youtube.com/watch?v=jW01e3r3oTU', imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800' },
      { exerciseId: 'l2_2', name: 'Jump Rope', muscleGroup: 'Cardio', suggestedSets: 5, suggestedReps: '2min', videoUrl: 'https://www.youtube.com/watch?v=u3zgHI8QnqE', imageUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_03', name: 'Tabata Torch', target: 'Pé©rdida de Peso', description: 'Protocolo 20/10 intenso.', duration: 25,
    tags: ['Tabata', 'Cardio'], imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
    intensity: 100, resistance: 'Baja', stats: { strength: 40, cardio: 100, technique: 40, mobility: 30, impact: 90 },
    exercises: [
      { exerciseId: 'l3_1', name: 'High Knees', muscleGroup: 'Cardio', suggestedSets: 8, suggestedReps: '20s', videoUrl: 'https://www.youtube.com/watch?v=Z11_kYkS9rQ', imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800' },
      { exerciseId: 'l3_2', name: 'Jump Squats', muscleGroup: 'Legs', suggestedSets: 8, suggestedReps: '20s', videoUrl: 'https://www.youtube.com/watch?v=72BSZDNni_0', imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_04', name: 'Morning Burn', target: 'Pé©rdida de Peso', description: 'Activacié³n metabé³lica matutina.', duration: 20,
    tags: ['Morning', 'Cardio'], imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=1200',
    intensity: 70, resistance: 'Baja', stats: { strength: 20, cardio: 80, technique: 30, mobility: 50, impact: 50 },
    exercises: [
      { exerciseId: 'l4_1', name: 'Jumping Jacks', muscleGroup: 'Cardio', suggestedSets: 3, suggestedReps: '50', videoUrl: 'https://www.youtube.com/watch?v=UpH7rm0cYbM', imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800' },
      { exerciseId: 'l4_2', name: 'Bodyweight Squats', muscleGroup: 'Legs', suggestedSets: 3, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=sw_C1A-rejs', imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_05', name: 'Stair Master', target: 'Pé©rdida de Peso', description: 'Entrenamiento de escaleras o step.', duration: 35,
    tags: ['Legs', 'Cardio'], imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=1200',
    intensity: 80, resistance: 'Media', stats: { strength: 60, cardio: 90, technique: 40, mobility: 30, impact: 60 },
    exercises: [
      { exerciseId: 'l5_1', name: 'Step Up', muscleGroup: 'Legs', suggestedSets: 4, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=9ZknEcJ8yQo', imageUrl: 'https://images.unsplash.com/photo-1538805060512-e282813563bd?w=800' },
      { exerciseId: 'l5_2', name: 'Lunge Jumps', muscleGroup: 'Legs', suggestedSets: 4, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=D7KaRc0W', imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_06', name: 'Core Crusher', target: 'Pé©rdida de Peso', description: 'Enfoque en abdominales y quema de grasa.', duration: 30,
    tags: ['Core', 'Abs'], imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1200',
    intensity: 75, resistance: 'Baja', stats: { strength: 50, cardio: 70, technique: 50, mobility: 40, impact: 30 },
    exercises: [
      { exerciseId: 'l6_1', name: 'Plank Jacks', muscleGroup: 'Core', suggestedSets: 3, suggestedReps: '45s', videoUrl: 'https://www.youtube.com/watch?v=Xc70kwa4b_k', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' },
      { exerciseId: 'l6_2', name: 'Russian Twists', muscleGroup: 'Core', suggestedSets: 3, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_07', name: 'Speed Agility', target: 'Pé©rdida de Peso', description: 'Drills de velocidad y agilidad.', duration: 40,
    tags: ['Agility', 'Cardio'], imageUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?auto=format&fit=crop&q=80&w=1200',
    intensity: 85, resistance: 'Baja', stats: { strength: 40, cardio: 95, technique: 70, mobility: 60, impact: 80 },
    exercises: [
      { exerciseId: 'l7_1', name: 'Ladder Drills', muscleGroup: 'Legs', suggestedSets: 5, suggestedReps: '60s', videoUrl: 'https://www.youtube.com/watch?v=L_6Gk3', imageUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?w=800' },
      { exerciseId: 'l7_2', name: 'Sprints', muscleGroup: 'Legs', suggestedSets: 10, suggestedReps: '50m', videoUrl: 'https://www.youtube.com/watch?v=6BMTvM', imageUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_08', name: 'Fat Destroyer', target: 'Pérdida de Peso', description: 'Circuito intenso para derretir grasa.', duration: 35,
    tags: ['Circuit', 'HIIT'], imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
    intensity: 90, resistance: 'Media', stats: { strength: 50, cardio: 95, technique: 50, mobility: 40, impact: 70 },
    exercises: [
      { exerciseId: 'l8_1', name: 'Kettlebell Swing', muscleGroup: 'Full Body', suggestedSets: 4, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=sKPM5TAZzBs', imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800' },
      { exerciseId: 'l8_2', name: 'Box Jumps', muscleGroup: 'Legs', suggestedSets: 4, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=52r_Ul5k03g', imageUrl: 'https://images.unsplash.com/photo-1538805060512-e282813563bd?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_09', name: 'Lean Machine', target: 'Pérdida de Peso', description: 'Entrenamiento metabólico para definición.', duration: 40,
    tags: ['MetCon', 'Cardio'], imageUrl: 'https://images.unsplash.com/photo-1538805060512-e282813563bd?auto=format&fit=crop&q=80&w=1200',
    intensity: 85, resistance: 'Media', stats: { strength: 55, cardio: 90, technique: 55, mobility: 45, impact: 65 },
    exercises: [
      { exerciseId: 'l9_1', name: 'Thrusters', muscleGroup: 'Full Body', suggestedSets: 4, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=L219ltL15zk', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6cd21977460d?w=800' },
      { exerciseId: 'l9_2', name: 'Rowing', muscleGroup: 'Cardio', suggestedSets: 4, suggestedReps: '500m', videoUrl: 'https://www.youtube.com/watch?v=H0r_ZSmWd9c', imageUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?w=800' }
    ]
  },
  {
    id: 'RT_LOSS_10', name: 'Calorie Killer', target: 'Pérdida de Peso', description: 'Máxima quema calórica en mínimo tiempo.', duration: 30,
    tags: ['HIIT', 'Intense'], imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=1200',
    intensity: 95, resistance: 'Alta', stats: { strength: 60, cardio: 100, technique: 50, mobility: 35, impact: 85 },
    exercises: [
      { exerciseId: 'l10_1', name: 'Battle Ropes', muscleGroup: 'Full Body', suggestedSets: 5, suggestedReps: '30s', videoUrl: 'https://www.youtube.com/watch?v=5l06bvTRus0', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6cd21977460d?w=800' },
      { exerciseId: 'l10_2', name: 'Burpee Box Jump', muscleGroup: 'Full Body', suggestedSets: 5, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=vKsGaQzI', imageUrl: 'https://images.unsplash.com/photo-1538805060512-e282813563bd?w=800' }
    ]
  },

  // --- 2. GANANCIA MUSCULAR (7 Routines) ---
  {
    id: 'RT_GAIN_01', name: 'Hypertrophy: Push', target: 'Ganancia muscular', description: 'Pecho, hombros y tré­ceps.', duration: 70,
    tags: ['Push', 'Hipertrofia'], imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1200',
    intensity: 80, resistance: 'Alta', stats: { strength: 80, cardio: 20, technique: 70, mobility: 40, impact: 50 },
    exercises: [
      { exerciseId: 'g1_1', name: 'Bench Press', muscleGroup: 'Chest', suggestedSets: 4, suggestedReps: '8-10', videoUrl: 'https://www.youtube.com/watch?v=vcBig73ojpE', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' },
      { exerciseId: 'g1_2', name: 'Overhead Press', muscleGroup: 'Shoulders', suggestedSets: 4, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=QAQ64hK4Xxs', imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800' }
    ]
  },
  {
    id: 'RT_GAIN_02', name: 'Hypertrophy: Pull', target: 'Ganancia muscular', description: 'Espalda y bé­ceps.', duration: 70,
    tags: ['Pull', 'Hipertrofia'], imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&q=80&w=1200',
    intensity: 80, resistance: 'Alta', stats: { strength: 80, cardio: 20, technique: 75, mobility: 40, impact: 40 },
    exercises: [
      { exerciseId: 'g2_1', name: 'Pull Ups', muscleGroup: 'Back', suggestedSets: 4, suggestedReps: 'Max', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', imageUrl: 'https://images.unsplash.com/photo-1598971639058-211a74a96c91?w=800' },
      { exerciseId: 'g2_2', name: 'Barbell Row', muscleGroup: 'Back', suggestedSets: 4, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=9efgcGunU90', imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800' }
    ]
  },
  {
    id: 'RT_GAIN_03', name: 'Hypertrophy: Legs', target: 'Ganancia muscular', description: 'Pierna completa.', duration: 80,
    tags: ['Legs', 'Hipertrofia'], imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?auto=format&fit=crop&q=80&w=1200',
    intensity: 90, resistance: 'Muy Alta', stats: { strength: 90, cardio: 30, technique: 80, mobility: 50, impact: 60 },
    exercises: [
      { exerciseId: 'g3_1', name: 'Squat', muscleGroup: 'Legs', suggestedSets: 4, suggestedReps: '6-8', videoUrl: 'https://www.youtube.com/watch?v=SW_C1A-rejs', imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?w=800' },
      { exerciseId: 'g3_2', name: 'RDL', muscleGroup: 'Legs', suggestedSets: 4, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM', imageUrl: 'https://images.unsplash.com/photo-1603287681836-e60567a2d119?w=800' }
    ]
  },
  {
    id: 'RT_GAIN_04', name: 'Arnold Split: Chest/Back', target: 'Ganancia muscular', description: 'Pecho y espalda antagonistas.', duration: 75,
    tags: ['Arnold', 'OldSchool'], imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1200',
    intensity: 85, resistance: 'Alta', stats: { strength: 85, cardio: 30, technique: 70, mobility: 40, impact: 50 },
    exercises: [
      { exerciseId: 'g4_1', name: 'Bench Press', muscleGroup: 'Chest', suggestedSets: 5, suggestedReps: '8', videoUrl: 'https://www.youtube.com/watch?v=vcBig73ojpE', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' },
      { exerciseId: 'g4_2', name: 'Bent Over Row', muscleGroup: 'Back', suggestedSets: 5, suggestedReps: '8', videoUrl: 'https://www.youtube.com/watch?v=9efgcGunU90', imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800' }
    ]
  },
  {
    id: 'RT_GAIN_05', name: 'Shoulder Boulder', target: 'Ganancia muscular', description: 'Especializacié³n en hombros.', duration: 60,
    tags: ['Shoulders', 'Aesthetics'], imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1200',
    intensity: 75, resistance: 'Media', stats: { strength: 70, cardio: 20, technique: 80, mobility: 50, impact: 30 },
    exercises: [
      { exerciseId: 'g5_1', name: 'Military Press', muscleGroup: 'Shoulders', suggestedSets: 4, suggestedReps: '8', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI', imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800' },
      { exerciseId: 'g5_2', name: 'Lateral Raise', muscleGroup: 'Shoulders', suggestedSets: 4, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800' }
    ]
  },
  {
    id: 'RT_GAIN_06', name: 'Arm Blaster', target: 'Ganancia muscular', description: 'Bé­ceps y Tré­ceps masivos.', duration: 55,
    tags: ['Arms', 'Isolation'], imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1200',
    intensity: 70, resistance: 'Media', stats: { strength: 60, cardio: 10, technique: 60, mobility: 30, impact: 20 },
    exercises: [
      { exerciseId: 'g6_1', name: 'Barbell Curl', muscleGroup: 'Biceps', suggestedSets: 4, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=kwG2ipFRgfo', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800' },
      { exerciseId: 'g6_2', name: 'Skullcrusher', muscleGroup: 'Triceps', suggestedSets: 4, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800' }
    ]
  },
  {
    id: 'RT_GAIN_07', name: 'Glute Builder', target: 'Ganancia muscular', description: 'Desarrollo muscular de glúteos.', duration: 65,
    tags: ['Glutes', 'Legs'], imageUrl: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&q=80&w=1200',
    intensity: 85, resistance: 'Alta', stats: { strength: 80, cardio: 30, technique: 70, mobility: 50, impact: 40 },
    exercises: [
      { exerciseId: 'g7_1', name: 'Hip Thrust', muscleGroup: 'Glutes', suggestedSets: 5, suggestedReps: '8', videoUrl: 'https://www.youtube.com/watch?v=SEDQjPArC42k', imageUrl: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800' },
      { exerciseId: 'g7_2', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', suggestedSets: 3, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE', imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?w=800' }
    ]
  },

  // --- 3. TONIFICACIé“N / ESTé‰TICA (7 Routines) ---
  {
    id: 'RT_TONE_01', name: 'Total Body Tone', target: 'Tonificacié³n / Esté©tica', description: 'Cuerpo completo definido.', duration: 50,
    tags: ['Full Body', 'Tone'], imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1200',
    intensity: 70, resistance: 'Media', stats: { strength: 60, cardio: 60, technique: 60, mobility: 50, impact: 40 },
    exercises: [
      { exerciseId: 't1_1', name: 'Goblet Squat', muscleGroup: 'Legs', suggestedSets: 3, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4', imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?w=800' },
      { exerciseId: 't1_2', name: 'Push Up', muscleGroup: 'Chest', suggestedSets: 3, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }
    ]
  },
  {
    id: 'RT_TONE_02', name: 'Beach Force', target: 'Tonificacié³n / Esté©tica', description: 'Prepárate para la playa.', duration: 45,
    tags: ['Summer', 'Tone'], imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200',
    intensity: 70, resistance: 'Media', stats: { strength: 55, cardio: 60, technique: 50, mobility: 40, impact: 40 },
    exercises: [
      { exerciseId: 't2_1', name: 'Lunge Twist', muscleGroup: 'Legs', suggestedSets: 3, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=oi2g', imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?w=800' },
      { exerciseId: 't2_2', name: 'Plank', muscleGroup: 'Core', suggestedSets: 3, suggestedReps: '60s', videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }
    ]
  },
  {
    id: 'RT_TONE_03', name: 'Functional Fit', target: 'Tonificacié³n / Esté©tica', description: 'Movimientos funcionales con Kettlebell.', duration: 55,
    tags: ['Functional', 'Kettlebell'], imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=1200',
    intensity: 75, resistance: 'Media', stats: { strength: 65, cardio: 60, technique: 70, mobility: 60, impact: 50 },
    exercises: [
      { exerciseId: 't3_1', name: 'Kettlebell Swing', muscleGroup: 'Full Body', suggestedSets: 4, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=sKPM5TAZzBs', imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800' }
    ]
  },
  {
    id: 'RT_TONE_04', name: 'Pilates Power', target: 'Tonificacié³n / Esté©tica', description: 'Inspirado en Pilates para core y control.', duration: 45,
    tags: ['Pilates', 'Core'], imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1200',
    intensity: 60, resistance: 'Baja', stats: { strength: 40, cardio: 20, technique: 90, mobility: 70, impact: 10 },
    exercises: [
      { exerciseId: 't4_1', name: 'Hundred', muscleGroup: 'Abs', suggestedSets: 1, suggestedReps: '100', videoUrl: 'https://www.youtube.com/watch?v=1bIe', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }
    ]
  },
  {
    id: 'RT_TONE_05', name: 'Upper Body Sculpt', target: 'Tonificacié³n / Esté©tica', description: 'Definicié³n de brazos y hombros.', duration: 40,
    tags: ['Upper', 'Tone'], imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1200',
    intensity: 65, resistance: 'Media', stats: { strength: 55, cardio: 20, technique: 60, mobility: 40, impact: 20 },
    exercises: [
      { exerciseId: 't5_1', name: 'Dumbbell Press', muscleGroup: 'Shoulders', suggestedSets: 3, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=B7z', imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800' }
    ]
  },
  {
    id: 'RT_TONE_06', name: 'Lower Body Blast', target: 'Tonificacié³n / Esté©tica', description: 'Piernas tonificadas y fuertes.', duration: 45,
    tags: ['Lower', 'Tone'], imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?auto=format&fit=crop&q=80&w=1200',
    intensity: 75, resistance: 'Media', stats: { strength: 65, cardio: 40, technique: 60, mobility: 40, impact: 50 },
    exercises: [
      { exerciseId: 't6_1', name: 'Sumo Squat', muscleGroup: 'Legs', suggestedSets: 3, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=9Zu', imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?w=800' }
    ]
  },
  {
    id: 'RT_TONE_07', name: 'Abs of Steel', target: 'Tonificacié³n / Esté©tica', description: 'Rutina brutal de abdominales.', duration: 25,
    tags: ['Abs', 'SixPack'], imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1200',
    intensity: 80, resistance: 'Baja', stats: { strength: 50, cardio: 30, technique: 50, mobility: 30, impact: 30 },
    exercises: [
      { exerciseId: 't7_1', name: 'Leg Raises', muscleGroup: 'Abs', suggestedSets: 3, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=JB2oyawG9KI', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }
    ]
  },
  {
    id: 'RT_TONE_08', name: 'Body Sculpt', target: 'Tonificación', description: 'Esculpe tu cuerpo con ejercicios de precisión.', duration: 50,
    tags: ['Sculpt', 'Tone'], imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1200',
    intensity: 70, resistance: 'Media', stats: { strength: 60, cardio: 50, technique: 65, mobility: 50, impact: 35 },
    exercises: [
      { exerciseId: 't8_1', name: 'Cable Crossover', muscleGroup: 'Chest', suggestedSets: 3, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' },
      { exerciseId: 't8_2', name: 'Dumbbell Row', muscleGroup: 'Back', suggestedSets: 3, suggestedReps: '12', videoUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo', imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800' }
    ]
  },
  {
    id: 'RT_TONE_09', name: 'Lean & Defined', target: 'Tonificación', description: 'Definición muscular sin volumen.', duration: 45,
    tags: ['Definition', 'Lean'], imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200',
    intensity: 65, resistance: 'Media', stats: { strength: 55, cardio: 55, technique: 60, mobility: 45, impact: 30 },
    exercises: [
      { exerciseId: 't9_1', name: 'Front Raises', muscleGroup: 'Shoulders', suggestedSets: 3, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=HvJ6T8vk6qE', imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800' },
      { exerciseId: 't9_2', name: 'Tricep Extension', muscleGroup: 'Triceps', suggestedSets: 3, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=NzW4mQZCrD8', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800' }
    ]
  },
  {
    id: 'RT_TONE_10', name: 'Athletic Physique', target: 'Tonificación', description: 'Físico atlético y funcional.', duration: 55,
    tags: ['Athletic', 'Functional'], imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&q=80&w=1200',
    intensity: 75, resistance: 'Media', stats: { strength: 65, cardio: 60, technique: 70, mobility: 60, impact: 50 },
    exercises: [
      { exerciseId: 't10_1', name: 'Medicine Ball Slam', muscleGroup: 'Core', suggestedSets: 4, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=Y-b3v', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6cd21977460d?w=800' },
      { exerciseId: 't10_2', name: 'TRX Row', muscleGroup: 'Back', suggestedSets: 3, suggestedReps: '12', videoUrl: 'https://www.youtube.com/watch?v=g5wy', imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800' }
    ]
  },

  // --- 4. RESISTENCIA Y RENDIMIENTO (7 Routines) ---
  {
    id: 'RT_END_01', name: 'Runner Prep', target: 'Resistencia', description: 'Fuerza resistencia para corredores.', duration: 60,
    tags: ['Running', 'Endurance'], imageUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?auto=format&fit=crop&q=80&w=1200',
    intensity: 70, resistance: 'Baja', stats: { strength: 40, cardio: 90, technique: 40, mobility: 40, impact: 70 },
    exercises: [
      { exerciseId: 'e1_1', name: 'Lunge', muscleGroup: 'Legs', suggestedSets: 3, suggestedReps: '30', videoUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U', imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?w=800' }
    ]
  },
  {
    id: 'RT_END_02', name: 'The Grinder', target: 'Resistencia', description: 'MetCon sin descanso.', duration: 40,
    tags: ['MetCon', 'Crossfit'], imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1200',
    intensity: 90, resistance: 'Media', stats: { strength: 50, cardio: 95, technique: 50, mobility: 40, impact: 80 },
    exercises: [
      { exerciseId: 'e2_1', name: 'Wall Ball', muscleGroup: 'Full Body', suggestedSets: 5, suggestedReps: '20', videoUrl: 'https://www.youtube.com/watch?v=EqjC', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800' }
    ]
  },
  {
    id: 'RT_END_03', name: 'Core Endurance', target: 'Resistencia', description: 'Resistencia isomé©trica de core.', duration: 30,
    tags: ['Core', 'Endurance'], imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1200',
    intensity: 60, resistance: 'Baja', stats: { strength: 40, cardio: 40, technique: 50, mobility: 30, impact: 20 },
    exercises: [
      { exerciseId: 'e3_1', name: 'Plank Hold', muscleGroup: 'Abs', suggestedSets: 3, suggestedReps: '90s', videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }
    ]
  },
  {
    id: 'RT_END_04', name: 'Spartan Circuit', target: 'Resistencia', description: 'Entrena como un guerrero.', duration: 50,
    tags: ['Circuit', 'Spartan'], imageUrl: 'https://images.unsplash.com/photo-1517963879433-6cd21977460d?auto=format&fit=crop&q=80&w=1200',
    intensity: 85, resistance: 'Media', stats: { strength: 60, cardio: 85, technique: 50, mobility: 40, impact: 70 },
    exercises: [
      { exerciseId: 'e4_1', name: 'Burpee Broad Jump', muscleGroup: 'Full Body', suggestedSets: 4, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=72', imageUrl: 'https://images.unsplash.com/photo-1517963879433-6cd21977460d?w=800' }
    ]
  },
  {
    id: 'RT_END_05', name: 'Rowing Capacity', target: 'Resistencia', description: 'Intervalos en remo.', duration: 30,
    tags: ['Rowing', 'Cardio'], imageUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?auto=format&fit=crop&q=80&w=1200',
    intensity: 85, resistance: 'Media', stats: { strength: 40, cardio: 100, technique: 60, mobility: 30, impact: 20 },
    exercises: [
      { exerciseId: 'e5_1', name: 'Row', muscleGroup: 'Back', suggestedSets: 5, suggestedReps: '500m', videoUrl: 'https://www.youtube.com/watch?v=H0r_ZSmWd9c', imageUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e609?w=800' }
    ]
  },
  {
    id: 'RT_END_06', name: 'Cycle Power', target: 'Resistencia', description: 'HIIT en bicicleta.', duration: 45,
    tags: ['Cycling', 'Legs'], imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200',
    intensity: 80, resistance: 'Media', stats: { strength: 50, cardio: 90, technique: 30, mobility: 20, impact: 10 },
    exercises: [
      { exerciseId: 'e6_1', name: 'Cycle Sprint', muscleGroup: 'Legs', suggestedSets: 10, suggestedReps: '30s', videoUrl: 'https://www.youtube.com/watch?v=r', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' }
    ]
  },
  {
    id: 'RT_END_07', name: 'Murph Prep', target: 'Resistencia', description: 'Calistenia de alto volumen.', duration: 60,
    tags: ['Calisthenics', 'HeroWod'], imageUrl: 'https://images.unsplash.com/photo-1598971639058-211a74a96c91?auto=format&fit=crop&q=80&w=1200',
    intensity: 90, resistance: 'Media', stats: { strength: 60, cardio: 80, technique: 50, mobility: 40, impact: 40 },
    exercises: [
      { exerciseId: 'e7_1', name: 'Pull Up', muscleGroup: 'Back', suggestedSets: 5, suggestedReps: '5', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', imageUrl: 'https://images.unsplash.com/photo-1598971639058-211a74a96c91?w=800' },
      { exerciseId: 'e7_2', name: 'Push Up', muscleGroup: 'Chest', suggestedSets: 5, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' },
      { exerciseId: 'e7_3', name: 'Squat', muscleGroup: 'Legs', suggestedSets: 5, suggestedReps: '15', videoUrl: 'https://www.youtube.com/watch?v=SW_C1A-rejs', imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?w=800' }
    ]
  },

  // --- 5. MOVILIDAD / FLEXIBILIDAD (7 Routines) ---
  {
    id: 'RT_MOB_01', name: 'Morning Flow', target: 'Movilidad / Flexibilidad', description: 'Despertar articular.', duration: 20,
    tags: ['Yoga', 'Morning'], imageUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=1200',
    intensity: 30, resistance: 'Nula', stats: { strength: 10, cardio: 10, technique: 40, mobility: 100, impact: 0 },
    exercises: [
      { exerciseId: 'm1_1', name: 'Cat-Cow', muscleGroup: 'Back', suggestedSets: 1, suggestedReps: '2min', videoUrl: 'https://www.youtube.com/watch?v=W6vQThdIAIM', imageUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800' }
    ]
  },
  {
    id: 'RT_MOB_02', name: 'Hip Opener', target: 'Movilidad / Flexibilidad', description: 'Liberar cadera tensa.', duration: 25,
    tags: ['Hips', 'Stretch'], imageUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=1200',
    intensity: 30, resistance: 'Nula', stats: { strength: 10, cardio: 10, technique: 50, mobility: 100, impact: 0 },
    exercises: [
      { exerciseId: 'm2_1', name: 'Pigeon', muscleGroup: 'Hips', suggestedSets: 1, suggestedReps: '2min', videoUrl: 'https://www.youtube.com/watch?v=0_zPZc8_rQ0', imageUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800' }
    ]
  },
  {
    id: 'RT_MOB_03', name: 'Spinal Health', target: 'Movilidad / Flexibilidad', description: 'Espalda sana sin dolor.', duration: 20,
    tags: ['Back', 'Health'], imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=1200',
    intensity: 20, resistance: 'Nula', stats: { strength: 10, cardio: 10, technique: 30, mobility: 90, impact: 0 },
    exercises: [
      { exerciseId: 'm3_1', name: 'Thoracic Rotation', muscleGroup: 'Back', suggestedSets: 1, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=t1', imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=800' }
    ]
  },
  {
    id: 'RT_MOB_04', name: 'Deep Squat Mobility', target: 'Movilidad / Flexibilidad', description: 'Mejora tu sentadilla.', duration: 25,
    tags: ['Squat', 'Mobility'], imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?auto=format&fit=crop&q=80&w=1200',
    intensity: 40, resistance: 'Nula', stats: { strength: 20, cardio: 10, technique: 60, mobility: 90, impact: 10 },
    exercises: [
      { exerciseId: 'm4_1', name: 'Deep Squat Hold', muscleGroup: 'Legs', suggestedSets: 3, suggestedReps: '60s', videoUrl: 'https://www.youtube.com/watch?v=J33X5I0iY6w', imageUrl: 'https://images.unsplash.com/photo-1574680096141-9877b4544b91?w=800' }
    ]
  },
  {
    id: 'RT_MOB_05', name: 'Shoulder Mobility', target: 'Movilidad / Flexibilidad', description: 'Hombros libres y sanos.', duration: 20,
    tags: ['Shoulders', 'Mobility'], imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1200',
    intensity: 30, resistance: 'Nula', stats: { strength: 10, cardio: 10, technique: 50, mobility: 90, impact: 0 },
    exercises: [
      { exerciseId: 'm5_1', name: 'Dislocates', muscleGroup: 'Shoulders', suggestedSets: 3, suggestedReps: '10', videoUrl: 'https://www.youtube.com/watch?v=d', imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800' }
    ]
  },
  {
    id: 'RT_MOB_06', name: 'Active Recovery', target: 'Movilidad / Flexibilidad', description: 'Dé­a de descanso activo.', duration: 30,
    tags: ['Recovery', 'Active'], imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1200',
    intensity: 40, resistance: 'Baja', stats: { strength: 20, cardio: 40, technique: 40, mobility: 80, impact: 20 },
    exercises: [
      { exerciseId: 'm6_1', name: 'Walking', muscleGroup: 'Full Body', suggestedSets: 1, suggestedReps: '20min', videoUrl: 'https://www.youtube.com/watch?v=w', imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800' }
    ]
  },
  {
    id: 'RT_MOB_07', name: 'Desk Worker Relief', target: 'Movilidad / Flexibilidad', description: 'Anti-oficina.', duration: 15,
    tags: ['Office', 'Posture'], imageUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=1200',
    intensity: 20, resistance: 'Nula', stats: { strength: 10, cardio: 10, technique: 30, mobility: 90, impact: 0 },
    exercises: [
      { exerciseId: 'm7_1', name: 'Chest Stretch', muscleGroup: 'Chest', suggestedSets: 2, suggestedReps: '60s', videoUrl: 'https://www.youtube.com/watch?v=sI1_LzR-s4', imageUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800' }
    ]
  }
];

export const generateGoalRoutines = (target: string): Routine[] => {
  return ADDITIONAL_ROUTINES.filter(r => r.target === target);
};

export const generateExtendedRoutines = (): Routine[] => {
  const routines: Routine[] = [];
  const difficulties = ['Principiante', 'Intermedio', 'Avanzado'];
  let count = 0;

  // 1. Generate Standard Splits (Push/Pull/Legs) x 3 Levels (9 Routines) - INTERNAL GENERATION
  ['Push', 'Pull', 'Legs'].forEach(split => {
    difficulties.forEach(diff => {
      count++;
      const pool = MASTER_EXERCISE_POOL[split];
      routines.push({
        id: `rt_gen_${count}`,
        name: `${split} - Nivel ${diff}`,
        description: `Rutina de ${split} diseé±ada especé­ficamente para atletas de nivel ${diff}. Enfocada en hipertrofia y control motor.`,
        duration: diff === 'Avanzado' ? 90 : 60,
        tags: [split, 'Hipertrofia', diff],
        imageUrl: IMAGE_LIBRARY[split === 'Legs' ? 'Pierna' : 'Hipertrofia'][count % 2],
        intensity: diff === 'Avanzado' ? 90 : 70,
        resistance: diff === 'Avanzado' ? 'Alta' : 'Media',
        stats: {
          strength: diff === 'Avanzado' ? 90 : 60,
          cardio: 30,
          technique: 80,
          mobility: 40,
          impact: 50
        },
        exercises: pool.map((ex, i) => ({
          exerciseId: `ex_gen_${count}_${i}`,
          name: ex.name,
          muscleGroup: ex.muscle,
          suggestedSets: diff === 'Avanzado' ? 5 : 3,
          suggestedReps: '8-12',
          difficulty: diff as any,
          howTo: ex.desc,
          videoUrl: ex.video,
          imageUrl: ex.img
        }))
      });
    });
  });

  // 2. Base Heavy Lifter
  const baseRoutines: Routine[] = [
    {
      id: 'rt_strength_01',
      name: 'Protocolo: HEAVY LIFTER',
      description: 'Fundamentos de fuerza máxima enfocados en los tres grandes movimientos.',
      duration: 75,
      tags: ['Fuerza', 'Powerlifting', 'Full Body'],
      imageUrl: IMAGE_LIBRARY['Fuerza'][0],
      intensity: 90,
      resistance: 'Alta',
      stats: { strength: 95, cardio: 20, technique: 85, mobility: 40, impact: 80 },
      exercises: MASTER_EXERCISE_POOL['Push'].slice(0, 3).map((ex, i) => ({
        exerciseId: `ex_hl_${i}`, name: ex.name, muscleGroup: ex.muscle, suggestedSets: 5, suggestedReps: '3-5', videoUrl: ex.video, imageUrl: ex.img
      }))
    }
  ];

  return [...baseRoutines, ...routines, ...ADDITIONAL_ROUTINES];
};

export const generateRoutines = (): Routine[] => {
  return generateExtendedRoutines();
};

export async function saveCustomRoutine(routine: Routine, userId: string) {
  if (!isSupabaseConfigured) return;

  try {
    const payload = { ...routine, target: 'Mis Rutinas', isPremium: false, isAiGenerated: false };
    await supabase.from('routines').insert({
      user_id: userId,
      name: routine.name,
      description: routine.description || '',
      data: payload,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error saving custom routine", e);
    throw e;
  }
}
const DEFAULT_STATE: AppState = {
  profile: null,
  routines: [],
  sessions: [],
  activeSession: null,
  personalRecords: {},
  language: 'es'
};

// --- CLOUD SYNC LOGIC ---

const syncToCloud = async (state: AppState) => {
  if (!isSupabaseConfigured) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (state.profile) {

      // 1. Sync Base Profile (Quick Access)
      const payload = {
        profile: state.profile,
        routines: state.routines,
        nutritionPlan: state.nutritionPlan,
        personalRecords: state.personalRecords,
        language: state.language
      };

      await supabase.from('profiles').upsert({
        id: user.id,
        email: state.profile.email,
        name: state.profile.name,
        data: payload,
        updated_at: new Date().toISOString()
      });

      // 2. DETECT WEIGHT CHANGE -> Log to Biometrics History
      const lastWeight = state.profile.weight;
      if (lastWeight > 0) {
        trackerService.logBiometrics(state.profile, { weight: lastWeight });
      }

      // 3. DETECT NEW NUTRITION PLAN -> Version Control
      if (state.nutritionPlan) {
        trackerService.saveNutritionPlanVersion(state.nutritionPlan);
      }
    }
  } catch (e) {
    console.warn("Cloud sync skipped (network issue):", e);
  }
};

export const storage = {
  save: (state: AppState) => {
    const stateWithVersion = { ...state, routineVersion: ROUTINE_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithVersion));

    // BACKUP: Persist FULL STATE to accounts DB for local login after logout
    if (state.profile && state.profile.email) {
      try {
        const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
        accounts[state.profile.email.toLowerCase()] = state;
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch (e) { console.warn("Local backup failed", e); }
    }

    syncToCloud(state).catch(err => console.warn("Error syncing to cloud:", err));
  },

  addSessionToCloud: async (session: WorkoutSession) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use the Structured Session Table instead of just JSON dump
      await supabase.from('workout_sessions').insert({
        user_id: user.id,
        date: session.date,
        routine_name: session.routineName,
        duration_minutes: session.durationMinutes,
        total_volume_kg: session.totalVolume,
        exercises_log: { exercises: session.exercises } // Store details in JSONB column
      });

    } catch (e) {
      console.warn("Could not save session to cloud:", e);
    }
  },

  load: (): AppState => {
    const data = localStorage.getItem(STORAGE_KEY);
    // Initial Load
    if (!data) return { ...DEFAULT_STATE, routines: generateRoutines(), routineVersion: ROUTINE_VERSION };

    const parsed = JSON.parse(data);
    if (!parsed.language) parsed.language = 'es';

    // REGENERATION LOGIC:
    // We want to force upgrade to new routines BUT preserve custom ones.
    const customRoutines = (parsed.routines || []).filter((r: any) => r.target === 'Mis Rutinas');

    // Count routines by target to ensure we have all 5 categories with 7 routines each
    const routinesByTarget = (parsed.routines || []).reduce((acc: any, r: any) => {
      if (r.target && r.target !== 'Mis Rutinas') {
        acc[r.target] = (acc[r.target] || 0) + 1;
      }
      return acc;
    }, {});

    const hasAllTargets = ['Pérdida de Peso', 'Ganancia muscular', 'Tonificación', 'Resistencia', 'Movilidad / Flexibilidad']
      .every(target => (routinesByTarget[target] || 0) >= 7);

    // Check if we need to upgrade.
    const needsUpgrade = !parsed.routines ||
      parsed.routines.length < 28 ||
      !hasAllTargets ||
      parsed.routineVersion !== ROUTINE_VERSION ||
      parsed.routines.some((r: any) => r.target !== 'Mis Rutinas' && (r.exercises.some((e: any) => !e.videoUrl || !e.imageUrl)));

    if (needsUpgrade) {
      console.log("Upgrading routines database to version", ROUTINE_VERSION);
      const staticRoutines = generateRoutines();

      // Merge: Static + Preserved Custom
      // Use map to strictly avoid duplicates by ID
      const mergedMap = new Map();
      staticRoutines.forEach(r => mergedMap.set(r.id, r));
      customRoutines.forEach((r: any) => mergedMap.set(r.id, r)); // Custom overwrites static if ID conflict (unlikely)

      parsed.routines = Array.from(mergedMap.values());
      parsed.routineVersion = ROUTINE_VERSION;
    }

    return { ...DEFAULT_STATE, ...parsed };
  },

  // Nueva funcié³n para recuperar cuenta local
  loginLocal: (email: string, password: string): AppState | null => {
    try {
      const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
      const savedState = accounts[email.toLowerCase()];
      if (savedState && savedState.profile && savedState.profile.password === password) {
        return savedState;
      }
    } catch (e) { return null; }
    return null;
  },

  hydrateFromCloud: async (): Promise<AppState | null> => {
    if (!isSupabaseConfigured) return null;

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      // 1. Fetch Profile Blob (Backward Compatibility)
      const { data: profileRow } = await supabase.from('profiles').select('data').eq('id', user.id).single();

      // 2. Fetch Structured History (The Truth Source)
      const { sessions } = await trackerService.getHistory();

      // 3. FETCH CUSTOM ROUTINES (New Requirement)
      let customRoutinesFromTable: Routine[] = [];
      try {
        const { data: rows } = await supabase.from('routines').select('data').eq('user_id', user.id);
        if (rows) {
          customRoutinesFromTable = rows.map((r: any) => r.data) as Routine[];
        }
      } catch (err) { console.warn("Could not fetch custom routines table", err); }

      if (profileRow && profileRow.data) {
        const cloudData = profileRow.data;

        // Smart Merge of Routines:
        // Start with Fresh Static Set
        let finalRoutines = generateRoutines();

        // Add Custom Routines from Table
        const routineMap = new Map();
        finalRoutines.forEach(r => routineMap.set(r.id, r));

        // Add routines from 'profiles' blob if they are custom and not in table yet?
        // Or just trust the new table + static?
        // Let's blindly trust: Static New + Custom Table + Custom in Blob (legacy)

        customRoutinesFromTable.forEach(r => routineMap.set(r.id, r));

        if (cloudData.routines) {
          const legacyCustom = cloudData.routines.filter((r: any) => r.target === 'Mis Rutinas' || r.target === 'Personalizada');
          legacyCustom.forEach((r: any) => {
            if (!routineMap.has(r.id)) {
              // Update old 'Personalizada' to new 'Mis Rutinas'
              if (r.target === 'Personalizada') r.target = 'Mis Rutinas';
              routineMap.set(r.id, r);
            }
          });
        }

        finalRoutines = Array.from(routineMap.values());

        const newState: AppState = {
          ...DEFAULT_STATE,
          profile: cloudData.profile,
          routines: finalRoutines,
          nutritionPlan: cloudData.nutritionPlan,
          personalRecords: cloudData.personalRecords || {},
          language: cloudData.language || 'es',
          sessions: sessions.length > 0 ? sessions : (cloudData.sessions || [])
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      }
    } catch (e) {
      console.error("Error hydrating from cloud", e);
    }
    return null;
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => { });
    }
    return DEFAULT_STATE;
  },

  getRandomImage: (type: string = 'General') => {
    const pool = (IMAGE_LIBRARY as any)[type] || IMAGE_LIBRARY['General'];
    return pool[Math.floor(Math.random() * pool.length)];
  },

  getExerciseMedia: (name: string): { videoUrl: string, imageUrl: string, howTo?: string } => {
    // 1. Check Exact Match in MASTER_EXERCISE_POOL
    for (const cat in MASTER_EXERCISE_POOL) {
      const found = MASTER_EXERCISE_POOL[cat].find(ex => ex.name.toLowerCase() === name.toLowerCase());
      if (found) return { videoUrl: found.video, imageUrl: found.img, howTo: found.desc };
    }

    // 2. Check Partial Match (Fuzzy)
    for (const cat in MASTER_EXERCISE_POOL) {
      const found = MASTER_EXERCISE_POOL[cat].find(ex => name.toLowerCase().includes(ex.name.toLowerCase()) || ex.name.toLowerCase().includes(name.toLowerCase()));
      if (found) return { videoUrl: found.video, imageUrl: found.img, howTo: found.desc };
    }

    // 3. Fallback based on keywords (Muscle/Type)
    const lowerName = name.toLowerCase();
    let category = 'General';
    if (lowerName.includes('squat') || lowerName.includes('leg') || lowerName.includes('calf') || lowerName.includes('lunge')) category = 'Legs';
    else if (lowerName.includes('press') || lowerName.includes('push') || lowerName.includes('chest') || lowerName.includes('shoulder')) category = 'Push';
    else if (lowerName.includes('pull') || lowerName.includes('row') || lowerName.includes('curl') || lowerName.includes('back')) category = 'Pull';
    else if (lowerName.includes('run') || lowerName.includes('jump') || lowerName.includes('cardio')) category = 'Cardio';

    // Return a random item from the best-guess category as fallback
    const pool = MASTER_EXERCISE_POOL[category] || MASTER_EXERCISE_POOL['General'];
    const fallback = pool[0] || MASTER_EXERCISE_POOL['Push'][0];

    return {
      videoUrl: fallback.video,
      imageUrl: fallback.img,
      howTo: "Realiza el movimiento controlando la fase excé©ntrica y manteniendo la tensié³n."
    };
  }
};

export const statsEngine = {
  getVolumeByDay: (sessions: WorkoutSession[]) => {
    const map: Record<string, number> = {};
    sessions.forEach(s => {
      const date = new Date(s.date).toISOString().split('T')[0];
      map[date] = (map[date] || 0) + s.totalVolume;
    });
    return map;
  },
  getReadiness: (sessions: WorkoutSession[]) => {
    if (sessions.length === 0) return { label: 'é“ptimo', score: 100 };
    const lastSession = new Date(sessions[0].date);
    const now = new Date();
    const diffHours = (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) return { label: 'Fatigado', score: 30 };
    if (diffHours < 48) return { label: 'Recuperando', score: 70 };
    return { label: 'Listo', score: 100 };
  }
};
