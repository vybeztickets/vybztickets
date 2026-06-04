import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ML_PER_OZ = 29.5735;

// Alcohol categories that count toward oz usage
const ALCOHOL_CATEGORIES = ["Liquor", "Beer", "Wine", "Spirit", "Spirits"];

type Ingredient = { item_id: string; qty: number; unit: string };
type PosProduct = {
  id: string;
  name: string;
  price: number;
  ingredients: Ingredient[] | null;
  product_category: string | null;
  chief_product_id: string | null;
};
type InvItem = {
  id: string;
  cost_per_unit: number;
  unit_size_ml: number | null;
  unit: string;
  category: string;
};
type Movement = {
  item_id: string;
  type: string;
  quantity_change: number;
};

function ingQtyToOz(qty: number, unit: string): number {
  if (unit === "oz") return qty;
  if (unit === "ml") return qty / ML_PER_OZ;
  if (unit === "dash") return qty * 0.03125;
  if (unit === "splash") return qty * 0.125;
  return 0; // "each" is not measured in oz
}

function bottleSizeOz(inv: InvItem): number {
  if (inv.unit_size_ml && inv.unit_size_ml > 0) return inv.unit_size_ml / ML_PER_OZ;
  return 1; // fallback: treat cost_per_unit as per oz
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // YYYY-MM

  // Resolve month bounds
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    startDate = new Date(y, m - 1, 1);
    endDate = new Date(y, m, 1); // exclusive
  } else {
    // Default: current month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  const since = startDate.toISOString();
  const until = endDate.toISOString();

  const admin = createAdminClient();

  // 1. Fetch POS orders for the month
  const { data: orders, error: ordersErr } = await (admin as any)
    .from("pos_orders")
    .select("id, items")
    .eq("organizer_id", user.id)
    .gte("created_at", since)
    .lt("created_at", until);

  if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 });

  const allOrders = (orders ?? []) as {
    id: string;
    items: { product_id?: string; name: string; qty?: number; quantity?: number; price?: number; subtotal: number }[];
  }[];

  // Aggregate sales by product name (use name as stable key since product_id may be absent)
  const salesMap: Record<string, { name: string; qty: number; revenue: number; productId?: string }> = {};
  for (const order of allOrders) {
    for (const item of (order.items ?? [])) {
      const key = item.name;
      const qty = item.qty ?? item.quantity ?? 1;
      if (!salesMap[key]) salesMap[key] = { name: item.name, qty: 0, revenue: 0, productId: item.product_id };
      salesMap[key].qty += qty;
      salesMap[key].revenue += item.subtotal ?? 0;
    }
  }

  // 2. Fetch pos_products with recipes
  const { data: rawProducts } = await (admin as any)
    .from("pos_products")
    .select("id, name, price, ingredients, product_category, chief_product_id")
    .eq("organizer_id", user.id);

  const posProducts = (rawProducts ?? []) as PosProduct[];
  const productByName: Record<string, PosProduct> = {};
  const productById: Record<string, PosProduct> = {};
  for (const p of posProducts) {
    productByName[p.name] = p;
    productById[p.id] = p;
  }

  // 3. Collect all inventory item ids referenced in recipes
  const inventoryItemIds = new Set<string>();
  for (const p of posProducts) {
    for (const ing of (p.ingredients ?? [])) {
      if (ing.item_id) inventoryItemIds.add(ing.item_id);
    }
  }

  // Also collect chief_product_id linked inventory items
  const chiefProductIds = new Set<string>();
  for (const p of posProducts) {
    if (p.chief_product_id) chiefProductIds.add(p.chief_product_id);
  }

  const invItemMap: Record<string, InvItem> = {};
  if (inventoryItemIds.size > 0) {
    const { data: invItems } = await (admin as any)
      .from("inventory_items")
      .select("id, cost_per_unit, unit_size_ml, unit, category")
      .in("id", [...inventoryItemIds]);
    for (const inv of (invItems ?? []) as InvItem[]) {
      invItemMap[inv.id] = inv;
    }
  }

  // 4. Fetch inventory movements for the month (consumption types)
  const consumptionTypes = ["sale", "empty_bottle", "waste", "count"];
  const { data: rawMovements } = await (admin as any)
    .from("inventory_movements")
    .select("item_id, type, quantity_change")
    .eq("organizer_id", user.id)
    .gte("created_at", since)
    .lt("created_at", until)
    .in("type", consumptionTypes);

  const movements = (rawMovements ?? []) as Movement[];

  // Aggregate actual usage by inventory item id (sum of negative movements → use abs value)
  const actualUsageByItemId: Record<string, number> = {};
  for (const mv of movements) {
    const change = Number(mv.quantity_change);
    // Negative movements = consumption. Count movements may be negative or positive.
    const consumption = mv.type === "count" ? Math.min(0, change) : Math.min(0, change);
    if (consumption < 0) {
      actualUsageByItemId[mv.item_id] = (actualUsageByItemId[mv.item_id] ?? 0) + Math.abs(consumption);
    }
  }

  // 5. Build per-product rows
  type ProductRow = {
    category: string;
    name: string;
    noSold: number;
    posSales: number;
    expectedUseOz: number | null;
    actualUseOz: number | null;
    overShortOz: number | null;
    idealPcPct: number | null;
    actualPcPct: number | null;
    variancePct: number | null;
  };

  const rows: ProductRow[] = [];

  for (const [productName, salesEntry] of Object.entries(salesMap)) {
    const product = productByName[productName];
    const category = product?.product_category ?? "Uncategorized";
    const noSold = salesEntry.qty;
    const posSales = salesEntry.revenue;

    let expectedUseOz: number | null = null;
    let idealPcPct: number | null = null;
    let recipeCostPerSale: number | null = null;

    if (product && product.ingredients && product.ingredients.length > 0) {
      let totalExpectedOz = 0;
      let totalRecipeCost = 0;
      let hasAlcohol = false;
      let hasCostData = false;

      for (const ing of product.ingredients) {
        const inv = invItemMap[ing.item_id];
        const isAlcohol = inv && ALCOHOL_CATEGORIES.some(c => c.toLowerCase() === (inv.category ?? "").toLowerCase());

        if (isAlcohol || ing.unit === "oz" || ing.unit === "ml") {
          // Only count oz for alcohol/spirit ingredients
          if (isAlcohol) {
            const oz = ingQtyToOz(ing.qty, ing.unit);
            totalExpectedOz += oz;
            hasAlcohol = true;
          }
        }

        // Cost calculation for all ingredients
        if (inv) {
          hasCostData = true;
          let costForIng = 0;
          if (ing.unit === "each") {
            costForIng = ing.qty * inv.cost_per_unit;
          } else {
            const qtyOz = ingQtyToOz(ing.qty, ing.unit);
            const bsOz = bottleSizeOz(inv);
            const costPerOz = inv.cost_per_unit / bsOz;
            costForIng = qtyOz * costPerOz;
          }
          totalRecipeCost += costForIng;
        }
      }

      if (hasAlcohol) expectedUseOz = totalExpectedOz * noSold;
      if (hasCostData) {
        recipeCostPerSale = totalRecipeCost;
        idealPcPct = posSales > 0 ? (totalRecipeCost / (posSales / noSold)) * 100 : null;
      }
    }

    // Actual use oz: sum of movements for all alcohol ingredients of this product
    let actualUseOz: number | null = 0;
    let actualCostUsed = 0;
    let hasActualData = false;

    if (product && product.ingredients && product.ingredients.length > 0) {
      for (const ing of product.ingredients) {
        const inv = invItemMap[ing.item_id];
        if (!inv) continue;
        const isAlcohol = ALCOHOL_CATEGORIES.some(c => c.toLowerCase() === (inv.category ?? "").toLowerCase());
        if (!isAlcohol) continue;

        const usedBottles = actualUsageByItemId[ing.item_id] ?? 0;
        // Convert bottle-units to oz
        const usedOz = usedBottles * bottleSizeOz(inv);
        actualUseOz = (actualUseOz ?? 0) + usedOz;

        const costPerOz = inv.cost_per_unit / bottleSizeOz(inv);
        actualCostUsed += usedOz * costPerOz;
        hasActualData = true;
      }
    } else {
      actualUseOz = null;
    }

    // If no recipe, still show the row but with nulls
    if (!product || !product.ingredients || product.ingredients.length === 0) {
      actualUseOz = null;
    }

    const overShortOz =
      expectedUseOz !== null && actualUseOz !== null
        ? expectedUseOz - actualUseOz
        : null;

    const actualPcPct =
      hasActualData && posSales > 0 && actualUseOz !== null
        ? (actualCostUsed / posSales) * 100
        : null;

    const variancePct =
      actualPcPct !== null && idealPcPct !== null
        ? actualPcPct - idealPcPct
        : null;

    rows.push({
      category,
      name: productName,
      noSold,
      posSales,
      expectedUseOz,
      actualUseOz,
      overShortOz,
      idealPcPct,
      actualPcPct,
      variancePct,
    });
  }

  // 6. Group by category
  const categoryMap: Record<string, ProductRow[]> = {};
  for (const row of rows) {
    if (!categoryMap[row.category]) categoryMap[row.category] = [];
    categoryMap[row.category].push(row);
  }

  // Build grouped output with subtotals
  const grouped = Object.entries(categoryMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, catRows]) => {
      const subtotal = {
        noSold: catRows.reduce((s, r) => s + r.noSold, 0),
        posSales: catRows.reduce((s, r) => s + r.posSales, 0),
        expectedUseOz: catRows.some(r => r.expectedUseOz !== null)
          ? catRows.reduce((s, r) => s + (r.expectedUseOz ?? 0), 0)
          : null,
        actualUseOz: catRows.some(r => r.actualUseOz !== null)
          ? catRows.reduce((s, r) => s + (r.actualUseOz ?? 0), 0)
          : null,
        overShortOz: null as number | null,
      };
      subtotal.overShortOz =
        subtotal.expectedUseOz !== null && subtotal.actualUseOz !== null
          ? subtotal.expectedUseOz - subtotal.actualUseOz
          : null;
      return { category, rows: catRows, subtotal };
    });

  // Grand total
  const grandTotal = {
    noSold: rows.reduce((s, r) => s + r.noSold, 0),
    posSales: rows.reduce((s, r) => s + r.posSales, 0),
    expectedUseOz: rows.some(r => r.expectedUseOz !== null)
      ? rows.reduce((s, r) => s + (r.expectedUseOz ?? 0), 0)
      : null,
    actualUseOz: rows.some(r => r.actualUseOz !== null)
      ? rows.reduce((s, r) => s + (r.actualUseOz ?? 0), 0)
      : null,
    overShortOz: null as number | null,
  };
  grandTotal.overShortOz =
    grandTotal.expectedUseOz !== null && grandTotal.actualUseOz !== null
      ? grandTotal.expectedUseOz - grandTotal.actualUseOz
      : null;

  return NextResponse.json({ grouped, grandTotal, month: monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` });
}
