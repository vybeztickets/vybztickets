"use client";

import { ContainerScroll } from "./ui/container-scroll-animation";
import DashboardMockup from "./DashboardMockup";

export default function ScrollShowcase() {
  return (
    <section className="py-20 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <ContainerScroll
          titleComponent={
            <div className="text-center">
              <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#0a0a0a]/30 mb-4">
                ✦ PANEL DE CONTROL
              </p>
              <h2
                className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.9] tracking-wide"
                style={{ fontSize: "clamp(44px,6vw,80px)" }}
              >
                Todo el control.<br />
                <span style={{ color: "rgba(0,0,0,0.15)" }}>En una pantalla.</span>
              </h2>
              <p className="text-[#0a0a0a]/40 text-base mt-4 max-w-md mx-auto">
                Ingresos, ventas y asistentes — en tiempo real, sin exportar nada.
              </p>
            </div>
          }
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <DashboardMockup dark />
          </div>
        </ContainerScroll>
      </div>
    </section>
  );
}
