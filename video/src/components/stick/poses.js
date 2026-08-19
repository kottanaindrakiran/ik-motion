/**
 * Named pose library for the stick-figure rig.
 *
 * A pose is a plain object of joint angles in DEGREES plus a torso lean:
 *   { torso, headTilt, lArm:[shoulder, elbow], rArm:[...], lLeg:[hip, knee], rLeg:[...] }
 *
 * Angle convention (kept consistent across the whole library so lerpPose and
 * StickFigure agree):
 *   - 0deg  = segment points straight DOWN.
 *   - +deg swings the segment toward screen-right, -deg toward screen-left
 *     (before any `flip`). 180 = straight up.
 *   - The first number of a limb is the ABSOLUTE angle of the upper segment
 *     (upper arm / thigh). The second is the elbow/knee bend RELATIVE to it.
 *   - torso leans the shoulders/neck/head around the hips; headTilt rotates the
 *     head on top of that.
 *
 * These are authored by eye against the contact sheet — tweak freely.
 */

/** Neutral default; every pose is merged onto this so partial poses are legal. */
export const BASE = {
  torso: 0,
  headTilt: 0,
  lArm: [-10, -8],
  rArm: [10, 8],
  lLeg: [-7, 4],
  rLeg: [7, -4],
};

const P = (o) => ({...BASE, ...o});

export const POSES = {
  idle: P({}),

  point_up: P({
    rArm: [172, 4],
    lArm: [-12, -10],
    headTilt: -3,
  }),

  point_side: P({
    rArm: [90, -2],
    lArm: [-12, -8],
  }),

  walk_a: P({
    torso: 3,
    lLeg: [26, -12],
    rLeg: [-22, -10],
    lArm: [20, -22],
    rArm: [-20, -22],
  }),
  walk_b: P({
    torso: 3,
    lLeg: [-22, -10],
    rLeg: [26, -12],
    lArm: [-20, -22],
    rArm: [20, -22],
  }),

  run_a: P({
    torso: 14,
    headTilt: 4,
    lLeg: [40, -26],
    rLeg: [-34, -46],
    lArm: [46, -70],
    rArm: [-40, -60],
  }),
  run_b: P({
    torso: 14,
    headTilt: 4,
    lLeg: [-34, -46],
    rLeg: [40, -26],
    lArm: [-40, -60],
    rArm: [46, -70],
  }),

  jump: P({
    torso: -4,
    headTilt: -6,
    lArm: [186, 8],
    rArm: [174, -8],
    lLeg: [16, 46],
    rLeg: [-16, 46],
  }),
  land: P({
    torso: 10,
    headTilt: 4,
    lArm: [70, -22],
    rArm: [-70, -22],
    lLeg: [-26, 40],
    rLeg: [26, -40],
  }),

  sit: P({
    torso: 6,
    lLeg: [56, -74],
    rLeg: [-56, 74],
    lArm: [34, -8],
    rArm: [-34, -8],
  }),

  think: P({
    headTilt: 8,
    rArm: [150, -96],
    lArm: [-24, -70],
  }),

  shrug: P({
    headTilt: 2,
    lArm: [-52, -74],
    rArm: [52, 74],
  }),

  celebrate: P({
    torso: -2,
    headTilt: -4,
    lArm: [206, 12],
    rArm: [154, -12],
    lLeg: [-12, 6],
    rLeg: [12, -6],
  }),

  facepalm: P({
    headTilt: -8,
    rArm: [162, -118],
    lArm: [-16, -12],
  }),

  lift: P({
    torso: 10,
    headTilt: 4,
    lArm: [42, -30],
    rArm: [-42, -30],
    lLeg: [22, 40],
    rLeg: [-22, 40],
  }),

  push: P({
    torso: 24,
    headTilt: 6,
    lArm: [70, -8],
    rArm: [-70, -8],
    lLeg: [-30, -8],
    rLeg: [40, -30],
  }),

  carry: P({
    torso: -4,
    lArm: [58, -84],
    rArm: [-58, -84],
    lLeg: [-8, 6],
    rLeg: [8, -6],
  }),

  fall: P({
    torso: -34,
    headTilt: -14,
    lArm: [150, 20],
    rArm: [-150, -20],
    lLeg: [50, -20],
    rLeg: [-40, -30],
  }),

  wave: P({
    headTilt: -4,
    rArm: [156, 44],
    lArm: [-12, -8],
  }),

  type: P({
    torso: 8,
    headTilt: 6,
    lArm: [40, -66],
    rArm: [-40, -66],
    lLeg: [-7, 4],
    rLeg: [7, -4],
  }),

  look_up: P({
    torso: -8,
    headTilt: -20,
    lArm: [-16, -10],
    rArm: [16, 10],
  }),

  present: P({
    headTilt: 2,
    rArm: [96, -12],
    lArm: [-14, -8],
  }),
};

const lerp = (a, b, t) => a + (b - a) * t;
const lerpPair = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/**
 * Interpolate every joint of two poses. `a` and `b` may be pose names or pose
 * objects; missing joints fall back to BASE so any pair is safe to tween.
 */
export const lerpPose = (a, b, t) => {
  const pa = typeof a === "string" ? POSES[a] || BASE : {...BASE, ...a};
  const pb = typeof b === "string" ? POSES[b] || BASE : {...BASE, ...b};
  return {
    torso: lerp(pa.torso, pb.torso, t),
    headTilt: lerp(pa.headTilt, pb.headTilt, t),
    lArm: lerpPair(pa.lArm, pb.lArm, t),
    rArm: lerpPair(pa.rArm, pb.rArm, t),
    lLeg: lerpPair(pa.lLeg, pb.lLeg, t),
    rLeg: lerpPair(pa.rLeg, pb.rLeg, t),
  };
};

/** Sorted list of pose names — handy for contact sheets / validation. */
export const POSE_NAMES = Object.keys(POSES);
