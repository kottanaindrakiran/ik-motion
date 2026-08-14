import React, {useId} from "react";

/** Small brass pushpin: radial-gradient dome + highlight + soft drop shadow. */
const PushPin = ({size = 34, color = "#c9a13b", style}) => {
  const uid = useId().replace(/[:]/g, "");
  const gid = `pin-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{filter: "drop-shadow(2px 3px 2.5px rgba(0,0,0,0.4))", ...style}}
    >
      <defs>
        <radialGradient id={gid} cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fff2c8" />
          <stop offset="42%" stopColor={color} />
          <stop offset="100%" stopColor="#5c3d0a" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="14" fill={`url(#${gid})`} />
      <circle cx="14.5" cy="13.5" r="3.6" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
};

export default PushPin;
