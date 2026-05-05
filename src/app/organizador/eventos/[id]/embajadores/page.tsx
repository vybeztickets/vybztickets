import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";

function normalizeReferrer(ref: string | null): string {
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("google")) return "Google";
    if (host.includes("whatsapp")) return "WhatsApp";
    if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) return "Twitter / X";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("youtube")) return "YouTube";
    return host;
  } catch {
    return "Direct";
  }
}

export default async function TrafficSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id")
    .eq("id", id)
    .eq("organizer_id", user.id)
    .single();
  if (!event) notFound();

  const { data: views } = await (admin as any)
    .from("event_views")
    .select("referrer, created_at")
    .eq("event_id", id);

  const allViews = views ?? [];
  const total = allViews.length;

  const referrerMap: Record<string, number> = {};
  allViews.forEach((v: any) => {
    const label = normalizeReferrer(v.referrer);
    referrerMap[label] = (referrerMap[label] ?? 0) + 1;
  });

  const sources = Object.entries(referrerMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, visits]) => ({ name, visits }));

  const cardStyle = { background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" };

  return (
    <div className="p-8 max-w-2xl">
      <div className="rounded-2xl p-6" style={cardStyle}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[#0a0a0a] font-semibold text-sm">Traffic sources</h3>
          <span className="text-[#0a0a0a]/30 text-xs">{total.toLocaleString("en-US")} total visits</span>
        </div>
        <p className="text-[#0a0a0a]/30 text-xs mb-6">All time · where visitors come from</p>

        {sources.length === 0 ? (
          <p className="text-[#0a0a0a]/20 text-sm text-center py-8">No visits tracked yet</p>
        ) : (
          <div className="flex flex-col gap-5">
            {sources.map((s, i) => {
              const pct = total > 0 ? Math.round((s.visits / total) * 100) : 0;
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.08)", color: i === 0 ? "#fff" : "#0a0a0a" }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[#0a0a0a] text-xs font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#0a0a0a]/30 text-xs">{pct}%</span>
                      <span className="text-[#0a0a0a]/60 text-xs font-semibold tabular-nums">
                        {s.visits.toLocaleString("en-US")} visits
                      </span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: i === 0 ? "#0a0a0a" : "rgba(0,0,0,0.22)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
