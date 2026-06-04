import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ success: true });

  const admin = createAdminClient();
  await (admin as any).from("team_sessions").delete().eq("token", token);
  return NextResponse.json({ success: true });
}
