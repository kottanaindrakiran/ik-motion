import React from "react";
import {interpolate, random, spring, useCurrentFrame, useVideoConfig} from "remotion";
import PushPin from "./PushPin";

/**
 * Cream card with white border + hard paper shadow, a pushpin at the top and a
 * strip of tape on a corner. Seeded rotation (-3..3deg). Drops in like it's
 * being pinned to the board, then settles.
 */
const PinnedCard = ({
  children,
  theme,
  seed = "card",
  delay = 0,
  pin = true,
  tape = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const sf = Math.min(width, height) / 1080;
  const rot = random(`${seed}-rot`) * 6 - 3; // -3..3deg
  const drop = spring({frame: frame - delay, fps, config: {damping: 14, stiffness: 120, mass: 0.85}});
  const y = interpolate(drop, [0, 1], [-70 * sf, 0]);
  const settle = interpolate(drop, [0, 1], [rot * 1.9, rot]);
  const card = theme.card || "#f5efdf";

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        transform: `translateY(${y}px) rotate(${settle}deg)`,
        opacity: Math.min(1, drop * 1.6),
        ...style,
      }}
    >
      {tape ? (
        <div
          style={{
            position: "absolute",
            top: -14 * sf,
            right: 20 * sf,
            width: 96 * sf,
            height: 34 * sf,
            background: "rgba(230,222,192,0.55)",
            border: "1px solid rgba(180,170,140,0.35)",
            transform: "rotate(24deg)",
            zIndex: 3,
            boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
          }}
        />
      ) : null}

      <div
        style={{
          backgroundColor: card,
          border: `${6 * sf}px solid #fbf7ec`,
          boxShadow: `${9 * sf}px ${13 * sf}px 0 rgba(40,28,12,0.22), 0 ${4 * sf}px ${16 * sf}px rgba(0,0,0,0.18)`,
        }}
      >
        {children}
      </div>

      {pin ? (
        <PushPin
          size={38 * sf}
          style={{position: "absolute", top: -20 * sf, left: "50%", transform: "translateX(-50%)", zIndex: 4}}
        />
      ) : null}
    </div>
  );
};

export default PinnedCard;
