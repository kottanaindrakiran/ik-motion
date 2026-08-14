import {loadFont as loadArchivoBlack} from "@remotion/google-fonts/ArchivoBlack";
import {loadFont as loadInter} from "@remotion/google-fonts/Inter";
import {loadFont as loadSpecialElite} from "@remotion/google-fonts/SpecialElite";
import {loadFont as loadOswald} from "@remotion/google-fonts/Oswald";

const archivo = loadArchivoBlack();
// Load only the weights we use — avoids ~126 font network requests per render.
const inter = loadInter("normal", {weights: ["400", "700", "800"]});
const specialElite = loadSpecialElite();
const oswald = loadOswald("normal", {weights: ["500", "600", "700"]});

/** Display font: headlines, big numbers, titles. */
export const FONT_DISPLAY = `'${archivo.fontFamily}', Impact, 'Arial Black', sans-serif`;
/** Body font: labels, captions, supporting text. */
export const FONT_BODY = `'${inter.fontFamily}', 'Segoe UI', -apple-system, Arial, sans-serif`;
/** Typewriter font: archive-skin captions, labels, stamps. */
export const FONT_TYPEWRITER = `'${specialElite.fontFamily}', 'Courier New', monospace`;
/** Condensed font: archive-skin headlines and big numbers. */
export const FONT_CONDENSED = `'${oswald.fontFamily}', 'Arial Narrow', 'Oswald', sans-serif`;
/** Back-compat alias. */
export const FONT = FONT_BODY;

/**
 * Each theme is a semantic token set:
 * bg / fg (4.5:1+ contrast on bg) / accent (highlight) / soft (decor, low-opacity shapes).
 * skin selects the render style: "flat" (default clean motion-graphics) or
 * "archive" (vintage paper / corkboard). card = card surface color (archive).
 */
const PALETTES = {
  vox: [
    {bg: "#101014", fg: "#ffffff", accent: "#ffd400", soft: "rgba(255,212,0,0.07)"},
    {bg: "#ffd400", fg: "#131313", accent: "#131313", soft: "rgba(0,0,0,0.06)"},
    {bg: "#e4572e", fg: "#ffffff", accent: "#ffe14d", soft: "rgba(255,255,255,0.08)"},
    {bg: "#173753", fg: "#ffffff", accent: "#ffd400", soft: "rgba(255,212,0,0.07)"},
    {bg: "#f4f1ea", fg: "#131313", accent: "#e4572e", soft: "rgba(228,87,46,0.08)"},
  ],
  // Deep navy/black backgrounds, electric-blue accent, white text.
  midnight: [
    {bg: "#080b16", fg: "#ffffff", accent: "#4cc9f0", soft: "rgba(76,201,240,0.09)"},
    {bg: "#0e1b2e", fg: "#ffffff", accent: "#4cc9f0", soft: "rgba(76,201,240,0.10)"},
    {bg: "#050810", fg: "#eaf6ff", accent: "#5eead4", soft: "rgba(94,234,212,0.08)"},
    {bg: "#122036", fg: "#ffffff", accent: "#4cc9f0", soft: "rgba(255,255,255,0.06)"},
  ],
  // Warm off-white backgrounds, black text, red-orange accent (NYT feel).
  paper: [
    {bg: "#f6f2e9", fg: "#141414", accent: "#e63946", soft: "rgba(230,57,70,0.08)"},
    {bg: "#efe7d6", fg: "#141414", accent: "#e63946", soft: "rgba(20,20,20,0.06)"},
    {bg: "#faf7f0", fg: "#1a1a1a", accent: "#c1121f", soft: "rgba(193,18,31,0.07)"},
    {bg: "#ece3d0", fg: "#141414", accent: "#e63946", soft: "rgba(230,57,70,0.10)"},
  ],
  // Very dark purple-black backgrounds, hot-pink + cyan accents.
  neon: [
    {bg: "#0d0416", fg: "#ffffff", accent: "#f72585", soft: "rgba(247,37,133,0.10)"},
    {bg: "#120a22", fg: "#ffffff", accent: "#4cc9f0", soft: "rgba(76,201,240,0.10)"},
    {bg: "#08040f", fg: "#f7e9ff", accent: "#f72585", soft: "rgba(247,37,133,0.09)"},
    {bg: "#16092b", fg: "#ffffff", accent: "#4cc9f0", soft: "rgba(76,201,240,0.11)"},
  ],
  // Vintage detective-corkboard documentary look. skin "archive" swaps the
  // whole render style (paper texture, pinned cards, stamps) via Shell/scenes.
  archive: [
    {bg: "#e8dcc3", fg: "#1a1611", accent: "#b5442d", card: "#f5efdf", soft: "rgba(26,22,17,0.06)", skin: "archive"},
    {bg: "#e3d5b8", fg: "#1a1611", accent: "#a23a25", card: "#f2ead6", soft: "rgba(26,22,17,0.07)", skin: "archive"},
    {bg: "#ece0c8", fg: "#211a12", accent: "#b5442d", card: "#f7f1e2", soft: "rgba(26,22,17,0.05)", skin: "archive"},
    {bg: "#e6d8bd", fg: "#1a1611", accent: "#9e3822", card: "#f4ecd9", soft: "rgba(26,22,17,0.06)", skin: "archive"},
  ],
};

export const themeFor = (palette, i) => {
  const list = PALETTES[palette] || PALETTES.vox;
  // Every theme carries a skin; the four original palettes default to "flat"
  // (zero visual change) unless an entry overrides it.
  return {skin: "flat", ...list[i % list.length]};
};
