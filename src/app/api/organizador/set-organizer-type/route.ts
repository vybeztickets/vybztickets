import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const VALID_TYPES = ["discoteca", "organizador", "festival"] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { organizer_type } = body;

  if (!VALID_TYPES.includes(organizer_type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await (admin as any).from("profiles").select("business_details").eq("id", user.id).single();
  const current = (existing?.business_details as Record<string, unknown>) ?? {};

  const { error } = await (admin as any)
    .from("profiles")
    .update({ business_details: { ...current, organizer_type } })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
