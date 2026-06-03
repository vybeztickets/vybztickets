import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { generateToken } from "@/lib/team-auth";

const VALID_ROLES = ["bar_manager", "inventory_staff", "procurement"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { email, role, name } = body;

  if (!email || !role) return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const admin = createAdminClient();

  const existing = await (admin as any)
    .from("team_members")
    .select("id, status")
    .eq("organizer_id", user.id)
    .eq("email", email.toLowerCase())
    .single();

  if (existing.data && existing.data.status !== "suspended") {
    return NextResponse.json({ error: "This email is already part of your team" }, { status: 409 });
  }

  const invite_token = generateToken();
  const invite_expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  if (existing.data) {
    await (admin as any)
      .from("team_members")
      .update({ invite_token, invite_expires_at, status: "invited", name: name || null, role })
      .eq("id", existing.data.id);
  } else {
    const { error } = await (admin as any).from("team_members").insert({
      organizer_id: user.id,
      email: email.toLowerCase(),
      name: name || null,
      role,
      invite_token,
      invite_expires_at,
      status: "invited",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: orgProfile } = await (admin as any)
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/team/accept?token=${invite_token}`;

  const ROLE_LABELS: Record<string, string> = {
    bar_manager: "Bar Manager",
    inventory_staff: "Inventory Staff",
    procurement: "Procurement",
  };

  try {
    const { resend } = await import("@/lib/mailer");
    await resend.emails.send({
      from: "Vybz <noreply@vybztickets.com>",
      to: email.toLowerCase(),
      subject: `You're invited to join ${orgProfile?.full_name ?? "a venue"} on Vybz`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0a0a0a;">
          <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 8px;">You've been invited</h2>
          <p style="color: #555; margin: 0 0 24px;">
            ${orgProfile?.full_name ?? "A venue"} has invited you to join their team on Vybz as <strong>${ROLE_LABELS[role] ?? role}</strong>.
          </p>
          <a href="${inviteUrl}" style="display: inline-block; background: #0a0a0a; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 100px; font-weight: 600; font-size: 14px;">Accept invitation</a>
          <p style="color: #aaa; font-size: 12px; margin-top: 24px;">This link expires in 48 hours. If you didn't expect this invitation, you can ignore this email.</p>
        </div>
      `,
    });
  } catch {
    // Email failure doesn't block invite creation
  }

  return NextResponse.json({ success: true, inviteUrl });
}
