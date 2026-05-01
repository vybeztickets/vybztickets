import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { full_name, email, currency, country, description, whatsapp, is_public,
    avatar_url, cover_url, instagram_url, custom_links } = body;

  const slug = full_name
    ? full_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60)
    : undefined;

  const update: Record<string, unknown> = { full_name, email };
  if (currency === "CRC" || currency === "USD") update.currency = currency;
  if (country !== undefined) update.country = country || null;
  if (description !== undefined) update.description = description || null;
  if (whatsapp !== undefined) update.whatsapp = whatsapp || null;
  if (is_public !== undefined) update.is_public = is_public;
  if (avatar_url !== undefined) update.avatar_url = avatar_url || null;
  if (cover_url !== undefined) update.cover_url = cover_url || null;
  if (instagram_url !== undefined) update.instagram_url = instagram_url || null;
  if (custom_links !== undefined) update.custom_links = custom_links;
  if (slug) update.organizer_slug = slug;

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(update as any).eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, slug });
}
