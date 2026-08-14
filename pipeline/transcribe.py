"""Groq Whisper: full narration -> word-level timestamps for animated captions."""
from pathlib import Path

MODEL = "whisper-large-v3-turbo"


def word_timestamps(client, audio_path: Path) -> list[dict]:
    with open(audio_path, "rb") as f:
        resp = client.audio.transcriptions.create(
            file=(audio_path.name, f.read()),
            model=MODEL,
            response_format="verbose_json",
            timestamp_granularities=["word"],
        )
    raw = getattr(resp, "words", None) or []
    words = []
    for w in raw:
        if isinstance(w, dict):
            words.append({"w": w["word"].strip(), "start": w["start"], "end": w["end"]})
        else:
            words.append({"w": w.word.strip(), "start": w.start, "end": w.end})
    print(f"  {len(words)} words timestamped")
    return words
