import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import Shell, {useSf} from "./Shell";
import KineticText from "../components/KineticText";
import {FONT_CONDENSED, FONT_DISPLAY} from "../components/theme";
import TornLabel from "../components/archive/TornLabel";

/** Big number counts up (flat) or is stamped in red ink (archive). */
const StatReveal = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sf = useSf();
  const stat = String(scene.key_data?.stat ?? "");
  const label = scene.key_data?.label ?? "";

  if (theme.skin === "archive") {
    const thump = spring({frame, fps, config: {damping: 9, stiffness: 210, mass: 0.6}});
    const scale = interpolate(thump, [0, 1], [1.55, 1], {extrapolateRight: "clamp"});
    const op = interpolate(thump, [0, 0.2, 1], [0, 0.96, 0.86], {extrapolateRight: "clamp"});
    const labelIn = spring({frame: frame - 16, fps, config: {damping: 200}});
    return (
      <Shell theme={theme}>
        <div style={{textAlign: "center"}}>
          <div
            style={{
              fontFamily: FONT_CONDENSED,
              fontWeight: 700,
              fontSize: 300 * sf,
              lineHeight: 1,
              color: theme.accent,
              letterSpacing: `${2 * sf}px`,
              transform: `rotate(-3deg) scale(${scale})`,
              opacity: op,
              mixBlendMode: "multiply",
            }}
          >
            {stat}
          </div>
          {label ? (
            <div style={{marginTop: 46 * sf, display: "flex", justifyContent: "center"}}>
              <TornLabel
                text={label}
                theme={theme}
                seed="stat-label"
                fontSize={44 * sf}
                sf={sf}
                style={{opacity: labelIn, transform: `translateY(${interpolate(labelIn, [0, 1], [24, 0])}px) rotate(1.4deg)`}}
              />
            </div>
          ) : null}
        </div>
      </Shell>
    );
  }

  const m = stat.match(/-?\d+(\.\d+)?/);
  const num = m ? parseFloat(m[0]) : null;
  const prefix = m ? stat.slice(0, m.index) : "";
  const suffix = m ? stat.slice(m.index + m[0].length) : stat;
  const decimals = m && m[0].includes(".") ? m[0].split(".")[1].length : 0;

  const p = spring({frame, fps, config: {damping: 60, stiffness: 80}, durationInFrames: 50});
  const shown = num === null ? stat : `${prefix}${(num * p).toFixed(decimals)}${suffix}`;
  const pop = spring({frame, fps, config: {damping: 200}});

  return (
    <Shell theme={theme}>
      <div style={{textAlign: "center"}}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 290 * sf,
            fontWeight: 900,
            color: theme.accent,
            lineHeight: 1,
            transform: `scale(${0.7 + 0.3 * pop})`,
            textShadow: `${12 * sf}px ${12 * sf}px 0 rgba(0,0,0,0.18)`,
          }}
        >
          {shown}
        </div>
        <div style={{marginTop: 44 * sf, maxWidth: 900 * sf, marginLeft: "auto", marginRight: "auto"}}>
          <KineticText text={label} color={theme.fg} fontSize={54 * sf} fontWeight={700} delay={12} />
        </div>
      </div>
    </Shell>
  );
};

export default StatReveal;
