"""Decide which videos to make today and write output/plan.json.

Source of topics:
  * Tracker mode (day_index 1..30): pull that day's 2 shorts from each of the 4
    channels (8 portrait shorts). On the tracker's marked "long" days, also add
    one landscape long video per channel.
  * Groq mode (day_index > 30, tracker exhausted): ask Groq for 8 fresh portrait
    shorts (2 per channel theme), avoiding anything in topic_history.json.

State advances by one day each run (automation/state.json) so topics never repeat.
Chosen topics are appended to automation/topic_history.json.

Output: output/plan.json — a list of items:
  {id, channel, channel_name, kind, topic, style, voice, format, minutes}

Usage:
  GROQ_API_KEY=... python automation/plan_day.py
"""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
CHANNELS_FILE = HERE / "channels.json"
STATE_FILE = HERE / "state.json"
HISTORY_FILE = HERE / "topic_history.json"
PLAN_FILE = ROOT / "output" / "plan.json"

MODEL = "llama-3.3-70b-versatile"
SHORT_MINUTES = 1.0
LONG_MINUTES = 3.0
GROQ_MAX_RETRIES = 3


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def load_json(path, default):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError, FileNotFoundError):
        return default


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:50] or "topic"


def is_duplicate(topic, past):
    t = topic.strip().lower()
    if not t:
        return True
    for p in past:
        p = p.strip().lower()
        if p and (t in p or p in t):
            return True
    return False


def groq_topic(client, channel_name, theme_hint, past):
    used = "\n".join(f"- {p}" for p in past[-200:]) or "(none yet)"
    system = (
        f"You suggest ONE fresh, specific, visually rich short-video topic for a "
        f"channel about {theme_hint}. It must be illustrable with generic Pexels "
        f"stock footage, under 70 characters, no historical people, catchy. "
        f"Return ONLY the topic text, no quotes or numbering."
    )
    user = (
        f"Channel: {channel_name}\n"
        f"Previously used topics (be clearly different from ALL):\n{used}\n\n"
        "Suggest ONE new topic."
    )
    for _ in range(GROQ_MAX_RETRIES):
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": user}],
            temperature=1.0, max_tokens=60,
        )
        cand = (resp.choices[0].message.content or "").strip()
        cand = cand.strip('"').strip("'").lstrip("-*0123456789. ").strip()
        cand = cand.splitlines()[0].strip() if cand else cand
        if cand and not is_duplicate(cand, past):
            return cand
        log(f"    ! groq near-dup/empty: {cand!r} — retry")
    # last resort keeps the run going
    stamp = datetime.now(timezone.utc).strftime("%m%d")
    return (cand or f"{channel_name} discovery") + f" {stamp}"


def build_tracker_items(channels, order, long_days, day):
    items = []
    for ch in order:
        c = channels[ch]
        base = (day - 1) * 2
        for n, idx in enumerate((base, base + 1), start=1):
            items.append({
                "id": f"{ch}-d{day:02d}-short{n}",
                "channel": ch, "channel_name": c["name"], "kind": "short",
                "topic": c["shorts"][idx],
                "style": c["style"], "voice": c["voice"],
                "format": "portrait", "minutes": SHORT_MINUTES,
            })
    ld = long_days.get(str(day))
    if ld is not None:
        for ch in order:
            c = channels[ch]
            items.append({
                "id": f"{ch}-d{day:02d}-long",
                "channel": ch, "channel_name": c["name"], "kind": "long",
                "topic": c["longs"][ld],
                "style": c["style"], "voice": c["voice"],
                "format": "landscape", "minutes": LONG_MINUTES,
            })
    return items


def build_groq_items(channels, order, past, day):
    from groq import Groq
    key = os.getenv("GROQ_API_KEY")
    if not key or key.startswith("your_"):
        sys.exit("GROQ_API_KEY missing (needed once the tracker is exhausted).")
    client = Groq(api_key=key)
    theme = {"atlas": "geography and countries", "minds": "psychology",
             "space": "space and astronomy", "future": "technology and AI"}
    items, running = [], list(past)
    for ch in order:
        c = channels[ch]
        for n in range(1, 3):
            topic = groq_topic(client, c["name"], theme.get(ch, "general knowledge"), running)
            running.append(topic)
            items.append({
                "id": f"{ch}-d{day:02d}-short{n}-{slug(topic)[:20]}",
                "channel": ch, "channel_name": c["name"], "kind": "short",
                "topic": topic, "style": c["style"], "voice": c["voice"],
                "format": "portrait", "minutes": SHORT_MINUTES,
            })
    return items


def main():
    data = load_json(CHANNELS_FILE, None)
    if not data:
        sys.exit("automation/channels.json missing or invalid.")
    channels, order, long_days = data["channels"], data["order"], data["long_days"]

    state = load_json(STATE_FILE, {})
    day = int(state.get("day_index", 1))
    history = load_json(HISTORY_FILE, [])
    past = [h.get("topic", "") for h in history if isinstance(h, dict)]

    tracker_days = len(channels[order[0]]["shorts"]) // 2  # 60 // 2 == 30
    if day <= tracker_days:
        log(f"[plan] tracker mode — day {day}/{tracker_days}")
        items = build_tracker_items(channels, order, long_days, day)
    else:
        log(f"[plan] Groq mode — tracker exhausted (day {day})")
        items = build_groq_items(channels, order, past, day)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for it in items:
        history.append({"date": today, "topic": it["topic"],
                        "channel": it["channel"], "kind": it["kind"]})

    state["day_index"] = day + 1
    state["last_run"] = today
    STATE_FILE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    HISTORY_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False) + "\n",
                            encoding="utf-8")

    PLAN_FILE.parent.mkdir(parents=True, exist_ok=True)
    PLAN_FILE.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n",
                         encoding="utf-8")

    shorts = sum(1 for i in items if i["kind"] == "short")
    longs = sum(1 for i in items if i["kind"] == "long")
    log(f"[plan] {len(items)} videos ({shorts} shorts, {longs} longs) -> {PLAN_FILE}")
    for it in items:
        log(f"    - [{it['channel_name']}/{it['kind']}/{it['format']}] {it['topic']}")


if __name__ == "__main__":
    main()
