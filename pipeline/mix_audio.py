"""ffmpeg: loop a music track under the narration, ducked to a low volume."""
from pathlib import Path

from utils import run


def mix_music(video_in: Path, music: Path, out: Path, volume: float = 0.12):
    run(
        f'ffmpeg -y -i "{video_in}" -stream_loop -1 -i "{music}" '
        f'-filter_complex "[1:a]volume={volume}[m];'
        f'[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[a]" '
        f'-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "{out}"'
    )
