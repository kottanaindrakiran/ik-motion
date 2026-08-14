import React from "react";
import {random} from "remotion";
import {FONT_TYPEWRITER} from "../theme";

/** Torn top+bottom edges as a seeded clip-path polygon. */
const tornStrip = (seed, steps = 12, amp = 20) => {
  const pts = [];
  for (let i = 0; i <= steps; i++)
    pts.push(`${((i / steps) * 100).toFixed(1)}% ${(random(`${seed}-t-${i}`) * amp).toFixed(1)}%`);
  for (let i = steps; i >= 0; i--)
    pts.push(`${((i / steps) * 100).toFixed(1)}% ${(100 - random(`${seed}-b-${i}`) * amp).toFixed(1)}%`);
  return `polygon(${pts.join(", ")})`;
};

/** Torn-paper strip with uppercase typewriter text — captions and labels. */
const TornLabel = ({text, theme, seed = "label", fontSize = 34, color, bg, sf = 1, style}) => {
  return (
    <div
      style={{
        display: "inline-block",
        position: "relative",
        backgroundColor: bg || theme?.card || "#f5efdf",
        clipPath: tornStrip(seed),
        padding: `${28 * sf}px ${34 * sf}px`,
        boxShadow: `0 ${5 * sf}px ${14 * sf}px rgba(40,28,12,0.28)`,
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: FONT_TYPEWRITER,
          fontSize,
          fontWeight: 400,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: color || theme?.fg || "#1a1611",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default TornLabel;
