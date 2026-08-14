import React from "react";
import {useVideoConfig} from "remotion";
import {FONT_CONDENSED, FONT_DISPLAY} from "./theme";

/** Small "IK." watermark chip, fixed to the top-right of every scene. */
const Brand = ({skin = "flat"}) => {
  const {width, height} = useVideoConfig();
  const sf = Math.min(width, height) / 1080;

  if (skin === "archive") {
    return (
      <div
        style={{
          position: "absolute",
          top: 36 * sf,
          right: 44 * sf,
          zIndex: 60,
          pointerEvents: "none",
          border: `${3 * sf}px solid #9e3822`,
          borderRadius: 4 * sf,
          boxShadow: `inset 0 0 0 ${1.5 * sf}px #9e3822`,
          padding: `${4 * sf}px ${13 * sf}px`,
          fontFamily: FONT_CONDENSED,
          fontWeight: 700,
          fontSize: 34 * sf,
          letterSpacing: `${1 * sf}px`,
          color: "#9e3822",
          transform: "rotate(-5deg)",
          opacity: 0.62,
          mixBlendMode: "multiply",
        }}
      >
        IK.
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 34 * sf,
        right: 40 * sf,
        opacity: 0.55,
        zIndex: 60,
        pointerEvents: "none",
        background: "rgba(10,10,12,0.55)",
        borderRadius: 12 * sf,
        padding: `${7 * sf}px ${15 * sf}px`,
        fontFamily: FONT_DISPLAY,
        fontSize: 34 * sf,
        fontWeight: 900,
        color: "#ffffff",
        lineHeight: 1,
        letterSpacing: `${1 * sf}px`,
      }}
    >
      IK<span style={{color: "#ffd400"}}>.</span>
    </div>
  );
};

export default Brand;
