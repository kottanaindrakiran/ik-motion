import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import * as icons from "lucide-react";
import Shell, {PaperSlide, useSf} from "./Shell";
import {FONT_TYPEWRITER} from "../components/theme";
import PaperBackground from "../components/archive/PaperBackground";
import PinnedCard from "../components/archive/PinnedCard";
import RedString from "../components/archive/RedString";

const getIcon = (name) => {
  const I = icons[name];
  return typeof I === "function" || typeof I === "object" ? I : icons.CircleDot;
};

/** Rows of icon + text, staggered slide-in from the left. */
const IconList = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const sf = useSf();
  const items = scene.key_data?.items ?? [];

  // ---- archive: each item is a pinned card, connected by red string ----
  if (theme.skin === "archive") {
    const n = items.length;
    const pos = items.map((_, i) => {
      const t = n > 1 ? i / (n - 1) : 0.5;
      return {
        x: (i % 2 === 0 ? 0.35 : 0.65) * width,
        y: (0.26 + t * 0.5) * height,
      };
    });
    return (
      <AbsoluteFill style={{overflow: "hidden"}}>
        <PaperBackground theme={theme} />
        <div style={{position: "absolute", inset: 0, zIndex: 2}}>
          {pos.slice(0, -1).map((_, i) => (
            <RedString key={i} from={pos[i]} to={pos[i + 1]} delay={14 + (i + 1) * 12} sf={sf} pins={false} />
          ))}
        </div>
        {items.map((item, i) => {
          const Icon = getIcon(item.icon);
          return (
            <div key={i} style={{position: "absolute", left: pos[i].x, top: pos[i].y, transform: "translate(-50%, -50%)", zIndex: 3}}>
              <PinnedCard theme={theme} seed={`icon-${i}`} delay={i * 10}>
                <div style={{display: "flex", alignItems: "center", gap: 26 * sf, padding: `${26 * sf}px ${36 * sf}px`, width: 430 * sf}}>
                  <Icon size={64 * sf} color={theme.accent} strokeWidth={2.2} style={{flexShrink: 0}} />
                  <div style={{fontFamily: FONT_TYPEWRITER, fontSize: 34 * sf, fontWeight: 400, color: theme.fg, lineHeight: 1.25}}>
                    {item.text}
                  </div>
                </div>
              </PinnedCard>
            </div>
          );
        })}
        <PaperSlide theme={theme} />
      </AbsoluteFill>
    );
  }

  // ---- flat ----
  return (
    <Shell theme={theme}>
      <div style={{display: "flex", flexDirection: "column", gap: 46 * sf, width: "78%"}}>
        {items.map((item, i) => {
          const s = spring({frame: frame - 10 - i * 10, fps, config: {damping: 200}});
          const Icon = getIcon(item.icon);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 40 * sf,
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-90 * sf, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 118 * sf,
                  height: 118 * sf,
                  borderRadius: "50%",
                  backgroundColor: theme.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `${7 * sf}px ${7 * sf}px 0 rgba(0,0,0,0.15)`,
                }}
              >
                <Icon size={62 * sf} color={theme.bg} strokeWidth={2.4} />
              </div>
              <div style={{fontSize: 58 * sf, fontWeight: 800, color: theme.fg, lineHeight: 1.2}}>
                {item.text}
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
};

export default IconList;
