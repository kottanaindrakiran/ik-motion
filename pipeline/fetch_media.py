"""Fetch one real photo per 'media' scene.

Order of preference:
  1. Wikimedia Commons (no API key) — best for historical / famous subjects.
  2. Pexels (only if PEXELS_API_KEY is set) — fallback for generic queries.
  3. Nothing found -> the scene is downgraded to 'kinetic_text' so the video
     never breaks on a missing image.

Images land in video/public/media/scene_XX.jpg; the bare filename is written
into scene['key_data']['file'] for the MediaScene component to pick up.
Uses only the standard library (no new dependency).
"""
import os
from pathlib import Path

import httpx

# Wikimedia enforces a User-Agent policy: a real tool name plus a contact
# URL/email is required, or the API returns 403.
UA = "IKMotion/1.0 (https://github.com/indrakiran/ikmotion; ikmotion@example.com)"
TIMEOUT = 25

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API = "https://api.openverse.org/v1/images/"
PEXELS_API = "https://api.pexels.com/v1/search"
PEXELS_VIDEO_API = "https://api.pexels.com/videos/search"
MAX_VIDEOS = 10         # at most this many video clips per render
MAX_CLIP_SECONDS = 15

# Skip vector / tiny / icon-ish results.
_BAD_MIME = {"image/svg+xml", "image/gif"}
_MIN_WIDTH = 500


def _get_json(url: str, params: dict, headers: dict | None = None) -> dict | None:
    try:
        r = httpx.get(url, params=params, timeout=TIMEOUT, follow_redirects=True,
                      headers={"User-Agent": UA, **(headers or {})})
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"    (request failed: {e})")
        return None


def _download(url: str, dest: Path, params: dict | None = None,
              headers: dict | None = None, content_prefix: str = "image/") -> bool:
    try:
        r = httpx.get(url, params=params, timeout=max(TIMEOUT, 40), follow_redirects=True,
                      headers={"User-Agent": UA, **(headers or {})})
        if r.status_code != 200:
            return False
        if not r.headers.get("content-type", "").startswith(content_prefix):
            return False  # an error/JSON body, not the media we asked for
        data = r.content
        if len(data) < 3000:  # too small to be real media
            return False
        dest.write_bytes(data)
        return True
    except Exception as e:
        print(f"    (download failed: {e})")
        return False


def _wikimedia(query: str, dest: Path) -> bool:
    """Search Commons for a large raster image and download a ~1600px version."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",       # File: namespace
        "gsrlimit": "12",
        "prop": "imageinfo",
        "iiprop": "url|size|mime",
        "iiurlwidth": "1600",      # ask for a scaled-down thumb of the original
    }
    data = _get_json(COMMONS_API, params)
    if not data:
        return False
    pages = (data.get("query") or {}).get("pages") or {}
    # Rank candidates: raster, wide enough, larger first.
    cands = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        mime = info.get("mime", "")
        width = info.get("width", 0) or 0
        url = info.get("thumburl") or info.get("url")
        if not url or mime in _BAD_MIME or not mime.startswith("image/"):
            continue
        if width and width < _MIN_WIDTH:
            continue
        cands.append((width, url))
    cands.sort(reverse=True)
    for _, url in cands:
        if _download(url, dest, headers={"Referer": "https://commons.wikimedia.org/"}):
            return True
    return False


def _openverse(query: str, dest: Path) -> bool:
    """Openverse aggregates CC images (Commons, Flickr, museums) and serves
    thumbnails from its OWN CDN — a reliable fallback when the Wikimedia media
    host blocks direct downloads."""
    data = _get_json(OPENVERSE_API, {"q": query, "page_size": 10, "mature": "false"})
    if not data:
        return False
    for it in data.get("results", []):
        tid = it.get("id")
        if not tid:
            continue
        thumb = it.get("thumbnail") or f"{OPENVERSE_API}{tid}/thumb/"
        # Prefer a larger proxied original; fall back to the default ~600px thumb.
        if _download(thumb, dest, params={"full_size": "true"}) or _download(thumb, dest):
            return True
    return False


def _pexels(query: str, dest: Path) -> bool:
    key = os.getenv("PEXELS_API_KEY")
    if not key or key.startswith("your_"):
        return False
    params = {"query": query, "per_page": "1", "orientation": "landscape"}
    data = _get_json(PEXELS_API, params, headers={"Authorization": key})
    if not data:
        return False
    photos = data.get("photos") or []
    if not photos:
        return False
    src = photos[0].get("src") or {}
    url = src.get("large2x") or src.get("large") or src.get("original")
    return bool(url) and _download(url, dest)


def _pexels_video(query: str, dest: Path) -> bool:
    """Pexels video search (needs PEXELS_API_KEY). Downloads a short muted mp4."""
    key = os.getenv("PEXELS_API_KEY")
    if not key or key.startswith("your_"):
        return False
    data = _get_json(PEXELS_VIDEO_API, {"query": query, "per_page": "8", "orientation": "landscape"},
                     headers={"Authorization": key})
    if not data:
        return False
    vids = data.get("videos") or []
    # Prefer short clips first.
    vids.sort(key=lambda v: (v.get("duration", 999) > MAX_CLIP_SECONDS, v.get("duration", 999)))
    for v in vids:
        files = [f for f in (v.get("video_files") or [])
                 if f.get("file_type") == "video/mp4" and f.get("link")]
        # A modest resolution keeps the download small; aim near 1080px wide.
        files.sort(key=lambda f: abs((f.get("width") or 0) - 1080))
        for f in files:
            if _download(f["link"], dest, content_prefix="video/"):
                return True
    return False


def fetch_media(scenes: list[dict], media_dir: Path) -> int:
    """Download media for every 'media' scene. Returns how many succeeded.

    If PEXELS_API_KEY is set, up to MAX_VIDEOS scenes try a short video clip
    first (kind="video"); otherwise a photo is used (kind="photo"). Scenes with
    nothing usable are downgraded to 'kinetic_text' in place.
    """
    media_dir.mkdir(parents=True, exist_ok=True)
    targets = [(i, s) for i, s in enumerate(scenes) if s.get("type") == "media"]
    if not targets:
        return 0

    have_pexels = bool((os.getenv("PEXELS_API_KEY") or "").strip()) and \
        not (os.getenv("PEXELS_API_KEY") or "").startswith("your_")
    video_budget = MAX_VIDEOS
    src_label = "Pexels (real photos + video, one source)" if have_pexels \
        else "Wikimedia/Openverse (photos)"
    print(f"  Fetching stock media for {len(targets)} scene(s) from {src_label}...")
    ok = 0
    for i, s in targets:
        query = str((s.get("key_data") or {}).get("query") or "").strip()
        got = False

        if query and have_pexels:
            # Single source: Pexels. Video first (real footage), then a photo.
            vdest = media_dir / f"scene_{i:02d}.mp4"
            if video_budget > 0 and _pexels_video(query, vdest):
                s["key_data"]["file"] = vdest.name
                s["key_data"]["kind"] = "video"
                video_budget -= 1
                got = True
                print(f"    scene {i}: '{query}' -> {vdest.name} (video)")
            else:
                pdest = media_dir / f"scene_{i:02d}.jpg"
                if _pexels(query, pdest):
                    s["key_data"]["file"] = pdest.name
                    s["key_data"]["kind"] = "photo"
                    got = True
                    print(f"    scene {i}: '{query}' -> {pdest.name} (photo)")
        elif query:
            # No Pexels key: free chain (Wikimedia -> Openverse), photos only.
            pdest = media_dir / f"scene_{i:02d}.jpg"
            if _wikimedia(query, pdest) or _openverse(query, pdest):
                s["key_data"]["file"] = pdest.name
                s["key_data"]["kind"] = "photo"
                got = True
                print(f"    scene {i}: '{query}' -> {pdest.name}")

        if got:
            ok += 1
        else:
            # Never break the render: fall back to kinetic typography.
            s["type"] = "kinetic_text"
            print(f"    scene {i}: '{query}' -> no media, using kinetic_text")
    print(f"  {ok}/{len(targets)} media downloaded")
    return ok
