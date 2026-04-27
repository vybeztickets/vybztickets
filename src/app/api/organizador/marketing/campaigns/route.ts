import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendMarketingBatch } from "@/lib/send-marketing-email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vybztickets.vercel.app";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("marketing_campaigns")
    .select("*")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { subject, body_text, image_url, cta_text, cta_url, audience } = body;

  if (!subject) return NextResponse.json({ error: "El asunto es requerido" }, { status: 400 });

  const admin = createAdminClient();

  // Get organizer profile
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const organizerName = (profile as any)?.full_name || user.email?.split("@")[0] || "Organizador";
  const organizerEmail = (profile as any)?.email || user.email!;
  const organizerLogoUrl = (profile as any)?.avatar_url || null;

  // Get recipients
  let recipients: { email: string; full_name: string | null; id: string }[] = [];

  if (audience && audience.startsWith("event:")) {
    const eventId = audience.replace("event:", "");
    const { data: tickets } = await admin
      .from("tickets")
      .select("buyer_email, buyer_name")
      .eq("event_id", eventId)
      .eq("status", "active");

    if (tickets) {
      const seen = new Set<string>();
      for (const t of tickets as any[]) {
        if (!seen.has(t.buyer_email)) {
          seen.add(t.buyer_email);
          recipients.push({ email: t.buyer_email, full_name: t.buyer_name, id: "" });
        }
      }
    }
  } else {
    // All subscribed contacts
    const { data: contacts } = await (admin as any)
      .from("marketing_contacts")
      .select("id, email, full_name")
      .eq("organizer_id", user.id)
      .eq("subscribed", true);

    recipients = contacts ?? [];
  }

  // Save campaign first
  const { data: campaign, error: campError } = await (admin as any)
    .from("marketing_campaigns")
    .insert({
      organizer_id: user.id,
      subject,
      body_text: body_text || null,
      image_url: image_url || null,
      cta_text: cta_text || null,
      cta_url: cta_url || null,
      audience: audience || "all",
      status: "sent",
      sent_count: recipients.length,
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (campError) return NextResponse.json({ error: campError.message }, { status: 500 });

  // Send emails
  if (recipients.length > 0) {
    const emails = recipients.map((r) => ({
      to: r.email,
      recipientName: r.full_name,
      organizerName,
      organizerEmail,
      organizerLogoUrl,
      subject,
      bodyText: body_text || null,
      imageUrl: image_url || null,
      ctaText: cta_text || null,
      ctaUrl: cta_url || null,
      unsubscribeUrl: `${SITE_URL}/api/marketing/unsubscribe?id=${r.id}`,
    }));

    try {
      await sendMarketingBatch(emails);
    } catch (err: any) {
      console.error("Marketing email batch error:", err.message);
    }
  }

  return NextResponse.json({ campaignId: campaign.id, sent: recipients.length });
}
