"use client";

import { useEffect, useState } from "react";

type RandomLogoProps = {
  size?: number;
  className?: string;
};

type LogoPoint = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
};

type LogoData = {
  palette: string[];
  points: LogoPoint[];
  shapeSeed: number;
};

const PALETTES = [
  ["#0068FF", "#181818", "#E8E6E9"],
  ["#0053D9", "#22252A", "#D8DBE2"],
  ["#0C5DFF", "#101114", "#EEF1F5"],
  ["#1277FF", "#1D2127", "#CFD5DF"],
];

const DEFAULT_LOGO: LogoData = {
  palette: PALETTES[0],
  shapeSeed: 1,
  points: [
    { cx: 14, cy: 14, r: 11, fill: "#0068FF", opacity: 0.95 },
    { cx: 26, cy: 25, r: 10, fill: "#181818", opacity: 0.9 },
    { cx: 25, cy: 14, r: 7, fill: "#E8E6E9", opacity: 0.7 },
    { cx: 15, cy: 24, r: 5, fill: "#0068FF", opacity: 0.7 },
    { cx: 20, cy: 20, r: 5, fill: "#E8E6E9", opacity: 0.65 },
    { cx: 30, cy: 12, r: 4, fill: "#181818", opacity: 0.65 },
  ],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function RandomLogo({ size = 40, className }: RandomLogoProps) {
  const [logo, setLogo] = useState<LogoData>(DEFAULT_LOGO);

  useEffect(() => {
    const palette = PALETTES[randomInt(0, PALETTES.length - 1)];

    const points: LogoPoint[] = Array.from({ length: 6 }).map((_, index) => ({
      cx: randomInt(10, 30),
      cy: randomInt(10, 30),
      r: randomInt(index < 2 ? 10 : 4, index < 2 ? 13 : 9),
      fill: palette[randomInt(0, palette.length - 1)],
      opacity: index < 2 ? 0.95 : 0.75,
    }));

    const shapeSeed = randomInt(0, 1000);
    setLogo({
      palette,
      points,
      shapeSeed,
    });
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="VCare random logo"
    >
      <defs>
        <linearGradient id={`vcare-gradient-${logo.shapeSeed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={logo.palette[0]} />
          <stop offset="100%" stopColor={logo.palette[1]} />
        </linearGradient>
      </defs>

      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="12"
        fill={`url(#vcare-gradient-${logo.shapeSeed})`}
      />

      {logo.points.map((point, index) => (
        <circle
          key={`${point.cx}-${point.cy}-${index}`}
          cx={point.cx}
          cy={point.cy}
          r={point.r}
          fill={point.fill}
          opacity={point.opacity}
        />
      ))}

      <path
        d="M11 28 L18 13 L24 24 L29 11"
        stroke="#FFFFFF"
        strokeOpacity="0.9"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
