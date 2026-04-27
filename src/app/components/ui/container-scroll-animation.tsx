"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const rotate = useTransform(scrollYProgress, [0, 0.5], [25, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.92, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.5], [60, 0]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-start relative"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        style={{ translateY, opacity: useTransform(scrollYProgress, [0, 0.25], [0.7, 1]) }}
        className="mb-10 text-center"
      >
        {titleComponent}
      </motion.div>

      <motion.div
        style={{
          rotateX: rotate,
          scale,
          transformOrigin: "center top",
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
