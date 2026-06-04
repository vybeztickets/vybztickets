import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

export type TeamMember = {
  id: string;
  organizer_id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function getTeamMemberFromRequest(request: Request): Promise<TeamMember | null> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  return getTeamMemberByToken(token);
}

export async function getTeamMemberByToken(token: string): Promise<TeamMember | null> {
  const admin = createAdminClient();
  const { data } = await (admin as any)
    .from("team_sessions")
    .select("team_member_id, expires_at, team_members(id, organizer_id, email, name, role, status)")
    .eq("token", token)
    .single();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  const m = data.team_members;
  if (!m || m.status !== "active") return null;
  return m as TeamMember;
}

export function hasPermission(role: string, action: "read" | "count" | "orders" | "manage"): boolean {
  const perms: Record<string, string[]> = {
    bar_manager:     ["read", "count", "orders", "manage"],
    inventory_staff: ["read", "count"],
    procurement:     ["read", "orders"],
  };
  return perms[role]?.includes(action) ?? false;
}
