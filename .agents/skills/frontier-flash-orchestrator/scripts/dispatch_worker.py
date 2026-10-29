#!/usr/bin/env python3
"""
Universal Worker Dispatcher.
Dispatches implementation task briefs to fast/free worker models via OpenCode CLI, Freebuff, Kilo Code, or 9Router.
Supported by: Antigravity, Claude Code, Cursor, Windsurf, Kilo Code, OpenCode, Codex.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time

DEFAULT_OPENCODE_MODEL = "9router/oc/glm-5.3-flash-free"
DEFAULT_FREEBUFF_MODEL = "freebuff/nemotron-3.5-lightning"
DEFAULT_KILO_MODEL = "9router/kc/reflection/beam-free"

def run_cmd(cmd: list[str], cwd: Path | None = None) -> tuple[int, str, str]:
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return proc.returncode, proc.stdout, proc.stderr

def find_freebuff_binary() -> str | None:
    bin_path = (
        shutil.which("freebuff")
        or shutil.which("freebuff.cmd")
        or shutil.which("freebuff.ps1")
    )
    if bin_path:
        return bin_path

    # Check ~/.config/manicode/freebuff.exe fallback
    config_bin = Path.home() / ".config" / "manicode" / ("freebuff.exe" if sys.platform == "win32" else "freebuff")
    if config_bin.exists():
        return str(config_bin)
    return None

def find_opencode_binary() -> str | None:
    return shutil.which("opencode") or shutil.which("opencode.cmd")

def find_kilo_binary() -> str | None:
    return (
        shutil.which("kilo")
        or shutil.which("kilo.cmd")
        or shutil.which("kilocode")
        or shutil.which("kilocode.cmd")
    )

def main() -> int:
    parser = argparse.ArgumentParser(description="Universal worker dispatcher for AI coding tools")
    parser.add_argument("--brief", required=True, help="Path to the task-brief.md file")
    parser.add_argument(
        "--provider",
        choices=["auto", "opencode", "freebuff", "kilo"],
        default="auto",
        help="Worker provider CLI to use: 'opencode', 'freebuff', 'kilo', or 'auto' (default: auto)",
    )
    parser.add_argument("--model", default=None, help="Worker model slug (default: provider specific)")
    parser.add_argument("--cwd", default=".", help="Working directory for worker")
    parser.add_argument("--dry-run", action="store_true", help="Print dispatch plan without calling worker")
    parser.add_argument("--spawn-window", action="store_true", help="Force spawn worker in a new terminal window (Windows)")
    args = parser.parse_args()

    repo_root = Path(args.cwd).resolve()
    brief_path = Path(args.brief).resolve()

    if not brief_path.exists():
        print(json.dumps({"status": "error", "message": f"Task brief file not found: {brief_path}"}, indent=2))
        return 1

    brief_content = brief_path.read_text(encoding="utf-8", errors="replace")

    # Detect binaries
    opencode_bin = find_opencode_binary()
    freebuff_bin = find_freebuff_binary()
    kilo_bin = find_kilo_binary()

    # Determine provider
    provider = args.provider
    if provider == "auto":
        if opencode_bin:
            provider = "opencode"
        elif kilo_bin:
            provider = "kilo"
        elif freebuff_bin:
            provider = "freebuff"
        else:
            print(json.dumps({
                "status": "error",
                "message": "No supported worker CLI found (OpenCode, Kilo Code, or Freebuff). Please ensure at least one is installed globally."
            }, indent=2))
            return 1
    elif provider == "opencode" and not opencode_bin:
        print(json.dumps({
            "status": "error",
            "message": "OpenCode CLI ('opencode') was not found in PATH. Please install it or use another provider."
        }, indent=2))
        return 1
    elif provider == "kilo" and not kilo_bin:
        print(json.dumps({
            "status": "error",
            "message": "Kilo Code CLI ('kilo' or 'kilocode') was not found in PATH. Please install it via 'npm install -g @kilocode/cli' or use another provider."
        }, indent=2))
        return 1
    elif provider == "freebuff" and not freebuff_bin:
        print(json.dumps({
            "status": "error",
            "message": "Freebuff CLI ('freebuff') was not found. Please install it via 'npm install -g freebuff' or use another provider."
        }, indent=2))
        return 1

    # Resolve model & binary
    if provider == "opencode":
        model = args.model or DEFAULT_OPENCODE_MODEL
        worker_bin = opencode_bin
    elif provider == "kilo":
        model = args.model or DEFAULT_KILO_MODEL
        worker_bin = kilo_bin
    else:
        model = args.model or DEFAULT_FREEBUFF_MODEL
        worker_bin = freebuff_bin

    if args.dry_run:
        print(json.dumps({
            "status": "dry-run",
            "provider": provider,
            "model": model,
            "brief": str(brief_path),
            "worker_bin": worker_bin,
            "repo_root": str(repo_root)
        }, indent=2))
        return 0

    prompt = (
        f"You are the autonomous implementation worker for this project. "
        f"Please read the following task brief carefully and implement all requirements, "
        f"create/modify the required files, and run the specified verification command.\n\n"
        f"--- TASK BRIEF START ---\n{brief_content}\n--- TASK BRIEF END ---\n\n"
        f"Execute all code changes and run verification tests now. Report your final status and test results when done."
    )

    start_time = time.time()

    if provider == "opencode":
        print(f"[*] Dispatching task to worker model '{model}' via OpenCode...")
        cmd = [worker_bin, "run", "--model", model, prompt]
        code, stdout, stderr = run_cmd(cmd, cwd=repo_root)
    elif provider == "kilo":
        print(f"[*] Dispatching task to worker model '{model}' via Kilo Code CLI...")
        cmd = [worker_bin, "run", "--auto"]
        if model:
            cmd.extend(["--model", model])
        cmd.append(prompt)
        code, stdout, stderr = run_cmd(cmd, cwd=repo_root)
    else:
        # Freebuff provider
        print(f"[*] Dispatching task to Freebuff worker (model: {model})...")
        is_interactive = sys.stdin.isatty() and not args.spawn_window

        if is_interactive:
            cmd = [worker_bin, "--trust-agents", "--cwd", str(repo_root)]
            print(f"[!] Running Freebuff in terminal. Instruct Freebuff to read {brief_path.name} when prompt opens.")
            proc = subprocess.run(cmd, cwd=repo_root)
            code = proc.returncode
            stdout = "Freebuff interactive session completed."
            stderr = ""
        else:
            if sys.platform == "win32":
                print("[!] Spawning Freebuff in an interactive window...")
                spawn_cmd = ["cmd.exe", "/c", "start", "Freebuff Worker", worker_bin, "--trust-agents", "--cwd", str(repo_root)]
                subprocess.Popen(spawn_cmd, cwd=repo_root)
                elapsed = round(time.time() - start_time, 2)
                result = {
                    "status": "launched",
                    "provider": "freebuff",
                    "model": model,
                    "elapsed_seconds": elapsed,
                    "message": f"Freebuff window opened. Instruct Freebuff: 'Read and implement {brief_path.name} in {brief_path.parent}'. Once finished, proceed to Acceptance Review in Frontier Agent.",
                    "brief": str(brief_path)
                }
                print(json.dumps(result, indent=2))
                return 0
            else:
                cmd = [worker_bin, "--trust-agents", "--cwd", str(repo_root)]
                code, stdout, stderr = run_cmd(cmd, cwd=repo_root)

    elapsed = round(time.time() - start_time, 2)

    # Check git status for changed files
    _, git_status, _ = run_cmd(["git", "status", "--short"], cwd=repo_root)
    changed_files = [line.strip() for line in git_status.splitlines() if line.strip()]

    result = {
        "status": "completed" if code == 0 else "failed",
        "provider": provider,
        "return_code": code,
        "model": model,
        "elapsed_seconds": elapsed,
        "changed_files": changed_files,
        "stdout_tail": stdout[-2000:] if len(stdout) > 2000 else stdout,
        "stderr_tail": stderr[-1000:] if len(stderr) > 1000 else stderr
    }

    print(json.dumps(result, indent=2))
    return code

if __name__ == "__main__":
    sys.exit(main())
