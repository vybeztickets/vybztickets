import { redirect } from "next/navigation";

export default async function EventDetailRoot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/organizador/eventos/${id}/estadisticas`);
}
