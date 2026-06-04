import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { generateToken } from "@/lib/team-auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: member } = await (admin as any)
    .from("team_members")
    .select("id, organizer_id, email, name, role, status, password_hash")
    .eq("email", email.toLowerCase())
    .single();

  if (!member || !member.password_hash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (member.status === "suspended") {
    return NextResponse.json({ error: "Your account has been suspended. Contact your manager." }, { status: 403 });
  }

  if (member.status !== "active") {
    return NextResponse.json({ error: "Account not yet activated. Check your invitation email." }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, member.password_hash);
  if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const token = generateToken();
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await (admin as any).from("team_sessions").insert({
    team_member_id: member.id,
    token,
    expires_at,
  });

  await (admin as any)
    .from("team_members")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", member.id);

  const { password_hash: _, ...safeMember } = member;
  return NextResponse.json({ token, member: safeMember });
}
