"use client";

import React from "react";
import { motion } from "framer-motion";

const COMET_DOTS = 9; // dots forming the trailing arc
const ARC_DEGREES = 230; // how much of the circle the trail spans

function CometRing({ diameter }: { diameter: number }) {
  const radius = diameter / 2;
  return (
    <div
      className="absolute inset-0"
      style={{ width: diameter, height: diameter }}
    >
      {Array.from({ length: COMET_DOTS }).map((_, i) => {
        const t = i / (COMET_DOTS - 1); // 0 = tail, 1 = head
        const angle = t * ARC_DEGREES;
        const size = 4 + t * 5; // dots grow toward the head
        const opacity = 0.06 + t * 0.94;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              opacity,
              background: t > 0.75 ? "#5eead4" : "#2dd4bf",
              boxShadow:
                t > 0.85 ? "0 0 8px 1px rgba(94,234,212,0.85)" : "none",
              transform: `rotate(${angle}deg) translateY(-${radius}px)`,
            }}
          />
        );
      })}
    </div>
  );
}

export function IconLoader({ size = 128 }: { size?: number }) {
  const orbitDiameter = Math.round(size * 1.55);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: orbitDiameter, height: orbitDiameter }}
    >
      {/* Orbiting comet ring */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
      >
        <CometRing diameter={orbitDiameter} />
      </motion.div>

      {/* Breathing badge */}
      <motion.div
        className="relative rounded-full bg-black ring-1 ring-[#5eead4]/20 grid place-items-center"
        style={{ width: size, height: size }}
        animate={{
          scale: [1, 1.035, 1],
          boxShadow: [
            "0 0 0px 0px rgba(94, 234, 212, 0.0), 0 12px 30px -10px rgba(0,0,0,0.6)",
            "0 0 26px 6px rgba(94, 234, 212, 0.22), 0 12px 30px -10px rgba(0,0,0,0.6)",
            "0 0 0px 0px rgba(94, 234, 212, 0.0), 0 12px 30px -10px rgba(0,0,0,0.6)"
          ]
        }}
        transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
      >
        <svg
          viewBox="45 40 410 410"
          width={size * 0.72}
          height={size * 0.72}
          fill="none"
        >
          {/* static: mast tip above hub */}
          <path d="M215 70 L215 178" stroke="white" strokeWidth="16" strokeLinecap="round" />

          {/* static: hook + dot, hangs below hub */}
          <path
            d="M215 252 C215 340 215 400 250 415 C300 435 340 405 372 372"
            stroke="white"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <circle cx="393" cy="415" r="14" fill="white" />

          {/* hub + three blades — static, part of the fixed mark */}
          <g>
            <path d="M215 215 L105 250" stroke="white" strokeWidth="16" strokeLinecap="round" />
            <path d="M215 215 L330 268" stroke="white" strokeWidth="16" strokeLinecap="round" />
            <path d="M215 215 L215 130" stroke="white" strokeWidth="16" strokeLinecap="round" />
            <circle cx="215" cy="215" r="34" stroke="white" strokeWidth="16" fill="black" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
