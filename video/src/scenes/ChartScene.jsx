import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import Shell, {useSf} from "./Shell";
import {FONT_CONDENSED, FONT_DISPLAY, FONT_TYPEWRITER} from "../components/theme";

/**
 * Frame-driven animated bar chart (custom, deterministic — no time-based
 * chart-library animations, which break under Remotion's frame rendering).
 */
const ChartScene = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const sf = useSf();
  const isArchive = theme.skin === "archive";
  const bars = scene.key_data?.bars ?? [];
  const title = scene.key_data?.title ?? "";
  const maxV = Math.max(1, ...bars.map((b) => Number(b.value) || 0));
  const areaH = height * 0.45;
  const titleS = spring({frame, fps, config: {damping: 200}});

  return (
    <Shell theme={theme}>
      <div style={{width: "82%", display: "flex", flexDirection: "column", alignItems: "center", gap: 50 * sf}}>
        {title ? (
          <div style={{fontFamily: isArchive ? FONT_CONDENSED : FONT_DISPLAY, fontSize: 56 * sf, fontWeight: isArchive ? 700 : 900, textTransform: isArchive ? "uppercase" : "none", color: theme.fg, opacity: titleS, textAlign: "center"}}>
            {title}
          </div>
        ) : null}
        <div style={{display: "flex", alignItems: "flex-end", gap: 44 * sf, height: areaH}}>
          {bars.map((b, i) => {
            const s = spring({frame: frame - 12 - i * 6, fps, config: {damping: 100, stiffness: 90}});
            const h = Math.max(6 * sf, ((Number(b.value) || 0) / maxV) * areaH * s);
            return (
              <div key={i} style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 14 * sf}}>
                <div style={{fontFamily: isArchive ? FONT_CONDENSED : undefined, fontSize: 40 * sf, fontWeight: isArchive ? 700 : 900, color: theme.accent, opacity: s}}>
                  {b.value}
                </div>
                <div
                  style={{
                    width: 110 * sf,
                    height: h,
                    backgroundColor: theme.accent,
                    borderRadius: isArchive ? 0 : `${10 * sf}px ${10 * sf}px 0 0`,
                    boxShadow: `${6 * sf}px ${6 * sf}px 0 rgba(0,0,0,${isArchive ? 0.25 : 0.15})`,
                  }}
                />
                <div style={{fontFamily: isArchive ? FONT_TYPEWRITER : undefined, fontSize: 34 * sf, fontWeight: isArchive ? 400 : 700, color: theme.fg}}>{b.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};

export default ChartScene;
