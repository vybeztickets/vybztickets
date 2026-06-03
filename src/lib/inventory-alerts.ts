import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/mailer";

type AlertItem = { name: string; current_stock: number; par_level: number; unit: string };

export async function checkAndNotifyLowStock(
  organizerId: string,
  itemIds: string[]
): Promise<void> {
  if (itemIds.length === 0) return;

  const admin = createAdminClient();

  const { data: items } = await (admin as any)
    .from("inventory_items")
    .select("id, name, current_stock, par_level, unit, low_stock_notified")
    .eq("organizer_id", organizerId)
    .in("id", itemIds);

  if (!items || items.length === 0) return;

  const toAlert: AlertItem[] = [];
  const toReset: string[] = [];
  const toMark: string[] = [];

  for (const item of items) {
    const isLow = item.par_level > 0 && Number(item.current_stock) <= Number(item.par_level);

    if (isLow && !item.low_stock_notified) {
      toAlert.push({ name: item.name, current_stock: item.current_stock, par_level: item.par_level, unit: item.unit });
      toMark.push(item.id);
    } else if (!isLow && item.low_stock_notified) {
      toReset.push(item.id);
    }
  }

  if (toMark.length > 0) {
    await (admin as any).from("inventory_items").update({ low_stock_notified: true }).in("id", toMark);
  }
  if (toReset.length > 0) {
    await (admin as any).from("inventory_items").update({ low_stock_notified: false }).in("id", toReset);
  }

  if (toAlert.length === 0) return;

  const { data: org } = await (admin as any)
    .from("profiles")
    .select("email, full_name")
    .eq("id", organizerId)
    .single();

  if (!org?.email) return;

  const itemRows = toAlert.map(i =>
    `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#0a0a0a">${i.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#ef4444;font-weight:600">${i.current_stock} ${i.unit}s</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#888">min ${i.par_level} ${i.unit}s</td>
    </tr>`
  ).join("");

  const subject = toAlert.length === 1
    ? `Low stock: ${toAlert[0].name}`
    : `Low stock alert — ${toAlert.length} items below minimum`;

  try {
    await resend.emails.send({
      from: "Vybz Inventory <noreply@vybztickets.com>",
      to: org.email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0a0a0a">
          <p style="font-size:12px;font-weight:600;letter-spacing:0.12em;color:#888;text-transform:uppercase;margin:0 0 4px">VYBZ INVENTORY</p>
          <h2 style="font-size:22px;font-weight:700;margin:0 0 8px">Stock running low</h2>
          <p style="color:#555;font-size:14px;margin:0 0 24px">
            Hey ${org.full_name?.split(" ")[0] ?? "there"} — the following items dropped below their minimum stock level.
          </p>
          <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:12px;overflow:hidden;border:1px solid #eee">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.08em">Item</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.08em">In stock</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.08em">Threshold</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="margin-top:24px">
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://vybztickets.vercel.app"}/organizador/inventario"
               style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:100px;font-weight:600;font-size:14px">
              View inventory
            </a>
          </div>
          <p style="color:#ccc;font-size:12px;margin-top:24px">You'll only receive this alert once per item until stock is replenished.</p>
        </div>
      `,
    });
  } catch {
    // Email failure is non-blocking
  }
}
