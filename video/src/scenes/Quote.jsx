import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import Shell, {useSf} from "./Shell";
import KineticText from "../components/KineticText";
import {FONT_CONDENSED, FONT_DISPLAY, FONT_TYPEWRITER} from "../components/theme";

const Quote = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sf = useSf();
  const isArchive = theme.skin === "archive";
  const quote = scene.key_data?.quote ?? scene.narration_text;
  const who = scene.key_data?.attribution ?? "";
  const att = spring({frame: frame - 30, fps, config: {damping: 200}});

  return (
    <Shell theme={theme}>
      <div style={{maxWidth: "80%", textAlign: "center"}}>
        <div style={{fontFamily: FONT_DISPLAY, fontSize: 200 * sf, fontWeight: 900, color: theme.accent, lineHeight: 0.6, marginBottom: 20 * sf}}>
          &ldquo;
        </div>
        <div style={{fontStyle: isArchive ? "normal" : "italic"}}>
          <KineticText
            text={quote}
            color={theme.fg}
            fontFamily={isArchive ? FONT_CONDENSED : undefined}
            fontSize={68 * sf}
            fontWeight={700}
            stagger={2}
          />
        </div>
        {who ? (
          <div
            style={{
              marginTop: 40 * sf,
              fontFamily: isArchive ? FONT_TYPEWRITER : undefined,
              fontSize: 42 * sf,
              fontWeight: 700,
              color: theme.accent,
              opacity: att,
              transform: `translateY(${interpolate(att, [0, 1], [30, 0])}px)`,
            }}
          >
            — {who}
          </div>
        ) : null}
      </div>
    </Shell>
  );
};

export default Quote;
