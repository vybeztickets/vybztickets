"use client";

import { MeshGradient } from "@paper-design/shaders-react";

export default function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <MeshGradient
        className="w-full h-full"
        colors={["#ffffff", "#f0f0f0", "#e2e2e2", "#ebebeb"]}
        speed={0.4}
        distortion={0.5}
        swirl={0.1}
      />
    </div>
  );
}
