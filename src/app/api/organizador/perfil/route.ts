import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { full_name, email, currency, country } = await request.json();

  const update: Record<string, unknown> = { full_name, email };
  if (currency === "CRC" || currency === "USD") update.currency = currency;
  if (country !== undefined) update.country = country || null;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update(update as any)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
