import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("marketing_contacts")
    .select("id, email, full_name, source, subscribed, created_at")
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
  const { contacts } = body as { contacts: { email: string; full_name?: string }[] };

  if (!Array.isArray(contacts) || contacts.length === 0)
    return NextResponse.json({ error: "Sin contactos" }, { status: 400 });

  const rows = contacts
    .filter((c) => c.email && c.email.includes("@"))
    .map((c) => ({
      organizer_id: user.id,
      email: c.email.trim().toLowerCase(),
      full_name: c.full_name?.trim() || null,
      source: "import",
      subscribed: true,
    }));

  const admin = createAdminClient();
  const { error } = await (admin as any)
    .from("marketing_contacts")
    .upsert(rows, { onConflict: "organizer_id,email", ignoreDuplicates: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: rows.length });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "Sin ids" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any)
    .from("marketing_contacts")
    .delete()
    .in("id", ids)
    .eq("organizer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: ids.length });
}
