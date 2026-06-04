/*
 * Run in Supabase SQL editor before deploying:
 *
 * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_details jsonb;
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { account_type, first_name, last_name, email, id_number, phone_code, phone_number, company_name, company_id } = body;

  const admin = createAdminClient();

  const { error } = await (admin as any)
    .from("profiles")
    .update({
      business_details: {
        account_type, first_name, last_name,
        id_number, phone_code, phone_number,
        company_name, company_id,
      },
      ...(email ? { email } : {}),
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
