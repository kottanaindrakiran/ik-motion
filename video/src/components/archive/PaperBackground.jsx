import React from "react";
import {AbsoluteFill, random, useVideoConfig} from "remotion";

/** Irregular torn-paper polygon (clip-path) with seeded edge jitter. */
const tornPolygon = (seed, steps = 16, amp = 3.2) => {
  const pts = [];
  for (let i = 0; i <= steps; i++)
    pts.push(`${((i / steps) * 100).toFixed(2)}% ${(random(`${seed}-t-${i}`) * amp).toFixed(2)}%`);
  for (let i = 1; i <= 3; i++)
    pts.push(`${(100 - random(`${seed}-r-${i}`) * amp).toFixed(2)}% ${((i / 4) * 100).toFixed(2)}%`);
  for (let i = 0; i <= steps; i++)
    pts.push(`${(100 - (i / steps) * 100).toFixed(2)}% ${(100 - random(`${seed}-b-${i}`) * amp).toFixed(2)}%`);
  for (let i = 1; i <= 3; i++)
    pts.push(`${(random(`${seed}-l-${i}`) * amp).toFixed(2)}% ${(100 - (i / 4) * 100).toFixed(2)}%`);
  return `polygon(${pts.join(", ")})`;
};

/**
 * Layered old-paper background — all code-generated (no texture images):
 * base color, torn cream sheets, feTurbulence grain, faint map lines,
 * ink specks, scanlines and a strong vignette. Fully deterministic.
 */
const PaperBackground = ({theme}) => {
  const {width, height} = useVideoConfig();
  const sf = Math.min(width, height) / 1080;
  const base = theme.bg || "#e8dcc3";
  const card = theme.card || "#f5efdf";

  const sheets = [
    {c: card, rot: -2.4, x: -4, y: -5, w: 76, h: 92, seed: "sheetA"},
    {c: "#efe6cf", rot: 2.0, x: 28, y: 6, w: 74, h: 90, seed: "sheetB"},
    {c: "#e5d7b7", rot: -1.2, x: 6, y: -9, w: 92, h: 74, seed: "sheetC"},
  ];

  const mapLines = Array.from({length: 5}, (_, i) => {
    const x1 = random(`ml-x1-${i}`) * width;
    const y1 = random(`ml-y1-${i}`) * height;
    const x2 = random(`ml-x2-${i}`) * width;
    const y2 = random(`ml-y2-${i}`) * height;
    const cx = (x1 + x2) / 2 + (random(`ml-cx-${i}`) - 0.5) * width * 0.5;
    const cy = (y1 + y2) / 2 + (random(`ml-cy-${i}`) - 0.5) * height * 0.5;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  });

  const specks = Array.from({length: 48}, (_, i) => ({
    x: random(`sp-x-${i}`) * 100,
    y: random(`sp-y-${i}`) * 100,
    r: (0.6 + random(`sp-r-${i}`) * 2.6) * sf,
    o: 0.05 + random(`sp-o-${i}`) * 0.2,
  }));

  return (
    <AbsoluteFill style={{backgroundColor: base, overflow: "hidden"}}>
      {sheets.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.w}%`,
            height: `${s.h}%`,
            backgroundColor: s.c,
            transform: `rotate(${s.rot}deg)`,
            clipPath: tornPolygon(s.seed),
            boxShadow: `0 ${10 * sf}px ${34 * sf}px rgba(60,45,20,0.2)`,
          }}
        />
      ))}

      <svg width={width} height={height} style={{position: "absolute", inset: 0}}>
        {mapLines.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#5b4a2f" strokeWidth={1.4 * sf} opacity={0.07} />
        ))}
      </svg>

      {specks.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r,
            height: s.r,
            borderRadius: "50%",
            backgroundColor: "#2a2015",
            opacity: s.o,
          }}
        />
      ))}

      {/* Paper grain (fractal noise), multiplied over the sheets. */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.08,
          mixBlendMode: "multiply",
        }}
      >
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperGrain)" />
      </svg>

      {/* Old-film scanlines. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 4px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Vignette. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 44%, rgba(40,28,12,0) 40%, rgba(40,28,12,0.28) 76%, rgba(28,18,6,0.52) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export default PaperBackground;
