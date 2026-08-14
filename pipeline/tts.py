"""Edge TTS: one clip per scene, concatenated. Sets scene start/duration in-place."""
import asyncio
from pathlib import Path

import edge_tts

from utils import ffprobe_duration, run


def synthesize(scenes: list[dict], voice: str, workdir: Path) -> Path:
    workdir.mkdir(parents=True, exist_ok=True)
    paths = []
    for i, s in enumerate(scenes):
        p = workdir / f"scene_{i:02d}.mp3"
        print(f"  TTS scene {i + 1}/{len(scenes)}")
        asyncio.run(edge_tts.Communicate(s["narration_text"], voice).save(str(p)))
        paths.append(p)

    # Scene timing = exact audio timing (clips are concatenated back to back)
    t = 0.0
    for s, p in zip(scenes, paths):
        d = ffprobe_duration(p)
        s["start"] = round(t, 3)
        s["duration"] = round(d, 3)
        t += d

    concat_list = workdir / "list.txt"
    concat_list.write_text(
        "\n".join(f"file '{p.resolve().as_posix()}'" for p in paths),
        encoding="utf-8",
    )
    out = workdir / "narration.mp3"
    run(f'ffmpeg -y -f concat -safe 0 -i "{concat_list}" -c:a libmp3lame -q:a 3 "{out}"')
    return out
