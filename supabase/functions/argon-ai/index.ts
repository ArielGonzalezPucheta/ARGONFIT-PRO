
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/genai@0.1.3";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 0. Initialize Supabase Client for Server-Side Verification
    // @ts-ignore
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Get User from Token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid Token" }), { status: 401, headers: corsHeaders });
    }

    // 2. Fetch Trustworthy Profile & Subscription Status
    const { data: dbProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !dbProfile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: corsHeaders });
    }

    const { action, language, message, exerciseName } = await req.json();
    // Use dbProfile instead of client-side profile for critical logic
    const profile = dbProfile;

    // 3. Server-Side Premium Check
    const userPlan = dbProfile.subscription?.plan || 'free';
    const isValid = dbProfile.subscription?.status === 'active';

    // BLOCK actions for Free users (including Chat)
    if ((action === 'generate_routines' || action === 'generate_nutrition' || action === 'chat') && (userPlan === 'free' || !isValid)) {
      return new Response(JSON.stringify({ error: "Premium Access Required" }), { status: 403, headers: corsHeaders });
    }

    // @ts-ignore
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      console.warn("Missing GEMINI_API_KEY. Returning fallback.");
      return new Response(JSON.stringify({
        text: "Argon AI: Sistema offline. Por favor configura mi API Key en Supabase Secrets.",
        routines: [],
        plan: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    let resultData = {};

    // Common Persona Instruction
    // Common Persona Instruction - ARGON FIT PRO VERSION
    const PERSONA = `
    IDENTITY: You are ARGON AI, the elite fitness intelligence engine of ARGON FIT PRO.
    YOUR MISSION: Transform the user into their peak biological potential using science-based protocols.
    
    TONE: Professional, concise, motivating, and highly technical but accessible. Use terms like "Hypertrophy", "progressive overload", "macro-nutrient matrix".
    
    USER PROFILE:
    - Name: ${dbProfile.name}
    - Biometrics: ${dbProfile.weight}kg, ${dbProfile.height}cm, ${dbProfile.age} years.
    - Sex: ${dbProfile.gender} (Adjust hormones/recovery logic accordingly).
    - Somatotype: ${dbProfile.somatotype || 'Mesomorfo'}.
    - Level: ${dbProfile.experience || 'Intermedio'}.
    - GOAL: ${dbProfile.goal || 'General Fitness'}.
    
    CRITICAL RULES:
    1. NEVER hallucinate exercises using dangerous inputs.
    2. ALWAYS justify recommendations with biomechanical or physiological reasons.
    3. If the user is Beginner, focus on technique and adherence. If Advanced, focus on periodization and intensity techniques.
    4. Language: ${language === 'es' ? 'Spanish (Español Neutro)' : 'English'}.
    `;

    if (action === 'get_recommendation') {
      const prompt = `${PERSONA}
        Usuario: ${profile?.name}, Objetivo: ${profile?.goal}. 
        Dame un consejo corto y contundente (máx 120 caracteres) para este momento.`;
      const result = await model.generateContent(prompt);
      resultData = { text: result.response.text() };
    }

    else if (action === 'generate_routines') {
      const prompt = `${PERSONA}
        
        GENERA 3 RUTINAS DE ENTRENAMIENTO ALTAMENTE ESPECÍFICAS PARA:
        - Sexo: ${profile.gender} (Crucial: Adaptar selección de ejercicios y volumen).
        - Nivel: ${profile.experience}.
        - Objetivo: ${profile.goal}.
        - Frecuencia: ${profile.frequency} días/semana.

        ESTRUCTURA REQUERIDA (JSON ARRAY):
        1. Rutina 1: Enfoque Principal (ej: Hipertrofia Tensión Mecánica o Fuerza Neural).
        2. Rutina 2: Enfoque Secundario/Complementario.
        3. Rutina 3: Enfoque Metabólico o Correctivo.

        Para cada ejercicio incluye "howTo" (técnica precisa) y "benefits" (por qué sirve para este perfil específico).
        
        RETURN ONLY A JSON ARRAY of Routine objects.
        `;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      resultData = { routines: JSON.parse(jsonStr) };
    }

    else if (action === 'generate_nutrition') {
      const prompt = `${PERSONA}
        
        GENERA UN PLAN NUTRICIONAL CLÍNICO DE 7 DÍAS.
        
        DATOS DEL PACIENTE:
        - Sexo: ${profile.gender}
        - Edad: ${profile.age}
        - Peso: ${profile.weight} kg
        - Altura: ${profile.height} cm
        - Somatotipo: ${profile.somatotype || 'Mesomorfo'}
        - Actividad: ${profile.frequency} sesiones/sem
        - Objetivo: ${profile.goal}

        INSTRUCCIONES CLÍNICAS:
        1. Calcula TDEE exacto y ajusta déficit/superávit según sexo (Mujeres suelen requerir déficits más conservadores para salud hormonal).
        2. Macros: Ajusta según Somatotipo (Ecto: +Carbs, Endo: +Grasas/Proteína).
        3. MENÚ: Comidas reales, densas nutricionalmente.
        4. PREPARACIÓN: Incluye "instructions" paso a paso para cada comida (cocción, tips).
        5. JUSTIFICACIÓN: En el campo "description" explica por qué este plan funciona para ESTE sexo y perfil hormonal.
        6. VARIEDAD TOTAL: Los 7 días deben tener menús completamente diferentes. No repetir comidas principales (Almuerzo/Cena) durante la semana.

        FORMATO JSON OBLIGATORIO:
        {
          "dietType": "string (ej: 'Ciclo de Carbohidratos para Mujer Endomorfa')",
          "description": "string (Justificación clínica detallada y recomendaciones específicas por sexo)",
          "hydrationGoal": number (litros),
          "supplements": ["string"],
          "weekly": [
            {
              "day": "string",
              "dailyMacros": { "calories": number, "protein": number, "carbs": number, "fats": number },
              "meals": {
                "breakfast": { "name": "string", "calories": number, "macros": {"p":n, "c":n, "f":n}, "ingredients": ["string"], "instructions": ["Paso 1", "Paso 2..."], "tips": ["string"] },
                "lunch": { ... },
                "snack": { ... },
                "dinner": { ... }
              }
            }
            ... (7 días)
          ]
        }
        `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      resultData = { plan: JSON.parse(jsonStr) };
    }

    else if (action === 'chat') {
      const prompt = `${PERSONA}
        Estás chateando con un usuario (${profile.gender}, ${profile.goal}).
        Mensaje del usuario: "${message}".
        
        Responde como el Coach de Hábitos y Entrenador. Sé empático pero firme. Usa datos científicos.
        Responde en JSON: { "text": "...", "routine": null|object }
        `;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      resultData = JSON.parse(jsonStr);
    }

    else if (action === 'find_video') {
      resultData = { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' technique tutorial')}` };
    }

    return new Response(JSON.stringify(resultData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
