import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_INITIAL_ROLES = new Set(["user", "pending_activation"]);

export async function POST(req: Request) {
  const { userId, role } = await req.json();

  if (!userId || !ALLOWED_INITIAL_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await db
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
