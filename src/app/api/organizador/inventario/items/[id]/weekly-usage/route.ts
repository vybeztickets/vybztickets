import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isValidUUID } from "@/lib/validate";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const admin = createAdminClient();

  // Verify the item belongs to this organizer
  const { data: item } = await (admin as any)
    .from("inventory_items")
    .select("id")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch negative movements (consumption/usage) in last 7 days
  const { data: movements } = await (admin as any)
    .from("inventory_movements")
    .select("quantity_change")
    .eq("organizer_id", user.id)
    .eq("item_id", id)
    .lt("quantity_change", 0)
    .gte("created_at", since);

  const weeklyUsage = ((movements ?? []) as { quantity_change: number }[]).reduce(
    (sum, m) => sum + Math.abs(Number(m.quantity_change)),
    0
  );

  const suggestedParLevel = Math.round(weeklyUsage * 2);

  return NextResponse.json({ weeklyUsage, suggestedParLevel });
}
