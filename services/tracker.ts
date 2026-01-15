
import { supabase, isSupabaseConfigured } from './supabase';
import { BiometricLog, DailyLog, NutritionPlan, Routine, UserProfile, WorkoutSession } from '../types';

/**
 * Servicio de Tracking y Persistencia Histórica
 * Maneja la lógica de "Append-Only" para biometría y versionado de planes.
 */
export const trackerService = {

  /**
   * Registra una nueva medición biométrica.
   * NO sobrescribe, crea un nuevo registro en la línea de tiempo.
   */
  logBiometrics: async (profile: UserProfile, measurements: Partial<BiometricLog>) => {
    if (!isSupabaseConfigured) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 1. Calcular BMI al momento
      const heightM = profile.height / 100;
      const bmi = measurements.weight ? measurements.weight / (heightM * heightM) : 0;

      // 2. Insertar en log histórico
      const { data, error } = await supabase.from('biometrics_log').insert({
        user_id: user.id,
        weight: measurements.weight,
        body_fat_percentage: measurements.bodyFat,
        muscle_mass_percentage: measurements.muscleMass,
        bmi: parseFloat(bmi.toFixed(1)),
        chest_cm: measurements.measurements?.chest,
        waist_cm: measurements.measurements?.waist,
        recorded_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;

      // 3. Actualizar perfil "actual" para acceso rápido en UI
      await supabase.from('profiles').update({
        weight: measurements.weight, // El peso actual es el último registrado
        updated_at: new Date().toISOString()
      }).eq('id', user.id);

      return data;
    } catch (e) {
      console.error("Error logging biometrics:", e);
      return null;
    }
  },

  /**
   * Guarda un nuevo Plan Nutricional y archiva el anterior.
   * Implementa control de versiones.
   */
  saveNutritionPlanVersion: async (plan: NutritionPlan) => {
    if (!isSupabaseConfigured) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Archivar plan activo anterior
      await supabase.from('nutrition_plans')
        .update({ status: 'archived' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // 2. Insertar nuevo plan activo
      await supabase.from('nutrition_plans').insert({
        user_id: user.id,
        status: 'active',
        name: plan.dietType,
        daily_calories: plan.dailyMacros.calories,
        weekly_structure: plan.weekly, // Guardamos todo el JSON semanal
        hydration_goal: plan.hydrationGoal,
        created_at: new Date().toISOString()
      });

    } catch (e) {
      console.error("Error versioning nutrition plan:", e);
    }
  },

  /**
   * Guarda un Log Diario (Hábitos, Agua, Sueño)
   */
  logDailyActivity: async (log: DailyLog) => {
    if (!isSupabaseConfigured) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('daily_logs').upsert({
        user_id: user.id,
        date: log.date, // Clave única junto con user_id
        water_intake_liters: log.waterIntake,
        sleep_hours: log.sleepHours,
        mood: log.mood,
        nutrition_compliance: log.nutritionCompliance,
        notes: log.notes
      });

      if (error) throw error;
    } catch (e) {
      console.error("Error logging daily activity:", e);
    }
  },

  /**
   * Obtiene el historial completo para gráficas de progreso.
   */
  getHistory: async (): Promise<{ biometrics: BiometricLog[], sessions: WorkoutSession[] }> => {
    if (!isSupabaseConfigured) return { biometrics: [], sessions: [] };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { biometrics: [], sessions: [] };

      // Parallel fetch
      const [bioRes, sessionRes] = await Promise.all([
        supabase.from('biometrics_log').select('*').eq('user_id', user.id).order('recorded_at', { ascending: true }),
        supabase.from('workout_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false })
      ]);

      const biometrics: BiometricLog[] = (bioRes.data || []).map((row: any) => ({
        id: row.id,
        date: row.recorded_at,
        weight: row.weight,
        bodyFat: row.body_fat_percentage,
        bmi: row.bmi,
        measurements: { chest: row.chest_cm, waist: row.waist_cm }
      }));

      // Map session structure from DB to App Type
      const sessions: WorkoutSession[] = (sessionRes.data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        routineId: 'db-record', // Placeholder
        routineName: row.routine_name,
        durationMinutes: row.duration_minutes,
        totalVolume: row.total_volume_kg,
        exercises: row.exercises_log?.exercises || [], // Assuming JSONB structure
        startTime: new Date(row.date).getTime()
      }));

      return { biometrics, sessions };

    } catch (e) {
      console.error("Error fetching history:", e);
      return { biometrics: [], sessions: [] };
    }
  }
};
