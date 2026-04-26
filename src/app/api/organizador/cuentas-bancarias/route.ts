import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await (admin as any)
    .from("bank_accounts")
    .select("*")
    .eq("organizer_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { account_holder, bank_name, account_type, account_number, currency } = body;
  if (!account_holder || !bank_name || !account_type || !account_number) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Si es la primera cuenta, marcarla como primaria
  const { count } = await (admin as any)
    .from("bank_accounts")
    .select("id", { count: "exact", head: true })
    .eq("organizer_id", user.id);

  const { data, error } = await (admin as any)
    .from("bank_accounts")
    .insert({
      organizer_id: user.id,
      account_holder,
      bank_name,
      account_type,
      account_number,
      currency: currency ?? "CRC",
      is_primary: (count ?? 0) === 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, is_primary } = await request.json();
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const admin = createAdminClient();

  if (is_primary) {
    // Quitar primaria de todas las otras
    await (admin as any)
      .from("bank_accounts")
      .update({ is_primary: false })
      .eq("organizer_id", user.id);
  }

  const { error } = await (admin as any)
    .from("bank_accounts")
    .update({ is_primary })
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any)
    .from("bank_accounts")
    .delete()
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
