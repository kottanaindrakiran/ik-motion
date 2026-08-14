import React from "react";
import {Composition} from "remotion";
import {Main} from "./Video";
import sample from "./sample-props.json";

export const Root = () => (
  <Composition
    id="Main"
    component={Main}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={sample}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.max(1, Math.ceil(props.totalDuration * props.fps)),
      fps: props.fps,
      width: props.format.width,
      height: props.format.height,
    })}
  />
);
