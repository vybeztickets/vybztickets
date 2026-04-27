import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { banner_url } = await req.json();
  if (!banner_url) return NextResponse.json({ error: "banner_url required" }, { status: 400 });

  const admin = createAdminClient();

  const { data, error } = await (admin as any)
    .from("featured_events")
    .update({ banner_url, banner_status: "pending_review" })
    .eq("id", id)
    .eq("organizer_id", user.id)
    .eq("status", "active")
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await (admin as any)
    .from("featured_events")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
