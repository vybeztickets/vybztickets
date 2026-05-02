import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import MeshBackground from "@/app/components/MeshBackground";
import Image from "next/image";
import Link from "next/link";
import FollowButton from "./FollowButton";
import LinksModal from "./LinksModal";

type CustomLink = { name: string; url: string };

export default async function OrganizerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = createAdminClient();

  // Try by organizer_slug first, then fall back to name-based slug
  const { data: orgBySlug } = await (db as any)
    .from("profiles")
    .select("id, full_name, avatar_url, cover_url, instagram_url, custom_links, description, country, is_public, role, organizer_slug")
    .eq("organizer_slug", slug)
    .maybeSingle();

  let org = orgBySlug;

  if (!org) {
    const { data: allOrgs } = await (db as any)
      .from("profiles")
      .select("id, full_name, avatar_url, cover_url, instagram_url, custom_links, description, country, is_public, role, organizer_slug")
      .in("role", ["organizer", "admin"]);

    org = (allOrgs ?? []).find((o: any) => {
      const computed = o.full_name
        ? o.full_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : null;
      return computed === slug;
    }) ?? null;
  }

  if (!org || !["organizer", "admin"].includes(org.role) || org.is_public === false) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const { data: allEvents } = await db
    .from("events")
    .select("id, name, date, image_url, venue, city, ticket_types(id, price, is_active, total_available, sold_count)")
    .eq("organizer_id", org.id)
    .eq("status", "published")
    .order("date", { ascending: true });

  const upcoming = (allEvents ?? []).filter((e: any) => e.date >= today);
  const past = (allEvents ?? []).filter((e: any) => e.date < today).reverse();

  const { count: followerCount } = await (db as any)
    .from("organizer_follows")
    .select("id", { count: "exact", head: true })
    .eq("organizer_id", org.id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isFollowing = false;
  if (user) {
    const { data: follow } = await (db as any)
      .from("organizer_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("organizer_id", org.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  const customLinks: CustomLink[] = Array.isArray(org.custom_links) ? org.custom_links : [];
  const effectiveSlug = org.organizer_slug ?? slug;

  return (
    <div className="min-h-screen flex flex-col">
      <MeshBackground />
      <Navbar />
      <div id="org-page-content" className="flex-1 flex flex-col">

      {/* Cover */}
      <div className="relative w-full" style={{ height: 280, marginTop: 64 }}>
        {org.cover_url ? (
          <Image src={org.cover_url} alt="Cover" fill className="object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #111 0%, #333 100%)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.6) 100%)" }} />
      </div>

      {/* Profile header card */}
      <div className="max-w-4xl mx-auto w-full px-6 relative" style={{ marginTop: -60 }}>
        <div
          className="rounded-3xl p-6 mb-8"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden shrink-0"
              style={{ border: "3px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", background: "#0a0a0a" }}
            >
              {org.avatar_url ? (
                <Image src={org.avatar_url} alt={org.full_name ?? ""} width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{(org.full_name ?? "?")[0].toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-[#0a0a0a] leading-none mb-1">
                {org.full_name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {org.country && (
                  <span className="text-[#0a0a0a]/40 text-sm">{org.country}</span>
                )}
                {followerCount > 0 && (
                  <span className="text-[#0a0a0a]/30 text-sm">
                    {followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}
                  </span>
                )}
                {upcoming.length > 0 && (
                  <span className="text-[#0a0a0a]/30 text-sm">{upcoming.length} evento{upcoming.length !== 1 ? "s" : ""} próximo{upcoming.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              {org.description && (
                <p className="text-[#0a0a0a]/55 text-sm leading-relaxed mt-2.5 max-w-xl">{org.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 pt-1">
              {org.instagram_url && (
                <a
                  href={org.instagram_url.startsWith("http") ? org.instagram_url : `https://instagram.com/${org.instagram_url.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:opacity-70"
                  style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4.5"/>
                    <circle cx="17.5" cy="6.5" r="0.5" fill="#0a0a0a"/>
                  </svg>
                </a>
              )}
              <LinksModal links={customLinks} organizerName={org.full_name ?? ""} />
              <FollowButton slug={effectiveSlug} organizerId={org.id} initialFollowing={isFollowing} isLoggedIn={!!user} />
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <section className="mb-12">
            <h2 className="text-[#0a0a0a]/50 text-xs font-bold uppercase tracking-wider mb-5">Próximos eventos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {upcoming.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <section className="mb-16">
            <h2 className="text-[#0a0a0a]/50 text-xs font-bold uppercase tracking-wider mb-5">Eventos pasados</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {past.map((event: any) => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          </section>
        )}

        {upcoming.length === 0 && past.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[#0a0a0a]/20 text-sm">Sin eventos publicados todavía</p>
          </div>
        )}
      </div>
      </div>{/* /org-page-content */}
      <Footer />
    </div>
  );
}

function EventCard({ event, isPast }: { event: any; isPast?: boolean }) {
  const activeTickets = (event.ticket_types ?? []).filter((t: any) => t.is_active);
  const minPrice = activeTickets.length
    ? Math.min(...activeTickets.map((t: any) => t.price))
    : null;
  const date = new Date(event.date + "T00:00:00").toLocaleDateString("es-CR", {
    day: "numeric", month: "short",
  });

  return (
    <Link href={`/eventos/${event.id}`} className="group block">
      <div
        className="rounded-2xl overflow-hidden mb-3"
        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
      >
        <div className="relative" style={{ aspectRatio: "3/4" }}>
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ opacity: isPast ? 0.5 : 1 }}
            />
          ) : (
            <div className="w-full h-full" style={{ background: "rgba(0,0,0,0.06)" }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white text-[10px] font-semibold opacity-80">{date}</p>
          </div>
        </div>
        <div className="px-3 py-3">
          <p className="text-[#0a0a0a] text-sm font-semibold leading-tight line-clamp-2 group-hover:opacity-60 transition-opacity">{event.name}</p>
          <p className="text-[#0a0a0a]/35 text-xs mt-1">{event.venue}</p>
          {minPrice !== null && !isPast && (
            <p className="text-[#0a0a0a]/50 text-xs mt-0.5">Desde ${minPrice.toLocaleString("en-US")}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
