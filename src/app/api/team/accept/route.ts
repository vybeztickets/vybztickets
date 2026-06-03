import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { generateToken } from "@/lib/team-auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { token, name, password } = body;

  if (!token || !password) return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const admin = createAdminClient();

  const { data: member } = await (admin as any)
    .from("team_members")
    .select("id, status, invite_expires_at")
    .eq("invite_token", token)
    .single();

  if (!member) return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
  if (member.status === "active") return NextResponse.json({ error: "This invitation has already been used" }, { status: 409 });
  if (new Date(member.invite_expires_at) < new Date()) return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });

  const password_hash = await bcrypt.hash(password, 12);
  const sessionToken = generateToken();
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await (admin as any)
    .from("team_members")
    .update({
      status: "active",
      password_hash,
      invite_token: null,
      invite_expires_at: null,
      name: name || null,
    })
    .eq("id", member.id);

  await (admin as any).from("team_sessions").insert({
    team_member_id: member.id,
    token: sessionToken,
    expires_at,
  });

  const { data: fullMember } = await (admin as any)
    .from("team_members")
    .select("id, organizer_id, email, name, role, status")
    .eq("id", member.id)
    .single();

  return NextResponse.json({ token: sessionToken, member: fullMember });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: member } = await (admin as any)
    .from("team_members")
    .select("id, email, name, role, status, invite_expires_at, organizer_id")
    .eq("invite_token", token)
    .single();

  if (!member) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  if (new Date(member.invite_expires_at) < new Date()) return NextResponse.json({ error: "Expired" }, { status: 410 });

  const { data: org } = await (admin as any)
    .from("profiles")
    .select("full_name")
    .eq("id", member.organizer_id)
    .single();

  return NextResponse.json({ member, organizerName: org?.full_name ?? "" });
}
