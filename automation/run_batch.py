"""Generate every video in output/plan.json, one at a time, resiliently.

For each planned item this:
  1. runs pipeline/generate.py with the item's topic/format/style/voice,
  2. moves the full-quality result to output/batch/<id>.mp4,
  3. compresses a mail-sized copy to output/batch/<id>_mail.mp4 (<~20 MB),
  4. records the outcome (with metadata) into output/batch/manifest.json.

The manifest is rewritten after EVERY item, so if one render crashes the whole
run, the emailer can still ship the videos that already finished. A single
failing item never aborts the rest — it is recorded with status "failed".

Usage:
  GROQ_API_KEY=... PEXELS_API_KEY=... python automation/run_batch.py
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output"
PLAN_FILE = OUT / "plan.json"
BATCH = OUT / "batch"
MANIFEST = BATCH / "manifest.json"


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def write_manifest(items):
    MANIFEST.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n",
                        encoding="utf-8")


def compress(src, dst, fmt):
    # Portrait -> cap height 1280; landscape -> cap width 1280. CRF 28 keeps a
    # 1-3 min clip comfortably under Gmail's 25 MB attachment limit.
    scale = "-2:1280" if fmt == "portrait" else "1280:-2"
    cmd = [
        "ffmpeg", "-y", "-i", str(src),
        "-vf", f"scale={scale}",
        "-c:v", "libx264", "-crf", "28", "-preset", "veryfast",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart", str(dst),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        log(f"    ! compress failed: {r.stderr[-400:]}")
        return False
    return True


def generate_one(item):
    cmd = [
        sys.executable, str(ROOT / "pipeline" / "generate.py"), item["topic"],
        "--minutes", str(item.get("minutes", 1.0)),
        "--format", item.get("format", "portrait"),
        "--style", item.get("style", "vox"),
        "--voice", item.get("voice", "en-US-AndrewNeural"),
    ]
    log(f"    $ generate.py {item['topic']!r} ({item['format']}, {item['style']})")
    r = subprocess.run(cmd, cwd=str(ROOT))
    return r.returncode == 0


def main():
    if not PLAN_FILE.exists():
        sys.exit("output/plan.json not found — run plan_day.py first.")
    plan = json.loads(PLAN_FILE.read_text(encoding="utf-8"))
    BATCH.mkdir(parents=True, exist_ok=True)

    results = []
    for i, item in enumerate(plan, 1):
        rec = dict(item)
        log(f"[{i}/{len(plan)}] {item['channel_name']} / {item['kind']} — {item['topic']}")
        try:
            ok = generate_one(item)
            src = OUT / "video.mp4"
            if not ok or not src.exists():
                rec["status"] = "failed"
                log("    ! generation failed")
            else:
                full = BATCH / f"{item['id']}.mp4"
                shutil.move(str(src), str(full))
                meta_path = OUT / "metadata.json"
                rec["metadata"] = (
                    json.loads(meta_path.read_text(encoding="utf-8"))
                    if meta_path.exists() else {}
                )
                mail = BATCH / f"{item['id']}_mail.mp4"
                rec["video_full"] = str(full.relative_to(ROOT))
                if compress(full, mail, item.get("format", "portrait")):
                    rec["video_mail"] = str(mail.relative_to(ROOT))
                rec["status"] = "ok"
                log(f"    done -> {full.name}"
                    f" ({full.stat().st_size // (1024*1024)} MB)")
        except Exception as e:  # never let one item kill the batch
            rec["status"] = "failed"
            rec["error"] = str(e)
            log(f"    ! exception: {e}")
        results.append(rec)
        write_manifest(results)  # persist progress after every item

    ok = sum(1 for r in results if r.get("status") == "ok")
    log(f"[run_batch] {ok}/{len(results)} videos generated")
    if ok == 0:
        sys.exit("All video generations failed.")


if __name__ == "__main__":
    main()
