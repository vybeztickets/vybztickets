import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const allowed = ["charges_tax", "tax_name", "tax_percent", "tax_entity_type", "tax_legal_name", "tax_id_number", "tax_address", "tax_postcode", "tax_country", "tax_province", "tax_city"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await admin.from("profiles").update(updates as any).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  void request;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("charges_tax,tax_name,tax_percent,tax_entity_type,tax_legal_name,tax_id_number,tax_address,tax_postcode,tax_country,tax_province,tax_city")
    .eq("id", user.id)
    .single();

  return NextResponse.json(data ?? {});
}
