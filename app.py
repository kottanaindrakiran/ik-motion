"""IK Motion — local web UI backend.

Wraps the existing pipeline (pipeline/generate.py) as-is: runs it as a
subprocess in a background thread, parses its stdout live for step/progress,
and serves a single-page frontend plus the rendered video.

Run:  python -m uvicorn app:app --host 127.0.0.1 --port 8000
"""
import json
import os
import re
import subprocess
import sys
import threading
import time
import webbrowser
from collections import deque
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent
PIPELINE = ROOT / "pipeline"
OUT = ROOT / "output"
UI = ROOT / "ui"

STEP_LABELS = {
    1: "Script",
    2: "Voiceover",
    3: "Captions",
    4: "Metadata",
    5: "Rendering",
}
# Overall-percent floor when each step begins. Rendering (step 5) then climbs
# from 40 -> 99 using Remotion's live "Rendered"/"Encoded" frame counters.
STEP_BASE = {1: 5, 2: 15, 3: 25, 4: 35, 5: 40}

VALID_FORMATS = {"landscape", "portrait"}
VALID_STYLES = {"vox", "midnight", "paper", "neon", "archive"}

# The voices offered in the UI — validated so /api/voice_preview can't be
# pointed at arbitrary input.
VALID_VOICES = {
    "en-US-AndrewNeural", "en-US-ChristopherNeural", "en-US-GuyNeural",
    "en-US-AriaNeural", "en-US-JennyNeural",
    "en-GB-RyanNeural", "en-GB-SoniaNeural",
    "en-IN-PrabhatNeural", "en-IN-NeerjaNeural",
    "en-AU-NatashaNeural",
}
VOICE_SAMPLE_TEXT = "This is how your video will sound."
VOICE_CACHE = OUT / ".voice_cache"

_STEP_RE = re.compile(r"\[(\d)/5\]")
_RENDERED_RE = re.compile(r"Rendered\s+(\d+)/(\d+)")
_ENCODED_RE = re.compile(r"Encoded\s+(\d+)/(\d+)")


class Job:
    def __init__(self, params: dict):
        self.id = f"job_{int(time.time() * 1000)}"
        self.params = params
        self.state = "queued"          # queued | running | done | error
        self.step = 0
        self.percent = 0.0
        self.started = time.time()
        self.finished = None
        self.error = None
        self.returncode = None
        self.log = deque(maxlen=500)
        self.lock = threading.Lock()

    @property
    def step_label(self):
        return STEP_LABELS.get(self.step, "")

    @property
    def elapsed(self):
        end = self.finished or time.time()
        return int(end - self.started)

    def add_log(self, line: str):
        with self.lock:
            self.log.append(line)

    def log_tail(self, n: int = 80) -> str:
        with self.lock:
            return "\n".join(list(self.log)[-n:])

    def snapshot(self) -> dict:
        return {
            "job_id": self.id,
            "state": self.state,
            "step": self.step,
            "step_label": self.step_label,
            "percent": round(min(100.0, max(0.0, self.percent)), 1),
            "elapsed_seconds": self.elapsed,
            "log_tail": self.log_tail(),
            "error": self.error,
        }


# ---- single-job registry ---------------------------------------------------
_jobs: dict[str, Job] = {}
_current: Job | None = None
_registry_lock = threading.Lock()


def _build_command(p: dict) -> list[str]:
    """Assemble the exact CLI the user would type — pipeline is untouched."""
    cmd = [sys.executable, str(PIPELINE / "generate.py")]
    if not p["mock"]:
        cmd.append(p["topic"])
    cmd += ["--minutes", str(p["minutes"]),
            "--format", p["format"],
            "--voice", p["voice"],
            "--style", p["style"]]
    if p["mock"]:
        cmd.append("--mock")
    return cmd


def _run_job(job: Job):
    job.state = "running"
    cmd = _build_command(job.params)
    job.add_log("$ " + " ".join(cmd))

    env = dict(os.environ)
    env["PYTHONUNBUFFERED"] = "1"     # flush [x/5] prints immediately
    env["PYTHONIOENCODING"] = "utf-8"

    try:
        proc = subprocess.Popen(
            cmd, cwd=str(ROOT), env=env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding="utf-8", errors="replace", bufsize=1,
        )
    except Exception as e:  # pragma: no cover - launch failure
        job.state = "error"
        job.error = f"Could not start pipeline: {e}"
        job.finished = time.time()
        return

    # Universal-newline text mode splits on \r too, so Remotion's progress
    # updates arrive as individual lines.
    for line in iter(proc.stdout.readline, ""):
        line = line.rstrip("\r\n")
        if not line:
            continue
        job.add_log(line)
        _parse_line(job, line)

    proc.stdout.close()
    job.returncode = proc.wait()
    job.finished = time.time()

    if job.returncode == 0 and (OUT / "video.mp4").exists():
        job.state = "done"
        job.step = 5
        job.percent = 100.0
    else:
        job.state = "error"
        if not job.error:
            tail = job.log_tail(15)
            job.error = (
                f"Pipeline exited with code {job.returncode}.\n\n{tail}"
                if job.returncode else "Pipeline failed — see log below."
            )


def _parse_line(job: Job, line: str):
    m = _STEP_RE.search(line)
    if m:
        s = int(m.group(1))
        if 1 <= s <= 5:
            job.step = s
            job.percent = max(job.percent, STEP_BASE[s])
        return

    m = _RENDERED_RE.search(line)
    if m:
        x, y = int(m.group(1)), max(1, int(m.group(2)))
        job.step = 5
        job.percent = max(job.percent, 40 + (x / y) * 35)   # 40 -> 75
        return

    m = _ENCODED_RE.search(line)
    if m:
        x, y = int(m.group(1)), max(1, int(m.group(2)))
        job.step = 5
        job.percent = max(job.percent, 75 + (x / y) * 24)   # 75 -> 99
        return

    if line.strip().startswith("Done:"):
        job.percent = 99.5


# ---- API -------------------------------------------------------------------
app = FastAPI(title="IK Motion UI")


class GenerateBody(BaseModel):
    topic: str | None = None
    minutes: float = 1.0
    format: str = "landscape"
    voice: str = "en-US-AndrewNeural"
    style: str = "vox"
    mock: bool = False


@app.post("/api/generate")
def generate(body: GenerateBody):
    global _current
    with _registry_lock:
        if _current and _current.state in ("queued", "running"):
            raise HTTPException(
                status_code=409,
                detail="A video is already being generated. Please wait for it "
                       "to finish before starting another.",
            )

        fmt = body.format if body.format in VALID_FORMATS else "landscape"
        style = body.style if body.style in VALID_STYLES else "vox"
        topic = (body.topic or "").strip()
        if not body.mock and not topic:
            raise HTTPException(
                status_code=400,
                detail="Please enter a topic (or turn on Test mode).",
            )
        if body.minutes <= 0:
            raise HTTPException(status_code=400, detail="Minutes must be > 0.")

        params = {
            "topic": topic,
            "minutes": body.minutes,
            "format": fmt,
            "voice": body.voice,
            "style": style,
            "mock": bool(body.mock),
        }
        job = Job(params)
        _jobs[job.id] = job
        _current = job

    threading.Thread(target=_run_job, args=(job,), daemon=True).start()
    return {"job_id": job.id, "state": job.state}


@app.get("/api/status/{job_id}")
def status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown job id.")
    return job.snapshot()


@app.get("/api/result/{job_id}")
def result(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown job id.")
    if job.state != "done":
        raise HTTPException(status_code=409, detail="Job is not finished yet.")

    # Mock mode never writes metadata.json — so any file on disk is stale from a
    # previous real render. Only surface metadata for real jobs.
    meta = {}
    meta_path = OUT / "metadata.json"
    if meta_path.exists() and not job.params.get("mock"):
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            meta = {}

    bust = int(job.finished or time.time())
    return {
        "video_url": f"/video?t={bust}",
        "title": meta.get("title"),
        "description": meta.get("description"),
        "hashtags": meta.get("hashtags", []),
        "mock": job.params.get("mock", False),
    }


@app.get("/api/voice_preview")
def voice_preview(voice: str):
    if voice not in VALID_VOICES:
        raise HTTPException(status_code=400, detail="Unknown voice.")
    VOICE_CACHE.mkdir(parents=True, exist_ok=True)
    path = VOICE_CACHE / f"{voice}.mp3"
    if not path.exists():  # cache one sample clip per voice
        import asyncio
        import edge_tts
        try:
            asyncio.run(edge_tts.Communicate(VOICE_SAMPLE_TEXT, voice).save(str(path)))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Preview failed: {e}")
    return FileResponse(path, media_type="audio/mpeg")


@app.get("/api/download")
def download():
    path = OUT / "video.mp4"
    if not path.exists():
        raise HTTPException(status_code=404, detail="No video has been rendered yet.")
    return FileResponse(path, media_type="video/mp4", filename="ik-motion.mp4")


@app.get("/video")
def video():
    path = OUT / "video.mp4"
    if not path.exists():
        raise HTTPException(status_code=404, detail="No video has been rendered yet.")
    # FileResponse honors HTTP Range requests, so in-browser seeking works.
    return FileResponse(path, media_type="video/mp4")


@app.get("/", response_class=HTMLResponse)
def index():
    html = UI / "index.html"
    if not html.exists():
        return HTMLResponse("<h1>ui/index.html not found</h1>", status_code=500)
    return HTMLResponse(html.read_text(encoding="utf-8"))


@app.get("/api/health")
def health():
    return JSONResponse({"ok": True})


@app.on_event("startup")
def _open_browser():
    # Opened once, shortly after the socket is listening.
    if os.environ.get("IKMOTION_NO_BROWSER") == "1":
        return
    threading.Timer(1.0, lambda: webbrowser.open("http://localhost:8000")).start()
