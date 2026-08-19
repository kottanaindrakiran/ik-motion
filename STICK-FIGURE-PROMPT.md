# Claude Code prompt — add a stick-figure animation system to IK Motion

> Open Claude Code in `D:\MY APPS\playstore ads\ik-motion` and paste everything
> below the line.

---

Read the repo first before writing any code. Key files you must understand:

- `video/src/Video.jsx` — `SCENE_MAP` maps `scene.type` strings to React components.
- `video/src/Root.jsx` — the single `Main` composition; size/duration come from props.
- `video/src/components/theme.js` — `PALETTES`, `themeFor(palette, index)`, font exports,
  and the `skin` concept (`"flat"` vs `"archive"`).
- `video/src/scenes/*.jsx` — existing scenes (TitleCard, StatReveal, IconList, Quote,
  TimelineScene, Comparison, ChartScene, KineticScene, MediaScene, OutroScene).
- `pipeline/script_gen.py` — the Groq prompt that decides which scene types get emitted.
- `pipeline/generate.py` — orchestration; `--mock` renders bundled sample scenes.
- `automation/plan_day.py` / `automation/run_batch.py` — the daily 4-shorts + 4-longs batch.

## Goal

Add a **stick-figure animation system** as a new visual language, alongside the
existing motion-graphics scenes. Think hand-drawn whiteboard-doodle explainer:
black line figures on a light paper background, one accent colour, simple props.
The figures should *act out* the narration, not just decorate it.

This is an addition, not a replacement. Every existing scene type must keep working
exactly as it does today.

## What to build

### 1. `video/src/components/stick/StickFigure.jsx`

A pure-SVG, pure-React articulated stick figure. No new npm dependencies.

Rig: head (circle), neck, torso, and four limbs — each limb is
shoulder/hip → elbow/knee → hand/foot. A pose is a plain object of joint angles in
degrees plus a torso lean, e.g.

```js
{ torso: 0, headTilt: -4, lArm: [-30, 20], rArm: [140, -25], lLeg: [8, 6], rLeg: [-8, -4] }
```

Props the component accepts: `pose`, `expression`, `x`, `y`, `scale`, `flip`,
`stroke`, `strokeWidth`, `prop` (an optional held object).

### 2. `video/src/components/stick/poses.js`

A named pose library. At minimum:

`idle, point_up, point_side, walk_a, walk_b, run_a, run_b, jump, land, sit, think,
shrug, celebrate, facepalm, lift, push, carry, fall, wave, type, look_up, present`

Export a `lerpPose(a, b, t)` that interpolates every joint angle so the engine can
tween between any two poses.

### 3. `video/src/components/stick/faces.js`

Expressions drawn as dot eyes + a mouth path: `neutral, happy, shocked, sad, angry,
confused, thinking, excited`.

### 4. `video/src/components/stick/props.js`

Simple single-path SVG glyphs the figure can hold or stand next to. Start with:
`box, phone, book, rocket, planet, brain, arrow_up, arrow_down, money, clock, bulb,
globe, chip, question, chart`.

Each glyph must be drawn in the same line weight as the figure so it reads as one style.

### 5. `video/src/scenes/StickScene.jsx`

The scene component, registered as `stick` in `SCENE_MAP`.

Scene data shape (this is the contract `script_gen.py` will emit):

```json
{
  "type": "stick",
  "start": 12.4,
  "duration": 6.0,
  "headline": "Your brain burns 20% of your energy",
  "figures": [
    {
      "id": "a",
      "scale": 1.0,
      "flip": false,
      "expression": "shocked",
      "prop": "brain",
      "keyframes": [
        {"at": 0.0,  "pose": "idle",      "x": 0.30, "y": 0.62},
        {"at": 0.45, "pose": "point_up",  "x": 0.30, "y": 0.62},
        {"at": 1.0,  "pose": "celebrate", "x": 0.42, "y": 0.62}
      ]
    }
  ]
}
```

- `at` is normalised scene progress 0→1. `x`/`y` are normalised to the canvas, so the
  same scene works in both 1080×1920 portrait and 1920×1080 landscape.
- Between keyframes, interpolate pose *and* position. Use Remotion `interpolate` with
  an ease, and `spring` for pops/landings.
- Render `headline` using `FONT_DISPLAY` from `theme.js`, positioned so it never
  overlaps the figures in either aspect ratio.

### 6. A `stick` skin

Add a `stick` palette to `PALETTES` in `theme.js` with `skin: "stick"` — light paper
background (`#f7f5ef`-ish), near-black ink (`#16161a`), one accent per channel. Reuse
the existing `themeFor()` contract; do not change its signature.

Also add a subtle paper-grain background for this skin. There is already an archived
`video/src/components/archive/PaperBackground.jsx` — reuse or adapt it rather than
writing a new one.

### 7. Wire it into the pipeline

- Register `stick: StickScene` in `SCENE_MAP` in `video/src/Video.jsx`.
- Update the scene-type instructions in `pipeline/script_gen.py` so Groq can emit
  `stick` scenes, including the exact JSON shape above and the list of valid pose,
  expression and prop names. Tell the model to pick poses that *illustrate* the
  sentence being narrated.
- Add at least three `stick` scenes to `video/src/sample-props.json` and to
  `pipeline/sample_scenes.json` so `--mock` exercises the new code path.

## Hard constraints

1. **Deterministic renders.** No `Math.random()`, no `Date.now()`, no `new Date()`
   anywhere in the video code — Remotion renders frames out of order and in parallel,
   so these cause flicker. If you need jitter (hand-drawn wobble), derive it from a
   seeded PRNG keyed on figure id + frame index.
2. **Must render headless in GitHub Actions.** No browser-only APIs, no canvas
   measurement, no external font or image fetches beyond what `@remotion/google-fonts`
   already does.
3. **No new npm or pip dependencies.** SVG + React only.
4. **Both aspect ratios.** Every stick scene must look right at 1080×1920 and
   1920×1080. Test both.
5. **Original character design.** Do not copy any specific existing YouTube creator's
   character. Generic stick-figure proportions only — that style is not ownable, a
   particular creator's face and proportions are.
6. Keep the existing `flat` and `archive` skins untouched and still rendering.

## Verify before you say you're done

Run these and report the actual output:

```bat
cd video && npx remotion studio
:: visually confirm the stick scenes animate and read clearly

cd .. && python pipeline\generate.py --mock
:: must produce output\video.mp4 with no errors

python pipeline\generate.py "Why your brain burns 20% of your energy" --minutes 1 --format portrait
python pipeline\generate.py "Why your brain burns 20% of your energy" --minutes 1 --format landscape
```

Confirm explicitly:
- [ ] All 10 pre-existing scene types still render
- [ ] `stick` scenes render in portrait AND landscape without text/figure overlap
- [ ] Rendering the same props twice produces byte-identical frames (determinism)
- [ ] No new entries in `package.json` or `pipeline/requirements.txt`

## Work in this order

1. `StickFigure.jsx` + `poses.js` — get one figure posing correctly in Remotion Studio.
2. `faces.js` + `props.js`.
3. `StickScene.jsx` with keyframe tweening.
4. `stick` skin in `theme.js`.
5. Register in `SCENE_MAP`, update sample props, verify `--mock`.
6. Only then touch `script_gen.py`.

Do not move to the next step until the current one renders correctly in Studio.
Show me the pose library rendering as a contact sheet before building the scene layer.
