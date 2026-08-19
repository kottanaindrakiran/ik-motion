import React from "react";

/**
 * Simple line-glyph props the stick figure can hold. Each is drawn centred on
 * the origin in a ~34-unit box, in the SAME ink + line weight as the figure, so
 * it reads as one hand-drawn style. drawProp() anchors the glyph at the leading
 * hand. Pure geometry — deterministic.
 */

export const PROP_NAMES = [
  "box", "phone", "book", "rocket", "planet", "brain",
  "arrow_up", "arrow_down", "money", "clock", "bulb",
  "globe", "chip", "question", "chart",
];

const GLYPHS = {
  box: (s) => (
    <>
      <path d="M -14 -6 h 20 v 20 h -20 z" {...s} />
      <path d="M -14 -6 l 6 -8 h 20 l -6 8" {...s} />
      <path d="M 6 -6 l 6 -8 v 20 l -6 8" {...s} />
    </>
  ),
  phone: (s) => (
    <>
      <rect x={-10} y={-16} width={20} height={32} rx={3.5} {...s} />
      <path d="M -4 -12 L 4 -12" {...s} />
      <circle cx={0} cy={11} r={1.8} fill={s.stroke} />
    </>
  ),
  book: (s) => (
    <>
      <path d="M 0 12 L -16 7 L -16 -9 L 0 -4 Z" {...s} />
      <path d="M 0 12 L 16 7 L 16 -9 L 0 -4 Z" {...s} />
      <path d="M 0 -4 L 0 12" {...s} />
    </>
  ),
  rocket: (s) => (
    <>
      <path d="M 0 -18 C 8 -6 8 6 4 14 L -4 14 C -8 6 -8 -6 0 -18 Z" {...s} />
      <circle cx={0} cy={-4} r={3.2} {...s} />
      <path d="M -4 9 L -12 18 L -4 14" {...s} />
      <path d="M 4 9 L 12 18 L 4 14" {...s} />
    </>
  ),
  planet: (s) => (
    <>
      <circle cx={0} cy={0} r={11} {...s} />
      <ellipse cx={0} cy={0} rx={20} ry={7} transform="rotate(-20)" {...s} />
    </>
  ),
  brain: (s) => (
    <>
      <path d="M -12 3 C -17 -10 -2 -15 0 -6 C 2 -15 17 -10 12 3 C 14 13 -14 13 -12 3 Z" {...s} />
      <path d="M 0 -6 L 0 10" {...s} />
      <path d="M -6 -2 q 4 4 0 8" {...s} />
      <path d="M 6 -2 q -4 4 0 8" {...s} />
    </>
  ),
  arrow_up: (s) => (
    <>
      <path d="M 0 16 L 0 -14" {...s} />
      <path d="M -8 -6 L 0 -16 L 8 -6" {...s} />
    </>
  ),
  arrow_down: (s) => (
    <>
      <path d="M 0 -16 L 0 14" {...s} />
      <path d="M -8 6 L 0 16 L 8 6" {...s} />
    </>
  ),
  money: (s) => (
    <>
      <circle cx={0} cy={0} r={14} {...s} />
      <path d="M 0 -9 L 0 9" {...s} />
      <path d="M 5 -5 C -6 -6 -6 0 0 0 C 6 0 6 6 -5 5" {...s} />
    </>
  ),
  clock: (s) => (
    <>
      <circle cx={0} cy={0} r={14} {...s} />
      <path d="M 0 0 L 0 -9" {...s} />
      <path d="M 0 0 L 6 3" {...s} />
    </>
  ),
  bulb: (s) => (
    <>
      <circle cx={0} cy={-3} r={11} {...s} />
      <path d="M -6 8 L 6 8" {...s} />
      <path d="M -5 12 L 5 12" {...s} />
      <path d="M -15 -3 L -19 -3 M 15 -3 L 19 -3 M 0 -18 L 0 -22" {...s} />
    </>
  ),
  globe: (s) => (
    <>
      <circle cx={0} cy={0} r={14} {...s} />
      <ellipse cx={0} cy={0} rx={6} ry={14} {...s} />
      <path d="M -14 0 L 14 0" {...s} />
    </>
  ),
  chip: (s) => (
    <>
      <rect x={-12} y={-12} width={24} height={24} rx={2} {...s} />
      <rect x={-5} y={-5} width={10} height={10} rx={1} {...s} />
      <path d="M -7 -12 L -7 -17 M 0 -12 L 0 -17 M 7 -12 L 7 -17" {...s} />
      <path d="M -7 12 L -7 17 M 0 12 L 0 17 M 7 12 L 7 17" {...s} />
      <path d="M -12 -7 L -17 -7 M -12 0 L -17 0 M -12 7 L -17 7" {...s} />
      <path d="M 12 -7 L 17 -7 M 12 0 L 17 0 M 12 7 L 17 7" {...s} />
    </>
  ),
  question: (s) => (
    <>
      <path d="M -7 -6 C -7 -15 9 -15 7 -5 C 6 1 0 1 0 7" {...s} />
      <circle cx={0} cy={14} r={2.2} fill={s.stroke} />
    </>
  ),
  chart: (s) => (
    <>
      <path d="M -14 -12 L -14 14 L 16 14" {...s} />
      <path d="M -6 14 L -6 4" {...s} />
      <path d="M 2 14 L 2 -2" {...s} />
      <path d="M 10 14 L 10 -8" {...s} />
    </>
  ),
};

export const drawProp = (name, {hand, other, stroke = "#16161a", strokeWidth = 7, flip = false} = {}) => {
  const glyph = GLYPHS[name];
  if (!glyph) return null;
  const s = {
    fill: "none",
    stroke,
    strokeWidth: strokeWidth * 0.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  // Anchor slightly beyond the leading hand so it looks held, not overlapping.
  const hx = (hand?.x ?? 0) + 6;
  const hy = (hand?.y ?? 0) - 2;
  return <g transform={`translate(${hx} ${hy})`}>{glyph(s)}</g>;
};
