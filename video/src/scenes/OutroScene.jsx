import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {useSf} from "./Shell";
import {FONT_CONDENSED, FONT_DISPLAY, FONT_TYPEWRITER} from "../components/theme";
import PaperBackground from "../components/archive/PaperBackground";

/** 3-second sign-off: big "IK." springs in, then a thank-you + share line. */
const OutroScene = ({theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sf = useSf();

  const pop = spring({frame, fps, config: {damping: 12, stiffness: 120, mass: 0.9}});
  const sub = spring({frame: frame - 12, fps, config: {damping: 200}});
  const share = spring({frame: frame - 22, fps, config: {damping: 200}});

  if (theme && theme.skin === "archive") {
    const thump = spring({frame, fps, config: {damping: 9, stiffness: 210, mass: 0.6}});
    const scale = interpolate(thump, [0, 1], [1.6, 1], {extrapolateRight: "clamp"});
    const op = interpolate(thump, [0, 0.2, 1], [0, 0.96, 0.88], {extrapolateRight: "clamp"});
    return (
      <AbsoluteFill style={{justifyContent: "center", alignItems: "center", flexDirection: "column"}}>
        <PaperBackground theme={theme} />
        <div
          style={{
            fontFamily: FONT_CONDENSED,
            fontWeight: 700,
            fontSize: 240 * sf,
            lineHeight: 1,
            color: theme.accent,
            letterSpacing: `${3 * sf}px`,
            transform: `rotate(-4deg) scale(${scale})`,
            opacity: op,
            mixBlendMode: "multiply",
            zIndex: 2,
          }}
        >
          IK.
        </div>
        <div
          style={{
            fontFamily: FONT_TYPEWRITER,
            fontSize: 46 * sf,
            fontWeight: 400,
            color: "#1a1611",
            marginTop: 22 * sf,
            letterSpacing: `${1 * sf}px`,
            opacity: sub,
            transform: `translateY(${interpolate(sub, [0, 1], [26, 0])}px)`,
            zIndex: 2,
          }}
        >
          Thanks for watching
        </div>
        <div
          style={{
            fontFamily: FONT_TYPEWRITER,
            fontSize: 30 * sf,
            fontWeight: 400,
            color: theme.accent,
            marginTop: 14 * sf,
            letterSpacing: `${2 * sf}px`,
            opacity: share,
          }}
        >
          LIKE · SHARE · FOLLOW
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0b0f",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 240 * sf,
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 1,
          transform: `scale(${0.6 + 0.4 * Math.min(pop, 1.05)})`,
          opacity: Math.min(1, pop * 1.4),
        }}
      >
        IK<span style={{color: "#ffd400"}}>.</span>
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 58 * sf,
          fontWeight: 900,
          color: "#ffffff",
          marginTop: 28 * sf,
          letterSpacing: `${1 * sf}px`,
          opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [26, 0])}px)`,
        }}
      >
        Thanks for watching
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 34 * sf,
          fontWeight: 900,
          color: "#ffd400",
          marginTop: 18 * sf,
          letterSpacing: `${3 * sf}px`,
          opacity: share,
        }}
      >
        LIKE · SHARE · FOLLOW
      </div>
    </AbsoluteFill>
  );
};

export default OutroScene;
