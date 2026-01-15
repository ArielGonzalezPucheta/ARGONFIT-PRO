
export type Goal = 'Fuerza' | 'Hipertrofia' | 'Pérdida de Peso' | 'Mantenimiento';

export type PlanTier = 'free' | 'trial' | 'pro' | 'elite';

export interface UserSubscription {
  plan: PlanTier;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  validUntil: string;
  autoRenew: boolean;
}

export interface UserProfile {
  id?: string; // Database UUID
  name: string;
  email?: string;
  password?: string;
  age: number;
  weight: number; // Current weight
  height: number;
  gender: 'Hombre' | 'Mujer';
  goal: Goal;
  experience: 'Principiante' | 'Intermedio' | 'Avanzado';
  somatotype?: 'Ectomorfo' | 'Mesomorfo' | 'Endomorfo';
  frequency: number;
  aiEnabled: boolean;
  streak: number;
  lastWorkoutDate?: string;
  avatarUrl?: string;
  subscription?: UserSubscription;
}

// --- NEW HISTORICAL TYPES ---

export interface BiometricLog {
  id: string;
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  bmi: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
}

export interface DailyLog {
  id: string;
  date: string;
  waterIntake: number; // Liters
  sleepHours: number;
  mood: 1 | 2 | 3 | 4 | 5;
  nutritionCompliance: number; // 0-100%
  notes?: string;
}

// --- EXISTING TYPES ---

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface Meal {
  name: string;
  description: string;
  calories: number;
  macros: { p: number; c: number; f: number };
  ingredients: string[];
  tips: string[];
  warnings: string[];
  instructions?: string[];
}

export interface DailyPlan {
  day: string;
  dailyMacros: MacroNutrients;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack: Meal;
  };
}

export interface NutritionPlan {
  id?: string; // DB ID
  dietType: string;
  description: string;
  status?: 'active' | 'archived'; // Versioning
  createdAt?: string;
  dailyMacros: MacroNutrients;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack: Meal;
  };
  weekly?: DailyPlan[];
  hydrationGoal: number;
  supplements: string[];
  sources: string[];
  lastUpdated: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: SetRecord[];
}

export interface SetRecord {
  id: string;
  weight: number;
  reps: number;
  rir: number;
  completed: boolean;
  isPR?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  duration: number;
  exercises: ExerciseTemplate[];
  tags: string[];
  imageUrl: string;
  intensity: number;
  resistance: string;
  stats: {
    strength: number;
    cardio: number;
    technique: number;
    mobility: number;
    impact: number;
  };
  isAiGenerated?: boolean;
  isPremium?: boolean;
  target?: string;
}

export interface ExerciseTemplate {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  suggestedSets: number;
  suggestedReps: string;
  description?: string;
  howTo?: string;
  benefits?: string;
  videoUrl?: string;
  imageUrl?: string;
  difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  date: string;
  startTime: number;
  endTime?: number;
  durationMinutes: number;
  totalVolume: number;
  exercises: Exercise[];
}

export interface AppState {
  profile: UserProfile | null;
  routines: Routine[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  personalRecords: Record<string, number>;
  nutritionPlan?: NutritionPlan;
  biometricHistory?: BiometricLog[]; // Local cache of history
  dailyLogs?: DailyLog[]; // Local cache of logs
  language: 'es' | 'en';
  routineVersion?: number; // Version control for routine generation
}
