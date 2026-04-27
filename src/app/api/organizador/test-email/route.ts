import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY no configurado en Vercel" }, { status: 500 });
  }

  const { data, error } = await resend.emails.send({
    from: "Vybz Tickets <onboarding@resend.dev>",
    to: user.email!,
    subject: "Vybz Tickets — Test de email",
    html: `<p>Si recibiste esto, el email está funcionando correctamente.</p><p>Enviado a: <strong>${user.email}</strong></p>`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id, sentTo: user.email });
}
