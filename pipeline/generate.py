"""IK Motion — topic in, Vox-style MP4 out.

Usage:
  python pipeline/generate.py "Why cities are getting hotter" --minutes 1
  python pipeline/generate.py --mock          (no API calls, sample scenes)
"""
import argparse
import json
import os
import random
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv
from utils import check_tool, run

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
VIDEO = ROOT / "video"
PUBLIC = VIDEO / "public"
MEDIA_DIR = PUBLIC / "media"
MUSIC_DIR = ROOT / "assets" / "music"

FPS = 30
FORMATS = {"landscape": (1920, 1080), "portrait": (1080, 1920)}
STYLES = ["vox", "midnight", "paper", "neon", "archive"]
OUTRO_SEC = 3.0


def append_outro(scenes, end_time):
    """Append the 3s IK sign-off scene; return the new total duration."""
    scenes.append({
        "type": "outro",
        "narration_text": "",
        "key_data": {},
        "start": round(end_time, 3),
        "duration": OUTRO_SEC,
        "words": [],
    })
    return round(end_time + OUTRO_SEC + 0.3, 3)


def base_props(topic, fmt, palette="vox"):
    return {
        "topic": topic,
        "fps": FPS,
        "format": {"width": fmt[0], "height": fmt[1]},
        "palette": palette,
    }


def build_mock_props(fmt, palette="vox"):
    scenes = json.loads(
        (Path(__file__).parent / "sample_scenes.json").read_text(encoding="utf-8")
    )
    t = 0.0
    for s in scenes:
        words = s["narration_text"].split()
        dur = max(3.0, len(words) / 2.5)  # ~150 wpm
        s["start"] = round(t, 3)
        s["duration"] = round(dur, 3)
        per = dur / max(1, len(words))
        s["words"] = [
            {"w": w, "start": round(t + i * per, 3), "end": round(t + (i + 1) * per, 3)}
            for i, w in enumerate(words)
        ]
        t += dur
    total = append_outro(scenes, t)
    props = base_props("Sample: Why Cities Are Ovens", fmt, palette)
    props.update({
        "audio": {"narration": None},
        "totalDuration": total,
        "scenes": scenes,
    })
    return props


def assign_words(scenes, words):
    for s in scenes:
        s0, s1 = s["start"], s["start"] + s["duration"]
        s["words"] = [w for w in words if s0 <= (w["start"] + w["end"]) / 2 < s1]


def pick_music():
    if not MUSIC_DIR.exists():
        return None
    tracks = list(MUSIC_DIR.glob("*.mp3"))
    return random.choice(tracks) if tracks else None


def main():
    ap = argparse.ArgumentParser(description="IK Motion video generator")
    ap.add_argument("topic", nargs="?", default=None)
    ap.add_argument("--minutes", type=float, default=1.0)
    ap.add_argument("--format", choices=list(FORMATS), default="landscape")
    ap.add_argument("--voice", default="en-US-AndrewNeural")
    ap.add_argument("--style", choices=STYLES, default="vox", help="Visual palette")
    ap.add_argument("--mock", action="store_true", help="Skip all APIs, render sample scenes")
    args = ap.parse_args()

    check_tool("ffmpeg")
    check_tool("ffprobe")
    check_tool("npx")
    OUT.mkdir(exist_ok=True)
    PUBLIC.mkdir(exist_ok=True)

    # Fresh stock media each run — old photos must not leak into a new video.
    if MEDIA_DIR.exists():
        shutil.rmtree(MEDIA_DIR)
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    # Keep Remotion's scratch frames/encoder on the same drive as the output.
    # The OS temp drive (e.g. C:) can be full, which kills the frame encoder
    # with ENOSPC — surfacing as a broken-pipe "write EOF"/"EPIPE" crash.
    render_tmp = OUT / ".render-tmp"
    render_tmp.mkdir(exist_ok=True)
    os.environ["TMPDIR"] = os.environ["TEMP"] = os.environ["TMP"] = str(render_tmp)

    fmt = FORMATS[args.format]

    if args.mock:
        print("[1/5] Mock mode: using sample scenes (no API calls)")
        props = build_mock_props(fmt, args.style)
    else:
        if not args.topic:
            sys.exit('No topic. Usage: python pipeline/generate.py "Your topic here"')
        load_dotenv(ROOT / ".env")
        key = os.getenv("GROQ_API_KEY")
        if not key or key.startswith("your_"):
            sys.exit("GROQ_API_KEY missing. Copy .env.example to .env and paste your key.")
        from groq import Groq
        client = Groq(api_key=key)

        print(f'[1/5] Script for: "{args.topic}"')
        from script_gen import generate_script
        scenes = generate_script(client, args.topic, args.minutes)

        # Real stock photos for any "media" scenes (sub-step of scripting).
        from fetch_media import fetch_media
        fetch_media(scenes, MEDIA_DIR)

        print("[2/5] Voiceover (Edge TTS)")
        from tts import synthesize
        narration = synthesize(scenes, args.voice, OUT / "tts")
        shutil.copy(narration, PUBLIC / "narration.mp3")

        print("[3/5] Word timestamps (Groq Whisper)")
        from transcribe import word_timestamps
        assign_words(scenes, word_timestamps(client, narration))

        print("[4/5] Metadata (title / description / hashtags)")
        from metadata import generate_metadata
        meta = generate_metadata(client, args.topic, scenes)
        (OUT / "metadata.json").write_text(
            json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

        content_end = scenes[-1]["start"] + scenes[-1]["duration"]
        total = append_outro(scenes, content_end)
        props = base_props(args.topic, fmt, args.style)
        props.update({
            "audio": {"narration": "narration.mp3"},
            "totalDuration": total,
            "scenes": scenes,
        })

    props_path = OUT / "props.json"
    props_path.write_text(json.dumps(props, indent=2, ensure_ascii=False), encoding="utf-8")

    print("[5/5] Rendering with Remotion (this takes a while)...")
    raw = OUT / "video_raw.mp4"
    # --concurrency=1: single-threaded render. Slower but robust when the
    # system drive is low on space (parallel Chrome tabs otherwise thrash it
    # and one dies mid-render). Raise this once the OS drive has free space.
    run(f'npx remotion render src/index.jsx Main "{raw}" --props="{props_path}" --concurrency=1', cwd=VIDEO)

    final = OUT / "video.mp4"
    music = pick_music()
    if music and not args.mock:
        print(f"  Mixing music: {music.name}")
        from mix_audio import mix_music
        mix_music(raw, music, final)
    else:
        shutil.copy(raw, final)
        if not music:
            print("  (no music found in assets/music — skipped)")

    print(f"\nDone: {final}")
    if not args.mock:
        meta = json.loads((OUT / "metadata.json").read_text(encoding="utf-8"))
        print(f"Title: {meta.get('title')}")
        print(f"Hashtags: {' '.join(meta.get('hashtags', []))}")


if __name__ == "__main__":
    main()
