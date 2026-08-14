"""Groq call #2: title, description, hashtags."""
import json

MODEL = "llama-3.3-70b-versatile"


def generate_metadata(client, topic: str, scenes: list[dict]) -> dict:
    script = " ".join(s["narration_text"] for s in scenes)
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system",
             "content": 'Return ONLY JSON: {"title": "catchy YouTube title <70 chars", '
                        '"description": "2-3 line description", '
                        '"hashtags": ["#tag1", ...10-15 relevant hashtags]}'},
            {"role": "user", "content": f"Topic: {topic}\n\nScript: {script}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.8,
    )
    return json.loads(resp.choices[0].message.content)
