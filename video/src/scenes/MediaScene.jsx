import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {PaperSlide, Wipe, useSf} from "./Shell";
import {FONT_BODY} from "../components/theme";
import PaperBackground from "../components/archive/PaperBackground";
import PinnedCard from "../components/archive/PinnedCard";
import TornLabel from "../components/archive/TornLabel";

const ARCHIVE_FILTER = "grayscale(1) contrast(1.15) sepia(0.15)";

/**
 * Real photo or video clip for a media scene.
 * - flat skins: full-bleed with Ken Burns + dark gradient + accent-bar caption.
 * - archive skin: pinned B&W photo on the board, Ken Burns inside the frame,
 *   a torn-label caption, and a second photo peeking for collage depth.
 */
const MediaScene = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sf = useSf();

  const file = scene.key_data?.file;
  const kind = scene.key_data?.kind || "photo";
  const caption = scene.key_data?.caption || "";
  const durFrames = Math.max(1, Math.round((scene.duration || 5) * fps));
  const isArchive = theme.skin === "archive";
  const src = file ? staticFile(`media/${file}`) : null;

  const dir = (file ? file.charCodeAt(file.length - 5) : 0) % 2 === 0 ? 1 : -1;
  const scale = interpolate(frame, [0, durFrames], [1.08, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panX = interpolate(frame, [0, durFrames], [0, 3.5 * dir], {extrapolateRight: "clamp"});
  const panY = interpolate(frame, [0, durFrames], [0, -3], {extrapolateRight: "clamp"});
  const capIn = spring({frame: frame - 12, fps, config: {damping: 200}});

  const renderMedia = (filter) => {
    if (!file) return null;
    const style = {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: `scale(${scale}) translate(${panX}%, ${panY}%)`,
      filter,
    };
    return kind === "video" ? (
      <OffthreadVideo src={src} muted loop style={style} />
    ) : (
      <Img src={src} style={style} />
    );
  };

  // ---- archive: pinned board photo ----
  if (isArchive) {
    return (
      <AbsoluteFill style={{overflow: "hidden"}}>
        <PaperBackground theme={theme} />

        {file && kind === "photo" ? (
          <div style={{position: "absolute", left: "30%", top: "33%", transform: "translate(-50%, -50%)", zIndex: 1}}>
            <PinnedCard theme={theme} seed="media-b" delay={2} tape={false}>
              <div style={{width: 500 * sf, height: 350 * sf, overflow: "hidden", position: "relative"}}>
                <Img
                  src={src}
                  style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: ARCHIVE_FILTER}}
                />
              </div>
            </PinnedCard>
          </div>
        ) : null}

        <div style={{position: "absolute", left: "53%", top: "46%", transform: "translate(-50%, -50%)", zIndex: 2}}>
          <PinnedCard theme={theme} seed="media-a" delay={6}>
            <div style={{width: 980 * sf, height: 620 * sf, overflow: "hidden", position: "relative"}}>
              {renderMedia(ARCHIVE_FILTER)}
            </div>
          </PinnedCard>
        </div>

        {caption ? (
          <div style={{position: "absolute", left: 0, right: 0, bottom: "16%", display: "flex", justifyContent: "center", zIndex: 8}}>
            <TornLabel
              text={caption}
              theme={theme}
              seed="media-cap"
              fontSize={40 * sf}
              sf={sf}
              style={{opacity: capIn, transform: `translateY(${interpolate(capIn, [0, 1], [30, 0])}px) rotate(-1.5deg)`}}
            />
          </div>
        ) : null}

        <PaperSlide theme={theme} />
      </AbsoluteFill>
    );
  }

  // ---- flat: full-bleed ----
  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, overflow: "hidden"}}>
      {renderMedia()}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 22%, rgba(0,0,0,0) 48%)",
        }}
      />

      {caption ? (
        <div
          style={{
            position: "absolute",
            left: "7%",
            right: "7%",
            bottom: "19%",
            display: "flex",
            alignItems: "center",
            gap: 22 * sf,
            opacity: capIn,
            transform: `translateY(${interpolate(capIn, [0, 1], [40, 0])}px)`,
          }}
        >
          <div style={{width: 10 * sf, alignSelf: "stretch", minHeight: 54 * sf, backgroundColor: theme.accent, borderRadius: 6 * sf}} />
          <div
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 800,
              fontSize: 52 * sf,
              lineHeight: 1.12,
              color: "#ffffff",
              textShadow: `0 ${4 * sf}px ${18 * sf}px rgba(0,0,0,0.6)`,
            }}
          >
            {caption}
          </div>
        </div>
      ) : null}

      <Wipe color={theme.accent} />
    </AbsoluteFill>
  );
};

export default MediaScene;
