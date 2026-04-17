import LoginForm from "./LoginForm";

export const metadata = {
  title: "Iniciar sesión — Vybz Tickets",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="blob blob-1" style={{ opacity: 0.25 }} />
        <div className="blob blob-2" style={{ opacity: 0.2 }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="gradient-text font-[family-name:var(--font-bebas)] text-5xl tracking-widest inline-block">
            VYBZ
          </a>
          <p className="text-white/30 text-sm mt-2">Costa Rica's premier ticket platform</p>
        </div>

        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  );
}
