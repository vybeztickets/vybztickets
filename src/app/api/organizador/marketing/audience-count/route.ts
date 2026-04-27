import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { audience } = await request.json();
  const admin = createAdminClient();

  const recipientSet = new Set<string>();

  if (audience && audience.startsWith("events:")) {
    const eventIds = (audience as string).replace("events:", "").split(",").filter(Boolean);
    for (const eventId of eventIds) {
      const { data: tickets } = await admin
        .from("tickets")
        .select("buyer_email")
        .eq("event_id", eventId)
        .eq("status", "active");
      for (const t of (tickets ?? []) as any[]) {
        if (t.buyer_email) recipientSet.add(t.buyer_email);
      }
    }
  } else {
    const { data: contacts } = await (admin as any)
      .from("marketing_contacts")
      .select("email")
      .eq("organizer_id", user.id)
      .eq("subscribed", true);
    for (const c of (contacts ?? []) as any[]) {
      if (c.email) recipientSet.add(c.email);
    }
  }

  return NextResponse.json({ count: recipientSet.size });
}
