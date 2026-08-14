import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import {FONT_BODY, themeFor} from "./components/theme";
import Captions from "./components/Captions";
import TitleCard from "./scenes/TitleCard";
import StatReveal from "./scenes/StatReveal";
import IconList from "./scenes/IconList";
import Quote from "./scenes/Quote";
import TimelineScene from "./scenes/TimelineScene";
import Comparison from "./scenes/Comparison";
import ChartScene from "./scenes/ChartScene";
import KineticScene from "./scenes/KineticScene";
import MediaScene from "./scenes/MediaScene";
import OutroScene from "./scenes/OutroScene";
import Brand from "./components/Brand";

const SCENE_MAP = {
  title_card: TitleCard,
  stat_reveal: StatReveal,
  icon_list: IconList,
  quote: Quote,
  timeline: TimelineScene,
  comparison: Comparison,
  chart: ChartScene,
  kinetic_text: KineticScene,
  media: MediaScene,
  outro: OutroScene,
};

export const Main = (props) => {
  const {scenes, audio, palette, topic} = props;
  const {fps} = useVideoConfig();

  // The IK badge shows on every scene except the outro (which is itself the logo).
  const last = scenes[scenes.length - 1];
  const brandEnd =
    last && last.type === "outro"
      ? last.start
      : props.totalDuration || (last ? last.start + last.duration : 0);
  const skin = themeFor(palette, 0).skin;

  return (
    <AbsoluteFill style={{backgroundColor: "#101014", fontFamily: FONT_BODY}}>
      {audio && audio.narration ? (
        <Audio src={staticFile(audio.narration)} />
      ) : null}
      {scenes.map((s, i) => {
        const Comp = SCENE_MAP[s.type] || KineticScene;
        return (
          <Sequence
            key={i}
            from={Math.round(s.start * fps)}
            durationInFrames={Math.max(1, Math.round(s.duration * fps))}
          >
            <Comp scene={s} theme={themeFor(palette, i)} topic={topic} />
          </Sequence>
        );
      })}
      <Sequence from={0} durationInFrames={Math.max(1, Math.round(brandEnd * fps))}>
        <Brand skin={skin} />
      </Sequence>
      <Captions scenes={scenes} skin={skin} />
    </AbsoluteFill>
  );
};
