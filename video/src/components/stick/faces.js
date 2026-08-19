import React from "react";

/**
 * Facial expressions for the stick figure, drawn as dot eyes + a mouth path in
 * head-local coordinates (origin = head centre, radius `r`). Returned as a React
 * fragment so StickFigure can drop them inside the head's rotated <g>.
 *
 * Everything uses the same ink colour and line weight as the body so the face
 * reads as one drawing. Pure geometry — deterministic.
 */

export const FACE_NAMES = [
  "neutral", "happy", "shocked", "sad",
  "angry", "confused", "thinking", "excited",
];

export const drawFace = (name, {r = 26, stroke = "#16161a", strokeWidth = 7, flip = false} = {}) => {
  const eyeY = -r * 0.14;
  const eyeX = r * 0.4;
  const dot = Math.max(2.2, strokeWidth * 0.52);
  const line = {
    fill: "none",
    stroke,
    strokeWidth: strokeWidth * 0.82,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const browY = -r * 0.44;

  // Eyes: default is a pair of filled dots; some expressions override them.
  const dots = (
    <>
      <circle cx={-eyeX} cy={eyeY} r={dot} fill={stroke} />
      <circle cx={eyeX} cy={eyeY} r={dot} fill={stroke} />
    </>
  );

  const mouthW = r * 0.5;
  const mouthY = r * 0.42;

  switch (name) {
    case "happy":
      return (
        <>
          {dots}
          <path d={`M ${-mouthW} ${mouthY - 4} Q 0 ${mouthY + 12} ${mouthW} ${mouthY - 4}`} {...line} />
        </>
      );

    case "excited":
      return (
        <>
          <path d={`M ${-eyeX - dot} ${eyeY} A ${dot} ${dot} 0 1 1 ${-eyeX + dot} ${eyeY}`} {...line} />
          <path d={`M ${eyeX - dot} ${eyeY} A ${dot} ${dot} 0 1 1 ${eyeX + dot} ${eyeY}`} {...line} />
          <path
            d={`M ${-mouthW} ${mouthY - 6} Q 0 ${mouthY + 18} ${mouthW} ${mouthY - 6} Z`}
            fill={stroke}
            stroke={stroke}
            strokeWidth={strokeWidth * 0.5}
            strokeLinejoin="round"
          />
        </>
      );

    case "shocked":
      return (
        <>
          <circle cx={-eyeX} cy={eyeY} r={dot * 1.5} {...line} />
          <circle cx={eyeX} cy={eyeY} r={dot * 1.5} {...line} />
          <circle cx={0} cy={mouthY + 2} r={r * 0.2} {...line} />
        </>
      );

    case "sad":
      return (
        <>
          {dots}
          <path d={`M ${-mouthW} ${mouthY + 6} Q 0 ${mouthY - 10} ${mouthW} ${mouthY + 6}`} {...line} />
        </>
      );

    case "angry":
      return (
        <>
          <path d={`M ${-eyeX - dot * 1.4} ${browY} L ${-eyeX + dot * 1.4} ${browY + dot * 1.8}`} {...line} />
          <path d={`M ${eyeX + dot * 1.4} ${browY} L ${eyeX - dot * 1.4} ${browY + dot * 1.8}`} {...line} />
          {dots}
          <path d={`M ${-mouthW} ${mouthY + 4} Q 0 ${mouthY - 8} ${mouthW} ${mouthY + 4}`} {...line} />
        </>
      );

    case "confused":
      return (
        <>
          <path d={`M ${-eyeX - dot * 1.4} ${browY + dot * 1.6} L ${-eyeX + dot * 1.4} ${browY}`} {...line} />
          {dots}
          <path
            d={`M ${-mouthW} ${mouthY} q ${mouthW * 0.5} -10 ${mouthW} 0 q ${mouthW * 0.5} 10 ${mouthW} 0`}
            {...line}
          />
        </>
      );

    case "thinking":
      return (
        <>
          <circle cx={-eyeX} cy={eyeY - 1} r={dot} fill={stroke} />
          <circle cx={eyeX} cy={eyeY - 1} r={dot} fill={stroke} />
          <path d={`M ${-mouthW * 0.6} ${mouthY} L ${mouthW * 0.9} ${mouthY - 4}`} {...line} />
        </>
      );

    case "neutral":
    default:
      return (
        <>
          {dots}
          <path d={`M ${-mouthW * 0.7} ${mouthY} L ${mouthW * 0.7} ${mouthY}`} {...line} />
        </>
      );
  }
};
