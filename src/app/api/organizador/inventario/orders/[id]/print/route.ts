import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: order } = await (admin as any)
    .from("inventory_purchase_orders")
    .select("*, inventory_suppliers(name, contact_name, email, phone)")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (!order) return new NextResponse("Not found", { status: 404 });

  const { data: profile } = await (admin as any)
    .from("profiles")
    .select("full_name, email, avatar_url, business_details")
    .eq("id", user.id)
    .single();

  const itemIds = (order.items as { item_id: string }[]).map(i => i.item_id);
  const { data: inventoryItems } = itemIds.length > 0
    ? await (admin as any).from("inventory_items").select("id, name, unit, cost_per_unit").in("id", itemIds)
    : { data: [] };

  const itemMap = Object.fromEntries((inventoryItems ?? []).map((i: any) => [i.id, i]));

  const poNumber = `PO-${id.slice(0, 8).toUpperCase()}`;
  const poDate = new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const orgName = profile?.full_name ?? "Organizer";
  const orgEmail = profile?.email ?? "";
  const avatarUrl = profile?.avatar_url ?? "";
  const supplier = order.inventory_suppliers;

  const lines = (order.items as { item_id: string; qty: number; unit_cost?: number }[]).map(line => {
    const item = itemMap[line.item_id];
    const name = item?.name ?? line.item_id;
    const unit = item?.unit ?? "unit";
    const unitCost = line.unit_cost ?? item?.cost_per_unit ?? 0;
    const total = line.qty * unitCost;
    return { name, unit, qty: line.qty, unitCost, total };
  });

  const grandTotal = lines.reduce((s, l) => s + l.total, 0);

  const itemRows = lines.map(l => `
    <tr>
      <td>${l.name}</td>
      <td style="text-align:center">${l.qty} ${l.unit}s</td>
      <td style="text-align:right">${l.unitCost > 0 ? `$${l.unitCost.toFixed(2)}` : "—"}</td>
      <td style="text-align:right">${l.total > 0 ? `$${l.total.toFixed(2)}` : "—"}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${poNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0a0a0a; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { display: flex; align-items: center; gap: 14px; }
  .logo img { width: 52px; height: 52px; border-radius: 12px; object-fit: cover; }
  .logo-initials { width: 52px; height: 52px; border-radius: 12px; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; }
  .org-name { font-size: 18px; font-weight: 700; }
  .org-email { font-size: 13px; color: #888; margin-top: 2px; }
  .po-meta { text-align: right; }
  .po-number { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .po-date { font-size: 13px; color: #888; margin-top: 4px; }
  .divider { border: none; border-top: 1px solid #e8e8e8; margin: 32px 0; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .party-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa; margin-bottom: 8px; }
  .party-name { font-size: 15px; font-weight: 600; }
  .party-info { font-size: 13px; color: #666; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { border-bottom: 2px solid #0a0a0a; }
  thead th { padding: 10px 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #888; text-align: left; }
  thead th:not(:first-child) { text-align: right; }
  thead th:nth-child(2) { text-align: center; }
  tbody tr { border-bottom: 1px solid #f0f0f0; }
  tbody td { padding: 12px; font-size: 14px; }
  .total-row { margin-top: 16px; display: flex; justify-content: flex-end; }
  .total-box { background: #f8f8f8; border-radius: 12px; padding: 16px 24px; text-align: right; min-width: 220px; }
  .total-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa; }
  .total-amount { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-top: 4px; }
  .notes { margin-top: 32px; padding: 16px; background: #f8f8f8; border-radius: 12px; }
  .notes-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa; margin-bottom: 8px; }
  .notes-text { font-size: 14px; color: #555; }
  .status-badge { display: inline-block; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-left: 12px; vertical-align: middle; background: #e8e8e8; color: #555; }
  .status-received { background: #dcfce7; color: #166534; }
  .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #ccc; }
  @media print {
    body { padding: 32px; }
    @page { margin: 0.5in; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="logo">
    ${avatarUrl
      ? `<img src="${avatarUrl}" alt="logo" />`
      : `<div class="logo-initials">${orgName.charAt(0).toUpperCase()}</div>`
    }
    <div>
      <div class="org-name">${orgName}</div>
      <div class="org-email">${orgEmail}</div>
    </div>
  </div>
  <div class="po-meta">
    <div class="po-number">${poNumber} <span class="status-badge ${order.status === "received" ? "status-received" : ""}">${order.status}</span></div>
    <div class="po-date">Issued ${poDate}</div>
  </div>
</div>

<hr class="divider" />

<div class="parties">
  <div>
    <div class="party-label">From</div>
    <div class="party-name">${orgName}</div>
    <div class="party-info">${orgEmail}</div>
  </div>
  <div>
    <div class="party-label">To (Supplier)</div>
    <div class="party-name">${supplier?.name ?? "—"}</div>
    ${supplier?.contact_name ? `<div class="party-info">${supplier.contact_name}</div>` : ""}
    ${supplier?.email ? `<div class="party-info">${supplier.email}</div>` : ""}
    ${supplier?.phone ? `<div class="party-info">${supplier.phone}</div>` : ""}
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Item</th>
      <th style="text-align:center">Quantity</th>
      <th style="text-align:right">Unit cost</th>
      <th style="text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="total-row">
  <div class="total-box">
    <div class="total-label">Order total</div>
    <div class="total-amount">${grandTotal > 0 ? `$${grandTotal.toFixed(2)}` : "—"}</div>
  </div>
</div>

${order.notes ? `
<div class="notes">
  <div class="notes-label">Notes</div>
  <div class="notes-text">${order.notes}</div>
</div>` : ""}

<div class="footer">Generated by Vybz · ${poNumber}</div>

<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
