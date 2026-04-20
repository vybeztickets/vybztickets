import { redirect } from "next/navigation";

export default async function IngresoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/organizador/eventos/${id}/scanner`);
}
