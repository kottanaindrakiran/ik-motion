import React from "react";
import {random, useCurrentFrame} from "remotion";
import {BASE} from "./poses";
import {drawFace} from "./faces";
import {drawProp} from "./props";

/**
 * Pure-SVG articulated stick figure. Renders an SVG <g>, so it must live inside
 * an <svg> supplied by the parent scene. No npm deps, no time/random APIs — the
 * hand-drawn wobble is derived from Remotion's seeded `random()` keyed on the
 * figure id + a slow frame bucket, so identical props render byte-identically.
 *
 * Rig units are "natural" (~230 tall). The parent multiplies `scale` by the
 * canvas scale factor, so the same pose reads correctly in portrait and
 * landscape.
 */

// --- rig proportions (generic stick-figure; not modelled on any creator) ----
const HEAD_R = 26;
const NECK = 16;
const TORSO = 92;
const SHOULDER_W = 26;
const PELVIS_W = 12;
const UPPER_ARM = 46;
const FORE_ARM = 42;
const THIGH = 54;
const SHIN = 52;

const rad = (d) => (d * Math.PI) / 180;

/** Rotate a point about the origin (screen space, +x right / +y down). */
const rotate = (p, deg) => {
  const a = rad(deg);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {x: p.x * c - p.y * s, y: p.x * s + p.y * c};
};

/** Segment endpoint: from `base`, `len` long, at absolute angle (0 = down). */
const seg = (base, absDeg, len) => {
  const a = rad(absDeg);
  return {x: base.x + len * Math.sin(a), y: base.y + len * Math.cos(a)};
};

/** All joint positions for a pose, in rig-local coordinates. */
const solve = (pose) => {
  const p = {...BASE, ...pose};
  const hip = {x: 0, y: 0};
  const lHip = {x: -PELVIS_W, y: 0};
  const rHip = {x: PELVIS_W, y: 0};

  const shoulderMid = rotate({x: 0, y: -TORSO}, p.torso);
  const lSh = rotate({x: -SHOULDER_W, y: -TORSO}, p.torso);
  const rSh = rotate({x: SHOULDER_W, y: -TORSO}, p.torso);
  const neckTop = rotate({x: 0, y: -TORSO - NECK}, p.torso);
  const headC = rotate({x: 0, y: -TORSO - NECK - HEAD_R}, p.torso);

  const lElbow = seg(lSh, p.lArm[0], UPPER_ARM);
  const lHand = seg(lElbow, p.lArm[0] + p.lArm[1], FORE_ARM);
  const rElbow = seg(rSh, p.rArm[0], UPPER_ARM);
  const rHand = seg(rElbow, p.rArm[0] + p.rArm[1], FORE_ARM);

  const lKnee = seg(lHip, p.lLeg[0], THIGH);
  const lFoot = seg(lKnee, p.lLeg[0] + p.lLeg[1], SHIN);
  const rKnee = seg(rHip, p.rLeg[0], THIGH);
  const rFoot = seg(rKnee, p.rLeg[0] + p.rLeg[1], SHIN);

  return {
    hip, lHip, rHip, shoulderMid, lSh, rSh, neckTop, headC,
    headAngle: p.torso + p.headTilt,
    lElbow, lHand, rElbow, rHand, lKnee, lFoot, rKnee, rFoot,
  };
};

const StickFigure = ({
  pose = BASE,
  expression = "neutral",
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
  stroke = "#16161a",
  strokeWidth = 7,
  prop = null,
  id = "fig",
}) => {
  const frame = useCurrentFrame();
  const j = solve(pose);

  // Gentle "boiling line" wobble: refreshes ~6x/sec, deterministic per frame.
  const bucket = Math.floor(frame / 5);
  const AMP = 1.7;
  const wob = (key) => (random(`${id}-${key}-${bucket}`) - 0.5) * 2 * AMP;

  // A bone drawn as a slightly bowed line for a hand-drawn feel.
  const bone = (a, b, key) => {
    const mx = (a.x + b.x) / 2 + wob(`${key}-mx`);
    const my = (a.y + b.y) / 2 + wob(`${key}-my`);
    const ax = a.x + wob(`${key}-ax`);
    const ay = a.y + wob(`${key}-ay`);
    const bx = b.x + wob(`${key}-bx`);
    const by = b.y + wob(`${key}-by`);
    return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
  };

  const stroking = {
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const bones = [
    ["neck", j.shoulderMid, j.neckTop],
    ["spine", j.hip, j.shoulderMid],
    ["shoulders", j.lSh, j.rSh],
    ["pelvis", j.lHip, j.rHip],
    ["lUpArm", j.lSh, j.lElbow],
    ["lForeArm", j.lElbow, j.lHand],
    ["rUpArm", j.rSh, j.rElbow],
    ["rForeArm", j.rElbow, j.rHand],
    ["lThigh", j.lHip, j.lKnee],
    ["lShin", j.lKnee, j.lFoot],
    ["rThigh", j.rHip, j.rKnee],
    ["rShin", j.rKnee, j.rFoot],
  ];

  const headR = HEAD_R + wob("headR") * 0.4;

  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {bones.map(([key, a, b]) => (
        <path key={key} d={bone(a, b, key)} {...stroking} />
      ))}

      {/* Head */}
      <circle cx={j.headC.x} cy={j.headC.y} r={headR} {...stroking} />

      {/* Face, rotated with the head */}
      <g transform={`translate(${j.headC.x} ${j.headC.y}) rotate(${j.headAngle})`}>
        {drawFace(expression, {r: HEAD_R, stroke, strokeWidth, flip})}
      </g>

      {/* Optional held prop, anchored near the leading hand */}
      {prop
        ? drawProp(prop, {
            hand: j.rHand,
            other: j.lHand,
            stroke,
            strokeWidth,
            flip,
          })
        : null}
    </g>
  );
};

export default StickFigure;
