"""Groq call #1: topic -> structured scene script (JSON)."""
import json

MODEL = "llama-3.3-70b-versatile"

VALID_TYPES = {
    "title_card", "kinetic_text", "stat_reveal", "icon_list",
    "quote", "timeline", "comparison", "chart", "media",
}

SYSTEM = """You are a scriptwriter for Vox-style explainer videos: punchy, factual, conversational, short sentences, surprising angles.

Return ONLY valid JSON: {"scenes": [...]}.

Each scene: {"type": "...", "narration_text": "what the narrator says (15-40 words)", "key_data": {...}}

Allowed types and their key_data:
- "title_card":   {"title": "short punchy title, max 7 words"}
- "kinetic_text": {}  (the narration words themselves are the visual)
- "stat_reveal":  {"stat": "73%", "label": "short label under the big number"}
- "icon_list":    {"items": [{"icon": "LucideIconName", "text": "3-6 words"}]}  (2-4 items; icon MUST be a real lucide-react icon name in PascalCase, e.g. Zap, Globe, TrendingUp, Factory, Users, DollarSign, Thermometer, Leaf, Building2, Car, Droplets, Sun, Wind, Brain, Rocket, ShieldAlert)
- "quote":        {"quote": "...", "attribution": "who said it"}
- "timeline":     {"events": [{"year": "1990", "text": "3-6 words"}]}  (3-5 events)
- "comparison":   {"left": {"label": "...", "value": "..."}, "right": {"label": "...", "value": "..."}}
- "chart":        {"title": "short chart title", "bars": [{"label": "...", "value": 42}]}  (3-6 bars, values are plain numbers)
- "media":        {"query": "2-4 word image search query", "caption": "short caption shown over the photo"}  (a real photo fills the screen; query MUST name a concrete, searchable subject — a real person, place, event, object, or animal — e.g. "Mahatma Gandhi", "Amazon rainforest", "Berlin Wall 1989")

Rules:
- First scene MUST be type "title_card". Its narration_text is the hook line.
- Mix scene types; never use the same type twice in a row.
- Use real, accurate numbers. Stats and chart values must be factual.
- narration_text must flow naturally scene to scene, like one continuous script.
- If the topic is visual (nature, places, cities, technology, science, animals, sports, lifestyle, history, etc.), make MOST scenes — about 60 to 75 percent — type "media" so real footage/photos play through the whole video from start to finish. Give each media scene a specific, searchable "query" (a concrete filmable subject, never an abstract concept), and VARY the queries so the footage is never repetitive. Still sprinkle in a few stat_reveal / chart / quote scenes for key facts and pacing. Only for purely abstract topics with nothing to film should you use few media scenes."""


def _parse_scenes(content: str) -> list[dict]:
    data = json.loads(content)
    scenes = data.get("scenes", [])
    if not scenes:
        raise ValueError(f"Groq returned no scenes: {data}")
    clean = []
    for s in scenes:
        t = s.get("type", "kinetic_text")
        clean.append({
            "type": t if t in VALID_TYPES else "kinetic_text",
            "narration_text": str(s.get("narration_text", "")).strip(),
            "key_data": s.get("key_data") or {},
        })
    return [s for s in clean if s["narration_text"]]


def _total_words(scenes: list[dict]) -> int:
    return sum(len(s["narration_text"].split()) for s in scenes)


def _generate_single(client, topic: str, minutes: float) -> list[dict]:
    target_words = int(minutes * 140)
    n_scenes = max(5, int(minutes * 8))
    per_scene = max(15, target_words // n_scenes)
    user = (
        f'Topic: "{topic}"\n'
        f"Write exactly {n_scenes} scenes.\n"
        f"IMPORTANT: total narration MUST be at least {target_words} words "
        f"(the video length depends on it). Each scene's narration_text must be "
        f"{per_scene}-{per_scene + 15} words. Count your words."
    )
    messages = [{"role": "system", "content": SYSTEM},
                {"role": "user", "content": user}]
    resp = client.chat.completions.create(
        model=MODEL, messages=messages,
        response_format={"type": "json_object"}, temperature=0.7,
    )
    content = resp.choices[0].message.content
    scenes = _parse_scenes(content)

    # Models often undershoot length — one retry asking to expand.
    if _total_words(scenes) < int(target_words * 0.75):
        print(f"  script too short ({_total_words(scenes)} words, "
              f"target {target_words}) — expanding...")
        messages += [
            {"role": "assistant", "content": content},
            {"role": "user", "content":
                f"Too short: {_total_words(scenes)} words total, need at least "
                f"{target_words}. Rewrite the SAME scenes (same types, same key_data "
                f"style) with richer narration_text of {per_scene}-{per_scene + 15} "
                f"words each. Return the full JSON again."},
        ]
        resp = client.chat.completions.create(
            model=MODEL, messages=messages,
            response_format={"type": "json_object"}, temperature=0.7,
        )
        try:
            scenes = _parse_scenes(resp.choices[0].message.content)
        except (ValueError, json.JSONDecodeError):
            pass  # keep the first (short but valid) version

    print(f"  {len(scenes)} scenes, ~{_total_words(scenes)} words "
          f"(~{_total_words(scenes) / 2.4:.0f}s of narration): "
          f"{[s['type'] for s in scenes]}")
    return scenes


# --- Chaptered generation for long videos (>= 3 min) ------------------------
# One giant JSON response for a 10-minute script often fails or gets truncated,
# so we outline chapters first, then generate scenes chapter by chapter.

def _chapter_outline(client, topic: str, n_chapters: int) -> list[dict]:
    user = (
        f'Topic: "{topic}"\n'
        f"Break this into exactly {n_chapters} chapters that together tell one "
        f"complete, well-paced explainer (each chapter ~1 minute). Chapters must "
        f"flow in a logical order and not overlap. Return ONLY JSON: "
        f'{{"chapters": [{{"title": "short chapter title", '
        f'"summary": "one sentence on what it covers"}}]}}'
    )
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": "You outline explainer videos."},
                  {"role": "user", "content": user}],
        response_format={"type": "json_object"}, temperature=0.6,
    )
    data = json.loads(resp.choices[0].message.content)
    chs = [c for c in data.get("chapters", []) if c.get("title")]
    return chs[:n_chapters]


def _scenes_for_chapter(client, topic, chapter, idx, total, per_scene) -> list[dict]:
    if idx == 0:
        lead = "Start the whole video with a title_card hook scene."
    else:
        lead = ("Do NOT use a title_card — continue the narration naturally as if "
                "picking up from the previous chapter.")
    user = (
        f'Topic: "{topic}"\n'
        f'This is chapter {idx + 1} of {total}: "{chapter.get("title")}".\n'
        f'What it covers: {chapter.get("summary", "")}\n'
        f"Write 7-8 scenes covering ONLY this chapter. IMPORTANT: this chapter's "
        f"total narration MUST be at least 140 words (the video length depends on "
        f"it) — each scene's narration_text must be {per_scene}-{per_scene + 15} "
        f"words. Count your words. {lead}"
    )
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": SYSTEM},
                  {"role": "user", "content": user}],
        response_format={"type": "json_object"}, temperature=0.7,
    )
    scenes = _parse_scenes(resp.choices[0].message.content)
    # Only the very first scene of the whole video may be a title_card; downgrade
    # any stray chapter title cards so the video doesn't look like it restarted.
    if idx > 0:
        for s in scenes:
            if s["type"] == "title_card":
                s["type"] = "kinetic_text"
    return scenes


def _generate_chaptered(client, topic: str, minutes: float) -> list[dict]:
    n_chapters = max(3, round(minutes))
    print(f"  long video ({minutes:g} min) — generating in {n_chapters} chapters")
    outline = _chapter_outline(client, topic, n_chapters)
    if not outline:
        outline = [{"title": f"Part {i + 1}", "summary": ""} for i in range(n_chapters)]
    print(f"  outline: {[c['title'] for c in outline]}")

    all_scenes: list[dict] = []
    for i, ch in enumerate(outline):
        print(f"  chapter {i + 1}/{len(outline)}: {ch['title']}")
        try:
            all_scenes += _scenes_for_chapter(client, topic, ch, i, len(outline), 18)
        except (ValueError, json.JSONDecodeError) as e:
            print(f"    chapter {i + 1} failed ({e}) — skipping")

    if not all_scenes:
        print("  chaptered generation produced nothing — falling back to single call")
        return _generate_single(client, topic, minutes)

    # Guarantee the whole video opens on a title_card.
    if all_scenes[0]["type"] != "title_card":
        all_scenes[0]["type"] = "title_card"
        all_scenes[0].setdefault("key_data", {}).setdefault("title", topic)

    print(f"  {len(all_scenes)} scenes across {len(outline)} chapters, "
          f"~{_total_words(all_scenes)} words "
          f"(~{_total_words(all_scenes) / 2.4:.0f}s of narration)")
    return all_scenes


def generate_script(client, topic: str, minutes: float) -> list[dict]:
    """Single call for short videos; chapter-by-chapter for long ones (>= 3 min)."""
    if minutes >= 3:
        return _generate_chaptered(client, topic, minutes)
    return _generate_single(client, topic, minutes)
