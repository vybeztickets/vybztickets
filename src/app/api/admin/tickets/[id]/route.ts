import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role as string | undefined;
  const isAdmin = role === "admin";
  const isOrganizer = role === "organizer";
  if (!isAdmin && !isOrganizer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { buyer_name, buyer_email, buyer_phone, status } = body;

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // If organizer, verify they own the event this ticket belongs to
  if (isOrganizer) {
    const { data: ticket } = await db.from("tickets").select("event_id, events(organizer_id)").eq("id", id).single();
    const ev = ticket?.events as unknown as { organizer_id: string } | null;
    if (!ev || ev.organizer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (buyer_name !== undefined) update.buyer_name = buyer_name;
  if (buyer_email !== undefined) update.buyer_email = buyer_email.toLowerCase().trim();
  if (buyer_phone !== undefined) update.buyer_phone = buyer_phone;
  if (status !== undefined && isAdmin) update.status = status;

  const { error } = await db.from("tickets").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
