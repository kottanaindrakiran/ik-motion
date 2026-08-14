import React from "react";
import Shell, {useSf} from "./Shell";
import KineticText from "../components/KineticText";
import {FONT_CONDENSED, FONT_DISPLAY} from "../components/theme";

/** Fallback / pure kinetic-typography scene: the narration IS the visual. */
const KineticScene = ({scene, theme}) => {
  const sf = useSf();
  const isArchive = theme.skin === "archive";
  return (
    <Shell theme={theme}>
      <div style={{maxWidth: "84%"}}>
        <KineticText
          text={scene.narration_text}
          color={theme.fg}
          accentColor={theme.accent}
          accentEvery={5}
          fontFamily={isArchive ? FONT_CONDENSED : FONT_DISPLAY}
          fontSize={72 * sf}
          fontWeight={isArchive ? 700 : 900}
          stagger={2}
          lineHeight={1.25}
        />
      </div>
    </Shell>
  );
};

export default KineticScene;
