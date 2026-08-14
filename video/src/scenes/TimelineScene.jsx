import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import Shell, {useSf} from "./Shell";
import {FONT_CONDENSED, FONT_DISPLAY, FONT_TYPEWRITER} from "../components/theme";

/** Horizontal line draws in, event dots pop one by one. */
const TimelineScene = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sf = useSf();
  const isArchive = theme.skin === "archive";
  const events = scene.key_data?.events ?? [];
  const line = spring({frame: frame - 5, fps, config: {damping: 200}});

  return (
    <Shell theme={theme}>
      <div style={{width: "84%", position: "relative"}}>
        <div
          style={{
            position: "absolute",
            top: 8 * sf,
            left: 0,
            right: 0,
            height: 10 * sf,
            backgroundColor: theme.accent,
            borderRadius: 5 * sf,
            transform: `scaleX(${line})`,
            transformOrigin: "left center",
          }}
        />
        <div style={{display: "flex", justifyContent: "space-between", position: "relative"}}>
          {events.map((e, i) => {
            const s = spring({frame: frame - 14 - i * 11, fps, config: {damping: 200}});
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: `${100 / Math.max(1, events.length)}%`,
                  opacity: s,
                  transform: `scale(${s})`,
                }}
              >
                <div
                  style={{
                    width: 26 * sf,
                    height: 26 * sf,
                    borderRadius: "50%",
                    backgroundColor: theme.fg,
                    border: `${6 * sf}px solid ${theme.accent}`,
                  }}
                />
                <div style={{fontFamily: isArchive ? FONT_CONDENSED : FONT_DISPLAY, fontSize: 50 * sf, fontWeight: isArchive ? 700 : 900, color: theme.accent, marginTop: 26 * sf}}>
                  {e.year}
                </div>
                <div
                  style={{
                    fontFamily: isArchive ? FONT_TYPEWRITER : undefined,
                    fontSize: 32 * sf,
                    fontWeight: isArchive ? 400 : 700,
                    color: theme.fg,
                    textAlign: "center",
                    marginTop: 10 * sf,
                    lineHeight: 1.25,
                    padding: `0 ${8 * sf}px`,
                  }}
                >
                  {e.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};

export default TimelineScene;
