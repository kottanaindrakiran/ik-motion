import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import Shell, {useSf} from "./Shell";
import KineticText from "../components/KineticText";
import {FONT_BODY, FONT_CONDENSED, FONT_DISPLAY} from "../components/theme";
import Stamp from "../components/archive/Stamp";
import PinnedCard from "../components/archive/PinnedCard";

/** Hand-drawn wobbly rectangle that draws itself on. */
const RoughBox = ({color, delay = 8}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - delay, fps, durationInFrames: 42, config: {damping: 200}});
  const d = "M4,7 L50,3 L96,6 L98,50 L95,95 L50,98 L5,96 L2,49 Z";
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", zIndex: 1}}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - p}
      />
    </svg>
  );
};

const ArchiveTitle = ({title, theme, sf}) => (
  <PinnedCard theme={theme} seed="title" tape={false} pin={false} style={{maxWidth: "82%"}}>
    <div style={{position: "relative", padding: `${88 * sf}px ${96 * sf}px`, textAlign: "center"}}>
      <RoughBox color={theme.accent} />
      <Stamp
        text="EXPLAINER"
        theme={theme}
        delay={8}
        fontSize={30 * sf}
        rotation={-6}
        sf={sf}
        style={{position: "absolute", top: -34 * sf, left: "50%", marginLeft: -110 * sf, zIndex: 5}}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          fontFamily: FONT_CONDENSED,
          fontWeight: 700,
          fontSize: 132 * sf,
          lineHeight: 1.0,
          textTransform: "uppercase",
          color: theme.fg,
          letterSpacing: `${2 * sf}px`,
        }}
      >
        {String(title)}
      </div>
    </div>
  </PinnedCard>
);

const TitleCard = ({scene, theme, topic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sf = useSf();
  const title = scene.key_data?.title || topic || scene.narration_text;

  if (theme.skin === "archive") {
    return (
      <Shell theme={theme}>
        <ArchiveTitle title={String(title).toUpperCase()} theme={theme} sf={sf} />
      </Shell>
    );
  }

  const kicker = spring({frame: frame - 4, fps, config: {damping: 200}});
  const bar = spring({frame: frame - 14, fps, config: {damping: 200}});
  return (
    <Shell theme={theme}>
      <div style={{maxWidth: "88%", textAlign: "center"}}>
        <div
          style={{
            display: "inline-block",
            backgroundColor: theme.accent,
            color: theme.bg,
            fontFamily: FONT_BODY,
            fontSize: 30 * sf,
            fontWeight: 800,
            letterSpacing: `${5 * sf}px`,
            padding: `${10 * sf}px ${28 * sf}px`,
            borderRadius: 8 * sf,
            marginBottom: 40 * sf,
            opacity: kicker,
            transform: `translateY(${interpolate(kicker, [0, 1], [24, 0])}px)`,
          }}
        >
          EXPLAINER
        </div>
        <KineticText
          text={String(title).toUpperCase()}
          color={theme.fg}
          fontFamily={FONT_DISPLAY}
          fontSize={116 * sf}
          fontWeight={900}
          stagger={4}
          lineHeight={1.08}
          delay={8}
        />
        <div
          style={{
            height: 14 * sf,
            width: `${interpolate(bar, [0, 1], [0, 42])}%`,
            backgroundColor: theme.accent,
            margin: `${36 * sf}px auto 0`,
            borderRadius: 7 * sf,
          }}
        />
      </div>
    </Shell>
  );
};

export default TitleCard;
