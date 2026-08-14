import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {AbsoluteFill} from "remotion";
import {PaperSlide, useSf, Wipe} from "./Shell";
import {FONT_CONDENSED, FONT_DISPLAY, FONT_TYPEWRITER} from "../components/theme";

const Half = ({data, theme, from, bg, sf}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const isArchive = theme.skin === "archive";
  const s = spring({frame: frame - 5, fps, config: {damping: 200}});
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24 * sf,
        transform: `translateX(${interpolate(s, [0, 1], [from, 0])}px)`,
      }}
    >
      <div style={{fontFamily: isArchive ? FONT_CONDENSED : FONT_DISPLAY, fontSize: 145 * sf, fontWeight: isArchive ? 700 : 900, color: theme.accent, lineHeight: 1, textShadow: `${8 * sf}px ${8 * sf}px 0 rgba(0,0,0,0.18)`}}>
        {data?.value}
      </div>
      <div style={{fontFamily: isArchive ? FONT_TYPEWRITER : undefined, fontSize: 46 * sf, fontWeight: isArchive ? 400 : 700, color: theme.fg, textAlign: "center", padding: `0 ${30 * sf}px`}}>
        {data?.label}
      </div>
    </div>
  );
};

/** Split screen: left vs right slide in from opposite sides. */
const Comparison = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sf = useSf();
  const isArchive = theme.skin === "archive";
  const vs = spring({frame: frame - 18, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{flexDirection: "row"}}>
      <Half data={scene.key_data?.left} theme={theme} from={-500 * sf} bg={theme.bg} sf={sf} />
      <Half data={scene.key_data?.right} theme={theme} from={500 * sf} bg={shade(theme.bg)} sf={sf} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${vs})`,
          width: 130 * sf,
          height: 130 * sf,
          borderRadius: "50%",
          backgroundColor: theme.accent,
          color: theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 52 * sf,
          fontWeight: 900,
          fontFamily: isArchive ? FONT_CONDENSED : FONT_DISPLAY,
          boxShadow: `0 ${6 * sf}px ${20 * sf}px rgba(0,0,0,0.3)`,
        }}
      >
        VS
      </div>
      {isArchive ? <PaperSlide theme={theme} /> : <Wipe color={theme.accent} />}
    </AbsoluteFill>
  );
};

/** Slightly darken a hex color so the two halves are distinguishable. */
const shade = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * 0.75));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

export default Comparison;
