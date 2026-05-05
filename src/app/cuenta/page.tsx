import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import Image from "next/image";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatShortDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const metadata = { title: "My Account — Vybz" };

export default async function CuentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/cuenta");

  const admin = createAdminClient();
  const { data: rawProfile } = await (admin as any)
    .from("profiles")
    .select("full_name, email, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = rawProfile as any;

  // Organizers go to their platform
  if (profile?.role === "organizer" || profile?.role === "admin" || profile?.role === "pending_activation") {
    redirect("/organizador");
  }

  const userEmail = (profile?.email ?? user.email ?? "").toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  const displayName = profile?.full_name ?? userEmail;

  const [ticketsRes, followsRes] = await Promise.all([
    (admin as any)
      .from("tickets")
      .select("id, qr_code, buyer_name, status, purchase_price, created_at, transferred_from, transferred_at, ticket_types(id, name), events(id, name, date, venue, city)")
      .eq("buyer_email", userEmail)
      .in("status", ["active", "used", "transferred"])
      .order("created_at", { ascending: false }),
    (admin as any)
      .from("organizer_follows")
      .select("organizer_id, notify")
      .eq("follower_id", user.id),
  ]);

  const tickets = (ticketsRes.data ?? []) as any[];
  const follows = (followsRes.data ?? []) as any[];
  const orgIds = follows.map((f: any) => f.organizer_id);

  let upcomingEvents: any[] = [];
  let orgProfiles: Record<string, any> = {};

  if (orgIds.length > 0) {
    const [eventsRes, profilesRes] = await Promise.all([
      (admin as any)
        .from("events")
        .select("id, name, date, time, venue, city, image_url, organizer_id")
        .in("organizer_id", orgIds)
        .eq("status", "published")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(12),
      (admin as any)
        .from("profiles")
        .select("id, full_name, organizer_slug, avatar_url")
        .in("id", orgIds),
    ]);
    upcomingEvents = eventsRes.data ?? [];
    orgProfiles = Object.fromEntries(
      (profilesRes.data ?? []).map((o: any) => [o.id, o])
    );
  }

  const activeTickets = tickets.filter((t: any) => t.status === "active");
  const pastTickets = tickets.filter((t: any) => t.status !== "active");

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-20">

        {/* Account header */}
        <div className="flex items-center gap-4 mb-10 pb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-white text-lg" style={{ background: "#0a0a0a" }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#0a0a0a]">{displayName}</p>
            <p className="text-sm truncate" style={{ color: "rgba(0,0,0,0.4)" }}>{userEmail}</p>
          </div>
          <a
            href="/api/auth/signout"
            className="text-xs px-3 py-1.5 rounded-lg shrink-0"
            style={{ color: "rgba(0,0,0,0.35)", background: "rgba(0,0,0,0.05)" }}
          >
            Sign out
          </a>
        </div>

        {/* My Tickets */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0a0a0a]">My tickets</h2>
            {tickets.length > 0 && (
              <Link href="/transfer" className="text-xs font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>
                Manage & transfer →
              </Link>
            )}
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-2xl py-12 text-center" style={{ border: "1px dashed rgba(0,0,0,0.1)" }}>
              <p className="text-sm" style={{ color: "rgba(0,0,0,0.3)" }}>No tickets yet</p>
              <Link href="/eventos" className="text-xs underline mt-2 inline-block" style={{ color: "rgba(0,0,0,0.4)" }}>
                Browse events
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTickets.map((t: any) => {
                const ev = t.events as any;
                const isFuture = ev?.date >= today;
                return (
                  <div key={t.id} className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#0a0a0a] truncate">{ev?.name ?? "—"}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>
                          {ev?.date ? formatDate(ev.date) : ""}{ev?.venue ? ` · ${ev.venue}` : ""}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.35)" }}>{(t.ticket_types as any)?.name ?? "—"}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                      <a
                        href={`/ticket/${t.qr_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: "#0a0a0a", color: "#fff" }}
                      >
                        View ticket
                      </a>
                      {t.transferred_from === null && (
                        <Link href="/transfer" className="text-xs font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>
                          Transfer →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}

              {pastTickets.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-3 mt-6" style={{ color: "rgba(0,0,0,0.25)" }}>Past & transferred</p>
                  {pastTickets.map((t: any) => {
                    const ev = t.events as any;
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2 bg-white" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#0a0a0a] truncate">{ev?.name ?? "—"}</p>
                          <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>{ev?.date ? formatShortDate(ev.date) : ""}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{
                          background: t.status === "transferred" ? "rgba(217,119,6,0.1)" : "rgba(0,0,0,0.06)",
                          color: t.status === "transferred" ? "#d97706" : "rgba(0,0,0,0.35)",
                        }}>
                          {t.status === "transferred" ? "Transferred" : "Used"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Following */}
        {follows.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-[#0a0a0a] mb-1">Following</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(0,0,0,0.35)" }}>
              {follows.length} organizer{follows.length !== 1 ? "s" : ""} · upcoming events
            </p>

            {upcomingEvents.length === 0 ? (
              <div className="rounded-2xl py-10 text-center" style={{ border: "1px dashed rgba(0,0,0,0.08)" }}>
                <p className="text-sm" style={{ color: "rgba(0,0,0,0.25)" }}>No upcoming events from organizers you follow</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((e: any) => {
                  const org = orgProfiles[e.organizer_id];
                  const slug = org?.organizer_slug ??
                    org?.full_name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                  return (
                    <Link
                      key={e.id}
                      href={`/eventos/${e.id}`}
                      className="flex items-center gap-4 bg-white rounded-2xl p-4 hover:shadow-sm transition-shadow"
                      style={{ border: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      {e.image_url ? (
                        <Image
                          src={e.image_url}
                          alt={e.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl shrink-0" style={{ background: "rgba(0,0,0,0.06)" }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#0a0a0a] text-sm truncate">{e.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>
                          {formatDate(e.date)}{e.venue ? ` · ${e.venue}` : ""}
                        </p>
                        {org && (
                          <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.28)" }}>{org.full_name}</p>
                        )}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Manage following */}
            <p className="text-xs mt-4" style={{ color: "rgba(0,0,0,0.25)" }}>
              To unfollow, visit the organizer's profile page.
            </p>
          </section>
        )}

        {follows.length === 0 && tickets.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-[#0a0a0a] mb-2">Discover organizers</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(0,0,0,0.35)" }}>Follow your favorite organizers to get notified of new events.</p>
            <Link href="/eventos" className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl" style={{ background: "#0a0a0a", color: "#fff" }}>
              Browse events
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
