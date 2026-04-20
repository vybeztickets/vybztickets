import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, suspend, activate } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: target } = await db.from("profiles").select("role").eq("id", userId).single();
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.role === "admin") return NextResponse.json({ error: "No puedes modificar otro admin" }, { status: 403 });

  let newRole: string;
  if (activate) {
    newRole = "organizer";
  } else if (suspend) {
    newRole = "suspended";
  } else {
    newRole = "organizer";
  }

  const { error } = await db.from("profiles").update({ role: newRole as never }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, role: newRole });
}
