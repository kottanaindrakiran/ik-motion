import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import PaperBackground from "../components/archive/PaperBackground";

/** Scale factor so sizes work in both landscape (1920x1080) and portrait (1080x1920). */
export const useSf = () => {
  const {width, height} = useVideoConfig();
  return Math.min(width, height) / 1080;
};

/** Accent color panel that wipes across at scene entry (hard Vox-style cut-in). */
export const Wipe = ({color}) => {
  const frame = useCurrentFrame();
  if (frame > 14) return null;
  const x = interpolate(frame, [0, 13], [0, 110], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        transform: `translateX(${x}%)`,
        zIndex: 30,
      }}
    />
  );
};

/** Archive transition: a torn paper sheet covering the frame slides away left. */
export const PaperSlide = ({theme}) => {
  const frame = useCurrentFrame();
  if (frame > 16) return null;
  const x = interpolate(frame, [0, 15], [0, -118], {
    easing: Easing.in(Easing.cubic),
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${x}%)`,
        zIndex: 30,
        backgroundColor: theme?.card || "#efe6cf",
        clipPath:
          "polygon(0% 0%, 96% 0%, 92% 8%, 98% 16%, 91% 26%, 97% 36%, 90% 46%, 98% 56%, 92% 66%, 97% 76%, 91% 86%, 96% 94%, 94% 100%, 0% 100%)",
        boxShadow: "12px 0 40px rgba(40,28,12,0.4)",
      }}
    />
  );
};

/** Subtle low-opacity geometric decor so flat backgrounds don't feel empty. */
const Decor = ({theme, sf}) => (
  <>
    <div
      style={{
        position: "absolute",
        top: -260 * sf,
        right: -260 * sf,
        width: 720 * sf,
        height: 720 * sf,
        borderRadius: "50%",
        backgroundColor: theme.soft,
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: -140 * sf,
        left: -140 * sf,
        width: 420 * sf,
        height: 420 * sf,
        transform: "rotate(12deg)",
        backgroundColor: theme.soft,
      }}
    />
  </>
);

const Shell = ({theme, children, style}) => {
  const frame = useCurrentFrame();
  const sf = useSf();
  const isArchive = theme.skin === "archive";
  const isStick = theme.skin === "stick";
  // Slow push-in so scenes never feel static (max ~3% over a long scene).
  const drift = Math.min(1.03, 1 + frame * 0.00022);
  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, overflow: "hidden"}}>
      {isArchive ? (
        <PaperBackground theme={theme} />
      ) : isStick ? (
        <PaperBackground theme={theme} variant="stick" />
      ) : (
        <Decor theme={theme} sf={sf} />
      )}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "6%",
          transform: `scale(${drift})`,
          ...style,
        }}
      >
        {children}
      </AbsoluteFill>
      {isArchive ? <PaperSlide theme={theme} /> : <Wipe color={theme.accent} />}
    </AbsoluteFill>
  );
};

export default Shell;
