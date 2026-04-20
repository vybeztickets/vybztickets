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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f7f7f7" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <a
            href="/"
            className="font-[family-name:var(--font-bebas)] text-5xl tracking-widest text-[#0a0a0a] hover:opacity-50 transition-opacity inline-block"
          >
            VYBZ
          </a>
        </div>

        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  );
}
