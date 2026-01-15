import mercadopago from "mercadopago";

mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        const { planName, price, userEmail } = req.body;

        const preference = {
            items: [
                {
                    title: planName || "Plan ArgonFit",
                    quantity: 1,
                    currency_id: "ARS",
                    unit_price: Number(price)
                }
            ],
            payer: { email: userEmail || "cliente@argonfit.com" },
            back_urls: {
                success: "https://argonfit-pro.vercel.app/success",
                failure: "https://argonfit-pro.vercel.app/failure",
                pending: "https://argonfit-pro.vercel.app/pending"
            },
            auto_return: "approved"
        };

        const response = await mercadopago.preferences.create(preference);
        return res.status(200).json({ init_point: response.body.init_point });
    } catch (err) {
        console.error("Error Mercado Pago:", err);
        return res.status(500).json({ error: "Error creando la preferencia" });
    }
}
