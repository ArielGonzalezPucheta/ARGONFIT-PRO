
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Preference } from 'npm:mercadopago'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { planId } = await req.json()

    if (!planId) {
      throw new Error('Plan ID is required (pro or elite)')
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!accessToken) {
      console.error("MP_ACCESS_TOKEN is missing")
      throw new Error('Server configuration error: Missing MP credentials')
    }

    // Configure SDK
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const preference = new Preference(client);

    // Define Plan
    let title = "Argon Fit Subscription"
    let unit_price = 100

    switch (planId) {
      case 'pro':
        title = "Argon Fit - Pro Athlete Plan (Monthly)";
        unit_price = 9900;
        break;
      case 'elite':
        title = "Argon Fit - Elite Protocol Plan (Monthly)";
        unit_price = 18900;
        break;
      default:
        throw new Error(`Invalid plan: ${planId}`)
    }

    // STRICT URL HARDCODING (Fixes "back_url.success must be defined")
    const backUrls = {
      success: "https://argonfit.pro/?payment=success",
      failure: "https://argonfit.pro/subscription?payment=cancelled",
      pending: "https://argonfit.pro/subscription?payment=pending"
    };

    console.log("Creating Preference with URLs:", backUrls);

    // Create Preference using SDK
    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: title,
            quantity: 1,
            unit_price: unit_price,
            currency_id: 'ARS',
          }
        ],
        back_urls: backUrls,
        auto_return: 'approved',
      }
    })

    if (!result.init_point) {
      throw new Error('Failed to create preference')
    }

    return new Response(
      JSON.stringify({ url: result.init_point, id: result.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
