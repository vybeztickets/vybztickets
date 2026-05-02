import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Requiere login" }, { status: 401 });

  const { organizerId, notify } = await req.json().catch(() => ({}));
  if (!organizerId) return NextResponse.json({ error: "organizerId requerido" }, { status: 400 });

  const db = createAdminClient();

  const { data: organizer } = await (db as any)
    .from("profiles")
    .select("id")
    .eq("id", organizerId)
    .maybeSingle();

  if (!organizer) return NextResponse.json({ error: "Organizador no encontrado" }, { status: 404 });
  if (organizer.id === user.id) return NextResponse.json({ error: "No puedes seguirte a ti mismo" }, { status: 400 });

  const { data: existing } = await (db as any)
    .from("organizer_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("organizer_id", organizer.id)
    .maybeSingle();

  if (existing) {
    await (db as any).from("organizer_follows").delete().eq("id", existing.id);
    return NextResponse.json({ following: false });
  }

  await (db as any).from("organizer_follows").insert({
    follower_id: user.id,
    organizer_id: organizer.id,
    notify: notify !== false,
  });

  if (notify !== false) {
    const { data: followerProfile } = await (db as any)
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (followerProfile?.email) {
      await (db as any).from("marketing_contacts").upsert(
        {
          organizer_id: organizer.id,
          email: followerProfile.email,
          full_name: followerProfile.full_name ?? null,
          source: "follow",
          subscribed: true,
        },
        { onConflict: "organizer_id,email", ignoreDuplicates: false }
      );
    }
  }

  return NextResponse.json({ following: true });
}
