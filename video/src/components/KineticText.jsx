import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

/**
 * Word-by-word kinetic reveal. Every word springs up with a stagger.
 * accentEvery: highlight every Nth word in accentColor (0 = off).
 */
const KineticText = ({
  text,
  color = "#fff",
  accentColor,
  accentEvery = 0,
  fontSize = 72,
  fontWeight = 800,
  fontFamily,
  delay = 0,
  stagger = 3,
  lineHeight = 1.18,
  justify = "center",
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = String(text).split(" ").filter(Boolean);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.3em",
        fontSize, // so the em-based gap scales with the actual word size
        justifyContent: justify,
      }}
    >
      {words.map((w, i) => {
        const s = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: {damping: 200, stiffness: 130},
        });
        const isAccent = accentEvery > 0 && (i + 1) % accentEvery === 0;
        return (
          <span
            key={i}
            style={{
              fontSize,
              fontWeight,
              fontFamily,
              lineHeight,
              color: isAccent && accentColor ? accentColor : color,
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [45, 0])}px)`,
              display: "inline-block",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export default KineticText;
