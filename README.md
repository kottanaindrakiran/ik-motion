# IK Motion — AI Vox-style Explainer Video Generator

Topic in → rendered MP4 out. Motion graphics (kinetic text, animated charts, icon reveals), AI voiceover, word-by-word captions, background music, and YouTube metadata.

## Stack

- **Script + metadata:** Groq (llama-3.3-70b-versatile)
- **Voice:** Edge TTS (free, no key)
- **Word timings:** Groq Whisper (whisper-large-v3-turbo)
- **Motion graphics:** Remotion (React) — frame-driven animation, deterministic renders
- **Music ducking:** ffmpeg

## Requirements

- Python 3.10+, Node 18+, **ffmpeg in PATH** (`ffmpeg -version` must work)
- Groq API key

## Setup (one time)

```bat
cd pipeline
pip install -r requirements.txt

cd ..\video
npm install

cd ..
copy .env.example .env
:: edit .env, paste your GROQ_API_KEY
```

## Test without any API calls (mock mode)

Renders a sample video from bundled scenes — proves Remotion works:

```bat
python pipeline\generate.py --mock
```

Output: `output\video.mp4`

## Generate a real video

```bat
python pipeline\generate.py "Why cities are getting hotter" --minutes 1
```

Options:

| Flag | Default | Notes |
|---|---|---|
| `--minutes` | 1 | Target video length |
| `--format` | landscape | `landscape` (1920x1080) or `portrait` (1080x1920 for Shorts) |
| `--voice` | en-US-AndrewNeural | Any Edge TTS voice (`edge-tts --list-voices`) |
| `--mock` | off | Skip all APIs, render sample scenes |

Outputs in `output\`: `video.mp4` (final, with music if available), `metadata.json` (title, description, hashtags), `props.json` (scene data).

## Background music

Drop royalty-free `.mp3` files into `assets\music\`. The pipeline picks one and mixes it under the narration (ducked). No files = no music, still works. (Pixabay tracks: download manually from pixabay.com/music — their audio API needs partner access.)

## Preview / develop scenes visually

```bat
cd video
npx remotion studio
```

Opens a browser editor with hot reload against sample props — the fastest way to iterate on the look.

## Project layout

```
pipeline/         Python: orchestration + AI calls
video/            Remotion: React scene components
  src/scenes/     StatReveal, IconList, Quote, Timeline, Comparison, Chart, TitleCard
  src/components/ KineticText, Captions, theme
assets/music/     your music tracks (optional)
output/           rendered videos + metadata
```

## Extending

- New scene type: add a component in `video/src/scenes/`, register it in `video/src/Video.jsx` `SCENE_MAP`, and mention the type in the prompt in `pipeline/script_gen.py`.
- New color style: add a palette in `video/src/components/theme.js`.
