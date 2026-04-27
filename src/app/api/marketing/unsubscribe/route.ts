import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Enlace inválido.", { status: 400, headers: { "Content-Type": "text/html" } });
  }

  const admin = createAdminClient();
  const { error } = await (admin as any)
    .from("marketing_contacts")
    .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
    .eq("id", id);

  const html = error
    ? `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px 20px;"><h2>Algo salió mal</h2><p>No pudimos procesar tu solicitud. Por favor intentá de nuevo.</p></body></html>`
    : `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px 20px;color:#333;">
        <h2 style="color:#0a0a0a;">Te desuscribiste correctamente</h2>
        <p style="color:#666;">Ya no recibirás emails de marketing de este organizador.</p>
        <p style="margin-top:32px;"><a href="/" style="color:#0a0a0a;font-size:13px;">Volver al inicio</a></p>
      </body></html>`;

  return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html" } });
}
