import { NextResponse } from "next/server";
import { getTeamMemberFromRequest } from "@/lib/team-auth";

export async function GET(request: Request) {
  const member = await getTeamMemberFromRequest(request);
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ member });
}
