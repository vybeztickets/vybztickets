import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: listing } = await supabase
    .from("resale_listings")
    .select("id, seller_id, status")
    .eq("id", id)
    .single();

  if (!listing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (listing.seller_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (listing.status !== "active") {
    return NextResponse.json({ error: "Solo se pueden modificar anuncios activos" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  type ListingUpdate = { resale_price?: number; status?: "cancelled" };
  const updates: ListingUpdate = {};

  if (body.resale_price !== undefined) {
    const p = Number(body.resale_price);
    if (!Number.isFinite(p) || p <= 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }
    updates.resale_price = p;
  }

  if (body.status === "cancelled") {
    updates.status = "cancelled";
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("resale_listings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Handle cancel via form POST (fallback for non-JS)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await req.formData().catch(() => null);
  const method = formData?.get("_method");

  if (method === "cancel") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/auth/login", req.url));

    const { data: listing } = await supabase
      .from("resale_listings")
      .select("id, seller_id, status")
      .eq("id", id)
      .single();

    if (listing && listing.seller_id === user.id && listing.status === "active") {
      await supabase
        .from("resale_listings")
        .update({ status: "cancelled" })
        .eq("id", id);
    }

    return NextResponse.redirect(new URL("/revendedor", req.url));
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
