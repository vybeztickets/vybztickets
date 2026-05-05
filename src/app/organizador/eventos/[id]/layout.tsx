import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/organizador/eventos");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, name")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();

  if (!event) notFound();

  return <div>{children}</div>;
}
