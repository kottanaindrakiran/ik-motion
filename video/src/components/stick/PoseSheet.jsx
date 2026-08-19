import React from "react";
import {AbsoluteFill} from "remotion";
import StickFigure from "./StickFigure";
import {POSES, POSE_NAMES} from "./poses";

/**
 * DEV-ONLY contact sheet: every named pose in a labelled grid. Not used by the
 * pipeline — it exists so the pose library can be eyeballed in Studio / rendered
 * as a still. Safe to delete once the poses are dialled in.
 */

// A few poses double as face demos so expressions get a look too.
const EXPR = {
  celebrate: "excited",
  think: "thinking",
  facepalm: "sad",
  shrug: "confused",
  fall: "shocked",
  wave: "happy",
  present: "happy",
  push: "angry",
};

const CELL_W = 300;
const CELL_H = 330;
const INK = "#16161a";
const ACCENT = "#e4572e";

const PoseSheet = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#f7f5ef",
      display: "flex",
      flexWrap: "wrap",
      alignContent: "flex-start",
      fontFamily: "'Segoe UI', Arial, sans-serif",
    }}
  >
    {POSE_NAMES.map((name) => (
      <div key={name} style={{width: CELL_W, height: CELL_H, position: "relative"}}>
        <svg width={CELL_W} height={CELL_H - 34} style={{display: "block"}}>
          <line x1={0} y1={CELL_H - 34 - 1} x2={CELL_W} y2={CELL_H - 34 - 1} stroke="rgba(0,0,0,0.08)" />
          <StickFigure
            id={`sheet-${name}`}
            pose={POSES[name]}
            expression={EXPR[name] || "neutral"}
            x={CELL_W / 2}
            y={195}
            scale={1.02}
            stroke={INK}
            strokeWidth={7}
          />
        </svg>
        <div
          style={{
            textAlign: "center",
            fontSize: 20,
            fontWeight: 700,
            color: INK,
            marginTop: 4,
          }}
        >
          <span style={{borderBottom: `3px solid ${ACCENT}`, paddingBottom: 2}}>{name}</span>
        </div>
      </div>
    ))}
  </AbsoluteFill>
);

export default PoseSheet;
