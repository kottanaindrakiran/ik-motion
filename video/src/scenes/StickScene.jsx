import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import StickFigure from "../components/stick/StickFigure";
import {lerpPose} from "../components/stick/poses";
import PaperBackground from "../components/archive/PaperBackground";
import {Wipe} from "./Shell";
import {FONT_DISPLAY} from "../components/theme";

/**
 * Whiteboard-doodle scene: line figures acting out the narration. Registered as
 * "stick" in SCENE_MAP.
 *
 * Reads its contract from scene.key_data:
 *   { headline, figures: [ {id, scale, flip, expression, prop, keyframes:[
 *       {at, pose, x, y} ... ] } ] }
 * `at` is normalised scene progress 0..1; x/y are normalised to the canvas so
 * the same scene works in portrait (1080x1920) and landscape (1920x1080).
 *
 * The ink is derived from the theme foreground, so figures are LIGHT lines on
 * dark palettes (midnight/neon) and DARK lines on light ones — the scene sits on
 * the video's own background instead of hard-cutting to white. Only the "stick"
 * skin adds the light paper grain. Deterministic: no time/random APIs.
 */

const RIG_FEET = 100; // approx hip->foot distance in rig units, for the shadow

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Relative luminance (0=black, 1=white) of a #rgb / #rrggbb color. Used to
 * decide the stroke bump from the palette itself, so any current OR future
 * dark palette (midnight, neon, ...) gets thicker ink automatically — no
 * per-skin flag to keep in sync.
 */
const luminance = (hex) => {
  if (typeof hex !== "string") return 1;
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return 1;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Resolve a figure's pose + normalised position at scene progress t. Always
 * returns a POSE OBJECT (never a raw string), and degrades safely: no
 * keyframes -> idle; one keyframe -> that pose held; missing x/y -> centred.
 */
const resolveFigure = (kfs, t) => {
  const frames = [...(kfs || [])]
    .filter((k) => k && typeof k === "object")
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));

  if (frames.length === 0) {
    return {pose: lerpPose("idle", "idle", 0), x: 0.5, y: 0.64};
  }
  // Resolve a single keyframe to a real pose object (handles held endpoints).
  const at = (k) => ({
    pose: lerpPose(k.pose ?? "idle", k.pose ?? "idle", 0),
    x: k.x ?? 0.5,
    y: k.y ?? 0.64,
  });

  if (t <= (frames[0].at ?? 0)) return at(frames[0]);
  const lastKf = frames[frames.length - 1];
  if (t >= (lastKf.at ?? 1)) return at(lastKf);

  let k0 = frames[0];
  let k1 = lastKf;
  for (let i = 0; i < frames.length - 1; i++) {
    if (t >= (frames[i].at ?? 0) && t <= (frames[i + 1].at ?? 1)) {
      k0 = frames[i];
      k1 = frames[i + 1];
      break;
    }
  }
  const span = (k1.at ?? 1) - (k0.at ?? 0) || 1;
  const u = Easing.inOut(Easing.cubic)(clamp01((t - (k0.at ?? 0)) / span));
  return {
    pose: lerpPose(k0.pose ?? "idle", k1.pose ?? "idle", u),
    x: lerp(k0.x ?? 0.5, k1.x ?? 0.5, u),
    y: lerp(k0.y ?? 0.64, k1.y ?? 0.64, u),
  };
};

const StickScene = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames, fps} = useVideoConfig();

  const data = scene.key_data || {};
  const figures = Array.isArray(data.figures) ? data.figures : [];
  const headline = data.headline || "";

  const isStickSkin = theme.skin === "stick";
  const bg = theme.bg || "#f7f5ef";
  const ink = theme.fg || "#16161a"; // light on dark palettes, dark on light
  const accent = theme.accent || "#e4572e";

  // Vertical factor keeps the figure at a consistent FRACTION of frame height
  // in both aspect ratios (min dim is 1080 for both, so scale by height).
  const vf = height / 1080;
  // Light ink on a dark background reads optically thinner than dark ink on
  // paper. Bump the stroke ~20% whenever the palette background is dark, so
  // figures + props stay legible at Shorts size on a phone. Derived from bg
  // luminance, not a hardcoded skin, so future dark palettes inherit it.
  const darkBg = luminance(bg) < 0.5;
  const strokeW = 6.5 * vf * (darkBg ? 1.2 : 1);
  const t = durationInFrames > 1 ? clamp01(frame / (durationInFrames - 1)) : 0;

  // Headline enters with a gentle spring; sits in a top band clear of figures.
  const hIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 18});
  const headlineSize = height * 0.052;

  return (
    <AbsoluteFill style={{backgroundColor: bg, overflow: "hidden"}}>
      {/* Paper grain ONLY for the dedicated stick skin; other palettes keep
          their own background so a stick scene doesn't cut to white mid-video. */}
      {isStickSkin ? (
        <PaperBackground theme={{bg, card: bg}} variant="stick" />
      ) : null}

      {/* Figures */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: "absolute", inset: 0}}
      >
        {figures.map((fig, i) => {
          const st = resolveFigure(fig.keyframes, t);
          const px = (st.x ?? 0.5) * width;
          const py = (st.y ?? 0.64) * height;
          const pop = spring({
            frame: frame - i * 3,
            fps,
            config: {damping: 14, stiffness: 120, mass: 0.7},
            durationInFrames: 20,
          });
          const figScale = (fig.scale ?? 1) * vf * 1.8 * (0.9 + 0.1 * pop);
          const footY = py + RIG_FEET * figScale;
          const shadowRx = 56 * figScale;
          return (
            <g key={fig.id ?? i}>
              <ellipse cx={px} cy={footY} rx={shadowRx} ry={shadowRx * 0.22} fill={ink} opacity={0.1} />
              <StickFigure
                id={fig.id ?? `fig${i}`}
                pose={st.pose}
                expression={fig.expression || "neutral"}
                prop={fig.prop || null}
                x={px}
                y={py}
                scale={figScale}
                flip={!!fig.flip}
                stroke={ink}
                strokeWidth={strokeW / figScale}
              />
            </g>
          );
        })}
      </svg>

      {/* Headline — top band, never over the figures */}
      {headline ? (
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "6%",
            width: "88%",
            textAlign: "center",
            fontFamily: FONT_DISPLAY,
            fontWeight: 900,
            fontSize: headlineSize,
            lineHeight: 1.04,
            color: ink,
            opacity: hIn,
            transform: `translateY(${interpolate(hIn, [0, 1], [-24, 0])}px)`,
            textWrap: "balance",
          }}
        >
          {headline}
          <div
            style={{
              height: Math.max(4, height * 0.006),
              width: "18%",
              margin: `${height * 0.018}px auto 0`,
              backgroundColor: accent,
              borderRadius: 999,
              transform: `scaleX(${hIn})`,
            }}
          />
        </div>
      ) : null}

      <Wipe color={accent} />
    </AbsoluteFill>
  );
};

export default StickScene;
