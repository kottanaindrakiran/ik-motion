import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import PushPin from "./PushPin";

/**
 * Red string between two points (composition px), slightly curved, drawn on
 * with strokeDashoffset, a pushpin at each end.
 */
const RedString = ({from, to, delay = 0, color = "#9e2b1e", curve = 0.16, strokeW = 4, sf = 1, pins = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const p = spring({frame: frame - delay, fps, config: {damping: 200}});

  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * len * curve;
  const cy = my + ny * len * curve;
  const d = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;

  return (
    <>
      <svg width={width} height={height} style={{position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5}}>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeW * sf}
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - p}
          style={{filter: `drop-shadow(0 ${2 * sf}px ${2 * sf}px rgba(0,0,0,0.3))`}}
        />
      </svg>
      {pins ? (
        <>
          <PushPin size={26 * sf} color="#b5442d" style={{position: "absolute", left: from.x - 13 * sf, top: from.y - 13 * sf, zIndex: 6}} />
          <PushPin size={26 * sf} color="#b5442d" style={{position: "absolute", left: to.x - 13 * sf, top: to.y - 13 * sf, zIndex: 6}} />
        </>
      ) : null}
    </>
  );
};

export default RedString;
