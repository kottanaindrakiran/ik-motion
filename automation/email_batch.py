"""Send ONE email per finished video listed in output/batch/manifest.json.

Each email carries the video's title, full description, hashtags (one per line),
channel/kind/topic/date, a link to the run's full-quality artifacts, and the
compressed 9:16/16:9 clip as an attachment (skipped with a note if it somehow
exceeds Gmail's 25 MB limit). Emailing is best-effort per item: one failure is
logged and the rest still go out.

Env:
  GMAIL_ADDRESS       (required)  — Gmail account to log in / send from
  GMAIL_APP_PASSWORD  (required)  — Gmail App Password for that account
  RUN_URL             (optional)  — link to the GitHub Actions run/artifacts
  MAIL_FROM / MAIL_TO (optional)  — override sender/recipient
"""
import json
import os
import smtplib
import ssl
import sys
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "output" / "batch" / "manifest.json"

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
MAX_ATTACH = 24 * 1024 * 1024  # stay safely under Gmail's 25 MB limit


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def build_body(rec, run_url):
    meta = rec.get("metadata", {})
    title = meta.get("title", rec["topic"])
    description = meta.get("description", "")
    hashtags = meta.get("hashtags", [])
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    lines = [title, "", description, ""]
    lines += list(hashtags)
    lines += [
        "",
        f"Channel: {rec.get('channel_name', '')}",
        f"Kind: {rec.get('kind', '')} ({rec.get('format', '')})",
        f"Topic: {rec['topic']}",
        f"Date: {date}",
    ]
    if run_url:
        lines += ["", f"Full-quality download (workflow artifacts, kept 7 days): {run_url}"]
    return title, "\n".join(lines)


def main():
    password = os.getenv("GMAIL_APP_PASSWORD")
    if not password:
        sys.exit("GMAIL_APP_PASSWORD missing.")
    account = os.getenv("GMAIL_ADDRESS")
    if not account:
        sys.exit("GMAIL_ADDRESS missing.")
    sender = os.getenv("MAIL_FROM", account)
    recipient = os.getenv("MAIL_TO", account)
    run_url = os.getenv("RUN_URL", "")

    if not MANIFEST.exists():
        sys.exit("output/batch/manifest.json not found — nothing to email.")
    items = json.loads(MANIFEST.read_text(encoding="utf-8"))
    ready = [r for r in items if r.get("status") == "ok"]
    if not ready:
        log("[email] no completed videos to send.")
        return

    context = ssl.create_default_context()
    sent = 0
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(account, password)
        for rec in ready:
            try:
                title, body = build_body(rec, run_url)
                msg = EmailMessage()
                msg["From"] = sender
                msg["To"] = recipient
                msg["Subject"] = f"\U0001F3AC Daily IK Video — {rec.get('channel_name','')}: {title}"

                mail_path = ROOT / rec["video_mail"] if rec.get("video_mail") else None
                if mail_path and mail_path.exists() and mail_path.stat().st_size <= MAX_ATTACH:
                    msg.set_content(body)
                    data = mail_path.read_bytes()
                    msg.add_attachment(data, maintype="video", subtype="mp4",
                                       filename=f"{rec['id']}.mp4")
                else:
                    note = "\n\n(Video too large to attach — use the download link above.)"
                    msg.set_content(body + note)

                server.send_message(msg)
                sent += 1
                log(f"[email] sent: {rec['channel_name']} — {title}")
            except Exception as e:  # keep sending the rest
                log(f"[email] FAILED for {rec.get('id')}: {e}")

    log(f"[email] {sent}/{len(ready)} emails sent.")


if __name__ == "__main__":
    main()
