import React, {useMemo} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {FONT_BODY, FONT_TYPEWRITER} from "./theme";

const CHUNK = 4;

// If a scene has no Whisper word timings, spread its words evenly (mock mode).
const wordsFor = (s) => {
  if (s.words && s.words.length) return s.words;
  const parts = String(s.narration_text || "").split(" ").filter(Boolean);
  const per = s.duration / Math.max(1, parts.length);
  return parts.map((w, i) => ({
    w,
    start: s.start + i * per,
    end: s.start + (i + 1) * per,
  }));
};

/** Burned-in word-by-word captions (Vox / Cleo style). */
const Captions = ({scenes, skin = "flat"}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const sf = Math.min(width, height) / 1080;
  const all = useMemo(() => scenes.flatMap(wordsFor), [scenes]);
  const t = frame / fps;

  if (!all.length) return null;
  const idx = all.findIndex((w) => t < w.end);
  if (idx === -1) return null; // narration finished

  const chunkStart = Math.floor(idx / CHUNK) * CHUNK;
  const chunk = all.slice(chunkStart, chunkStart + CHUNK);
  const isArchive = skin === "archive";

  const chipStyle = isArchive
    ? {
        background: "#f2ead6",
        borderRadius: 4 * sf,
        border: `${2 * sf}px solid rgba(120,95,55,0.35)`,
        transform: "rotate(-0.8deg)",
        boxShadow: `0 ${6 * sf}px ${16 * sf}px rgba(40,28,12,0.3)`,
      }
    : {
        background: "rgba(10,10,12,0.82)",
        borderRadius: 18 * sf,
        boxShadow: `0 ${8 * sf}px ${28 * sf}px rgba(0,0,0,0.35)`,
      };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 52 * sf,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          ...chipStyle,
          padding: `${14 * sf}px ${30 * sf}px`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `${6 * sf}px ${14 * sf}px`,
          maxWidth: "85%",
        }}
      >
        {chunk.map((w, i) => {
          const active = t >= w.start && t < w.end;
          const seen = t >= w.start;
          const color = isArchive
            ? active
              ? "#1a1611"
              : seen
                ? "#1a1611"
                : "rgba(26,22,17,0.4)"
            : active
              ? "#ffd400"
              : seen
                ? "#ffffff"
                : "rgba(255,255,255,0.42)";
          const underline = isArchive ? "#b5442d" : "#ffd400";
          return (
            <span
              key={chunkStart + i}
              style={{
                fontFamily: isArchive ? FONT_TYPEWRITER : FONT_BODY,
                fontSize: (isArchive ? 36 : 40) * sf,
                fontWeight: isArchive ? 400 : 800,
                lineHeight: 1.25,
                color,
                borderBottom: `${5 * sf}px solid ${active ? underline : "transparent"}`,
                display: "inline-block",
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default Captions;
