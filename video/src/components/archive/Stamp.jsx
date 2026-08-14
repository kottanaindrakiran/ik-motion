import React from "react";
import {interpolate, random, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {FONT_CONDENSED} from "../theme";

/**
 * Rubber-stamp text in a double-lined box. Thumps in (quick scale-down spring)
 * and sits at low opacity with multiply blend, like real ink.
 */
const Stamp = ({text, theme, color, rotation, delay = 0, fontSize = 40, seed = "stamp", sf = 1, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const col = color || theme?.accent || "#b5442d";
  const rot = rotation == null ? random(`${seed}-rot`) * 16 - 8 : rotation;
  const thump = spring({frame: frame - delay, fps, config: {damping: 9, stiffness: 220, mass: 0.6}});
  const scale = interpolate(thump, [0, 1], [1.7, 1], {extrapolateRight: "clamp"});
  const op = interpolate(thump, [0, 0.2, 1], [0, 0.95, 0.82], {extrapolateRight: "clamp"});

  return (
    <div
      style={{
        display: "inline-block",
        transform: `rotate(${rot}deg) scale(${scale})`,
        opacity: op,
        mixBlendMode: "multiply",
        ...style,
      }}
    >
      <div
        style={{
          border: `${4 * sf}px solid ${col}`,
          borderRadius: 4 * sf,
          padding: `${8 * sf}px ${20 * sf}px`,
          fontFamily: FONT_CONDENSED,
          fontWeight: 700,
          fontSize,
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: col,
          boxShadow: `inset 0 0 0 ${2 * sf}px ${col}`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default Stamp;
