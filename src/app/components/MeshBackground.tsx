"use client";

import { MeshGradient } from "@paper-design/shaders-react";

export default function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <MeshGradient
        className="w-full h-full"
        colors={["#ffffff", "#999999", "#f0f0f0", "#bbbbbb"]}
        speed={0.5}
        distortion={1.0}
        swirl={0.5}
      />
    </div>
  );
}
