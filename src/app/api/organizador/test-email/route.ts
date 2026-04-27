import { createClient } from "@/lib/supabase/server";
import { transporter } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({
      error: "Variables de entorno faltantes",
      GMAIL_USER: gmailUser ? "✓ configurado" : "✗ falta",
      GMAIL_APP_PASSWORD: gmailPass ? "✓ configurado" : "✗ falta",
    }, { status: 500 });
  }

  try {
    await transporter.verify();
    await transporter.sendMail({
      from: `"Vybz Tickets Test" <${gmailUser}>`,
      to: user.email!,
      subject: "Vybz Tickets — Test de email",
      html: `<p>Si recibiste esto, el email está funcionando correctamente.</p><p>Enviado a: <strong>${user.email}</strong></p><p>Desde: <strong>${gmailUser}</strong></p>`,
    });
    return NextResponse.json({ ok: true, sentTo: user.email, from: gmailUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code, command: err.command }, { status: 500 });
  }
}
