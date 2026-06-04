"use client";

import { ContainerScroll } from "./ui/container-scroll-animation";
import DashboardMockup from "./DashboardMockup";

export default function ScrollShowcase() {
  return (
    <div className="overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="text-center">
            <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#0a0a0a]/30 mb-4">
              ✦ DASHBOARD
            </p>
            <h2
              className="font-[family-name:var(--font-bebas)] text-[#0a0a0a] leading-[0.9] tracking-wide mb-4"
              style={{ fontSize: "clamp(44px,6vw,80px)" }}
            >
              All the control.<br />
              <span style={{ color: "rgba(0,0,0,0.15)" }}>On one screen.</span>
            </h2>
            <p className="text-[#0a0a0a]/40 text-base max-w-md mx-auto">
              Revenue, sales and attendees — in real time, no exporting needed.
            </p>
          </div>
        }
      >
        <DashboardMockup dark />
      </ContainerScroll>
    </div>
  );
}
