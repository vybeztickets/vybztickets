import { createClient } from "@/lib/supabase/server";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient as createAdminClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const BUCKET = "kyc-documents";

async function uploadFile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminSupabase: SupabaseClient<any>,
  userId: string,
  field: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${field}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await adminSupabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) return null;
  return path;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("kyc_verifications")
    .select("id, status, submitted_at, rejection_reason")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json(data ?? { status: "none" });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check not already pending/approved
  const { data: existing } = await supabase
    .from("kyc_verifications")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "pending" || existing?.status === "approved") {
    return NextResponse.json({ error: "Ya tenés una verificación activa" }, { status: 409 });
  }

  const form = await req.formData();
  const fullName = form.get("full_name_on_id") as string;
  const cedulaNumber = form.get("cedula_number") as string;
  const paymentMethod = form.get("payment_method") as string;
  const sinpePhone = form.get("sinpe_phone") as string | null;
  const bankName = form.get("bank_name") as string | null;
  const bankIban = form.get("bank_account_iban") as string | null;

  if (!fullName || !cedulaNumber || !paymentMethod) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (!/^\d{9}$/.test(cedulaNumber)) {
    return NextResponse.json({ error: "Número de cédula inválido" }, { status: 400 });
  }

  // Use admin client for storage uploads (bypasses RLS)
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cedulaFrontFile = form.get("cedula_front") as File | null;
  const cedulaBackFile = form.get("cedula_back") as File | null;
  const selfieFile = form.get("selfie") as File | null;

  const [cedulaFrontPath, cedulaBackPath, selfiePath] = await Promise.all([
    cedulaFrontFile ? uploadFile(adminSupabase, user.id, "cedula-front", cedulaFrontFile) : Promise.resolve(null),
    cedulaBackFile ? uploadFile(adminSupabase, user.id, "cedula-back", cedulaBackFile) : Promise.resolve(null),
    selfieFile ? uploadFile(adminSupabase, user.id, "selfie", selfieFile) : Promise.resolve(null),
  ]);

  const insertData = {
    user_id: user.id,
    status: "pending" as const,
    full_name_on_id: fullName.trim(),
    cedula_number: cedulaNumber,
    cedula_front_url: cedulaFrontPath,
    cedula_back_url: cedulaBackPath,
    selfie_url: selfiePath,
    payment_method: paymentMethod as "sinpe_movil" | "bank_transfer",
    sinpe_phone: sinpePhone || null,
    bank_name: bankName || null,
    bank_account_iban: bankIban || null,
    submitted_at: new Date().toISOString(),
  };

  if (existing?.status === "rejected") {
    // Update existing rejected record
    const { error } = await adminSupabase
      .from("kyc_verifications")
      .update({ ...insertData, rejection_reason: null, reviewed_by: null, reviewed_at: null })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await adminSupabase
      .from("kyc_verifications")
      .insert(insertData);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
