"""Pick ONE fresh daily video topic via Groq, avoiding anything used before.

Reads automation/topic_history.json (a list of {"date", "topic"}), asks Groq for
a brand-new visual, Pexels-friendly topic that differs from every previous one,
double-checks for near-duplicates in code, appends the winner to the history file,
and prints ONLY the chosen topic to stdout (all diagnostics go to stderr) so a
CI step can capture it with `$(python automation/pick_topic.py)`.

Usage:
  GROQ_API_KEY=... python automation/pick_topic.py
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
HISTORY = HERE / "topic_history.json"
MODEL = "llama-3.3-70b-versatile"
MAX_RETRIES = 3

CATEGORIES = "nature, cities, tech, space, food, sports, science"

SYSTEM_PROMPT = (
    "You are a content strategist for a short-form documentary video channel. "
    "You suggest ONE fresh, specific, visually rich video topic that can be "
    "illustrated with generic stock footage from Pexels. "
    f"Pick from these themes only: {CATEGORIES}. "
    "Do NOT pick historical people or biographies. "
    "The topic must be a single catchy phrase under 70 characters, no quotes, "
    "no numbering, no explanation. Return ONLY the topic text."
)


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def load_history() -> list:
    if not HISTORY.exists():
        return []
    try:
        data = json.loads(HISTORY.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        log("  ! topic_history.json unreadable — starting fresh")
        return []


def is_duplicate(topic: str, past_topics: list) -> bool:
    """Case-insensitive substring match in either direction."""
    t = topic.strip().lower()
    if not t:
        return True
    for p in past_topics:
        p = p.strip().lower()
        if not p:
            continue
        if t in p or p in t:
            return True
    return False


def ask_groq(client, past_topics: list) -> str:
    if past_topics:
        used = "\n".join(f"- {p}" for p in past_topics)
        user = (
            "Previously used topics (DO NOT repeat and be clearly different "
            f"from ALL of these):\n{used}\n\n"
            "Suggest ONE new topic that is clearly different from every item above."
        )
    else:
        user = "Suggest ONE fresh video topic. There is no history yet."

    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
        temperature=1.0,
        max_tokens=60,
    )
    topic = (resp.choices[0].message.content or "").strip()
    # Strip stray wrapping quotes / leading list markers the model may add.
    topic = topic.strip().strip('"').strip("'").lstrip("-*0123456789. ").strip()
    # Keep only the first line in case the model rambles.
    return topic.splitlines()[0].strip() if topic else topic


def main() -> None:
    key = os.getenv("GROQ_API_KEY")
    if not key or key.startswith("your_"):
        sys.exit("GROQ_API_KEY missing. Set it in the environment.")

    from groq import Groq
    client = Groq(api_key=key)

    history = load_history()
    past_topics = [h.get("topic", "") for h in history if isinstance(h, dict)]
    log(f"[pick_topic] {len(past_topics)} topic(s) in history")

    topic = ""
    for attempt in range(1, MAX_RETRIES + 1):
        candidate = ask_groq(client, past_topics)
        log(f"[pick_topic] attempt {attempt}: {candidate!r}")
        if candidate and not is_duplicate(candidate, past_topics):
            topic = candidate
            break
        log("  ! near-duplicate or empty — retrying")

    if not topic:
        # Last resort: keep the final candidate but make it unique with a date tag
        # rather than crashing the whole daily run.
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        topic = (candidate or "A Fresh Look at Our Planet") + f" ({stamp})"
        log(f"[pick_topic] all retries duplicate — falling back to: {topic!r}")

    entry = {
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "topic": topic,
    }
    history.append(entry)
    HISTORY.write_text(
        json.dumps(history, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    log(f"[pick_topic] chosen & saved: {topic!r}")

    # ONLY the topic goes to stdout — CI captures this.
    print(topic)


if __name__ == "__main__":
    main()
