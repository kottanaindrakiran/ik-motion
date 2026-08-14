import json
import shutil
import subprocess
import sys


def run(cmd: str, cwd=None):
    """Run a shell command, exit loudly on failure."""
    print(f"  $ {cmd}")
    r = subprocess.run(cmd, cwd=cwd, shell=True)
    if r.returncode != 0:
        sys.exit(f"Command failed ({r.returncode}): {cmd}")


def ffprobe_duration(path) -> float:
    r = subprocess.run(
        f'ffprobe -v error -show_entries format=duration -of json "{path}"',
        shell=True, capture_output=True, text=True,
    )
    return float(json.loads(r.stdout)["format"]["duration"])


def check_tool(name: str):
    if shutil.which(name) is None:
        sys.exit(f"'{name}' not found in PATH. Install it and try again.")
