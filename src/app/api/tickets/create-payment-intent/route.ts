import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ONVO_API = "https://api.onvopay.com/v1";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { amount, currency = "CRC", description } = await request.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${ONVO_API}/payment-intents`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ONVO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency, description }),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con el procesador de pagos" }, { status: 502 });
  }

  const text = await res.text();
  if (!text) {
    return NextResponse.json({ error: "El procesador de pagos no respondió. Verificá que tu cuenta ONVO esté activada." }, { status: 502 });
  }

  let data: Record<string, unknown>;
  try { data = JSON.parse(text); } catch {
    const preview = text.slice(0, 200);
    return NextResponse.json(
      { error: `ONVO devolvió una respuesta no-JSON (status ${res.status}): ${preview}` },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json({ error: (data.message as string) ?? "Error al crear el pago" }, { status: res.status });
  }

  return NextResponse.json({ paymentIntentId: data.id });
}
