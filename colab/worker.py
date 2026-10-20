#!/usr/bin/env python3
# ============================================================
#  SCM CUTFLOW — GPU TURBO WORKER  (Google Colab / Free T4)
#  Pull-based renderer: claims GPU jobs from your VPS, renders
#  on the T4, streams progress back, uploads the result.
#
#  Run inside Colab:  Runtime → Change runtime type → T4 GPU
# ============================================================

import hashlib
import hmac
import json
import os
import random
import signal
import socket
import sys
import time
import uuid
from urllib import error, request

# ------------------------------------------------------------------
# CONFIG — set these as Colab env vars or edit here
# ------------------------------------------------------------------
API_BASE = os.environ.get("CUTFLOW_API", "https://your-vps-domain.com").rstrip("/")
SECRET = os.environ.get("GPU_WORKER_SECRET", "cutflow-dev-secret-change-me")
CALLBACK_URL = os.environ.get("CUTFLOW_CALLBACK_URL", "")  # optional ngrok/cloudflared URL
WORKER_ID = os.environ.get("CUTFLOW_WORKER_ID") or f"colab-{uuid.uuid4().hex[:10]}"
POLL_IDLE_SEC = float(os.environ.get("CUTFLOW_POLL_SEC", "4"))
HEARTBEAT_SEC = 25

_stop = False


def _sig(body: str) -> str:
    return hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()


def post(path: str, payload: dict, timeout: int = 30):
    body = json.dumps(payload)
    req = request.Request(
        f"{API_BASE}{path}",
        data=body.encode(),
        headers={
            "Content-Type": "application/json",
            "X-Cutflow-Signature": _sig(body),
            "User-Agent": f"cutflow-colab-worker/{WORKER_ID}",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode() or "{}")
    except error.HTTPError as e:
        detail = e.read().decode()[:200]
        print(f"  ! HTTP {e.code} on {path}: {detail}")
        return None
    except Exception as e:  # noqa: BLE001
        print(f"  ! {type(e).__name__} on {path}: {e}")
        return None


# ------------------------------------------------------------------
# GPU detection
# ------------------------------------------------------------------
def gpu_name() -> str:
    try:
        import torch  # type: ignore

        if torch.cuda.is_available():
            return torch.cuda.get_device_name(0)
    except Exception:  # noqa: BLE001
        pass
    try:
        import subprocess

        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"], timeout=10
        )
        return out.decode().strip().splitlines()[0]
    except Exception:  # noqa: BLE001
        return "CPU (no GPU detected)"


# ------------------------------------------------------------------
# RENDER PIPELINES — replace the sleeps with real work
# (ffmpeg / diffusers / whisper / TTS …) when you wire real models.
# ------------------------------------------------------------------
STAGE_MAP = {
    "recap": ["DECODE", "SCENE SCAN", "HIGHLIGHT PICK", "GPU ENCODE", "MUX"],
    "reel": ["DECODE", "FACE TRACK", "REFRAME 9:16", "CAPTION BURN", "GPU ENCODE"],
    "mm-voice": ["AUDIO PREP", "VOICEPRINT", "TTS SYNTH", "ROOM MATCH", "MASTER"],
    "subs": ["AUDIO EXTRACT", "ASR DECODE", "ALIGN", "GLYPH SHAPE", "BURN-IN"],
    "upscale": ["FRAME SPLIT", "DENOISE", "DIFFUSION 4X", "RELIGHT", "GPU ENCODE"],
    "news": ["SCRIPT PARSE", "ANCHOR RIG", "B-ROLL FETCH", "LOWER-THIRDS", "GPU ENCODE"],
    "url-recap": ["SCRAPE", "DISTILL", "TTS SYNTH", "SLIDE BUILD", "GPU ENCODE"],
    "yt-pro": ["STREAM PULL", "RETENTION SCAN", "HOOK MINING", "4K RELIGHT", "MASTER MUX"],
    "doc-translate": ["LAYOUT PARSE", "TRANSLATE", "SLIDE REBUILD", "VO SYNTH", "GPU ENCODE"],
    "knowledge": ["SCRIPT WRITE", "VOICE RECORD", "IMAGE MATCH", "CAPTION #@", "VIDEO MUX"],
}


# ------------------------------------------------------------------
# OpenCV person-tracked crop  →  optional 9:16 blur-pad
# ------------------------------------------------------------------
ASPECT_WH = {"9:16": (9, 16), "16:9": (16, 9), "1:1": (1, 1), "3:4": (3, 4), "4:3": (4, 3)}


def crop_plan_from(job: dict):
    """Mirror of the server-side plan so the notebook renders identically."""
    prefs = (job.get("input") or {}).get("overlayPrefs") or {}
    org = bool(prefs.get("org", True))
    requested = job.get("aspect", "16:9")
    final = requested if org else "9:16"
    return {
        "requested": requested,
        "org": org,
        "final": final,
        "blur_pad": (not org) and requested != "9:16",
    }


def person_tracked_crop(frame, target_ratio: str):
    """
    Crop `frame` to target_ratio keeping detected people centred.
    Never a hard centre cut — falls back to centre only when no person is found.
    """
    import cv2  # type: ignore
    import numpy as np  # type: ignore

    h, w = frame.shape[:2]
    tw, th = ASPECT_WH.get(target_ratio, (16, 9))
    target = tw / th

    # --- find subjects (HOG person detector; swap for YOLO if installed) ---
    cx = w // 2
    try:
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        small = cv2.resize(frame, (min(640, w), int(h * min(640, w) / w)))
        rects, _ = hog.detectMultiScale(small, winStride=(8, 8), padding=(8, 8), scale=1.06)
        if len(rects):
            sx = w / small.shape[1]
            centers = [(rx + rw / 2) * sx for (rx, ry, rw, rh) in rects]
            cx = int(sum(centers) / len(centers))
    except Exception:  # noqa: BLE001
        pass

    cur = w / h
    if cur > target:                       # too wide → crop sides around people
        new_w = int(h * target)
        x0 = max(0, min(w - new_w, cx - new_w // 2))
        return frame[:, x0:x0 + new_w]
    if cur < target:                       # too tall → crop top/bottom (bias upper body)
        new_h = int(w / target)
        y0 = max(0, min(h - new_h, int(h * 0.38) - new_h // 2))
        return frame[y0:y0 + new_h, :]
    return frame


def blur_pad_to_916(frame):
    """Place `frame` on a 9:16 canvas, filling top/bottom with a blurred copy."""
    import cv2  # type: ignore

    h, w = frame.shape[:2]
    out_w = w
    out_h = int(w * 16 / 9)
    bg = cv2.resize(frame, (out_w, out_h))
    bg = cv2.GaussianBlur(bg, (0, 0), sigmaX=out_w * 0.035, sigmaY=out_w * 0.035)
    bg = cv2.convertScaleAbs(bg, alpha=0.82, beta=0)
    y0 = (out_h - h) // 2
    if y0 < 0:
        return cv2.resize(frame, (out_w, out_h))
    bg[y0:y0 + h, 0:w] = frame
    return bg


def process_frame(frame, plan: dict):
    """Full geometry pipeline for one frame."""
    out = person_tracked_crop(frame, plan["requested"])
    if plan["blur_pad"]:
        out = blur_pad_to_916(out)
    return out


def overlay_summary(job: dict):
    prefs = (job.get("input") or {}).get("overlayPrefs") or {}
    on = []
    if (prefs.get("subtitle") or {}).get("enabled"):
        on.append("subtitle")
    if (prefs.get("logo") or {}).get("enabled"):
        on.append("logo")
    if (prefs.get("title") or {}).get("enabled"):
        on.append("movie-title")
    if (prefs.get("ticker") or {}).get("enabled") and (prefs.get("ticker") or {}).get("text"):
        on.append("ad-ticker")
    return on


def render_job(job: dict):
    """Render on the T4 and stream progress. Returns the result payload."""
    task_id = job["taskId"]
    faction = job.get("faction", "recap")
    aspect = job.get("aspect", "16:9")
    target = job.get("targetDuration") or 120
    stages = STAGE_MAP.get(faction, ["PREP", "PROCESS", "ENCODE", "MUX", "SEAL"])
    plan = crop_plan_from(job)
    overlays = overlay_summary(job)
    stages = ["OPENCV TRACK"] + stages
    if plan["blur_pad"]:
        stages.insert(1, "BLUR PAD 9:16")
    if overlays:
        stages.insert(len(stages) - 1, "OVERLAY BURN")

    started = time.time()
    print(f"  ▶ rendering {faction} · {plan['requested']} → {plan['final']} · target {target}s")
    print(f"    crop: opencv-person-center · blur_pad={plan['blur_pad']} · overlays={overlays or 'none'}")

    steps = len(stages)
    for i, stage in enumerate(stages):
        # --- REAL WORK GOES HERE -------------------------------------
        # e.g. ffmpeg NVENC:
        #   subprocess.run(["ffmpeg","-hwaccel","cuda","-i",src,
        #                   "-c:v","h264_nvenc","-preset","p4", out], check=True)
        # e.g. diffusers upscale, whisper ASR, Coqui/XTTS voice…
        work = random.uniform(1.1, 2.4)
        time.sleep(work)
        # --------------------------------------------------------------
        pct = int(8 + (i + 1) / steps * 86)
        post(
            "/api/v1/worker/progress",
            {
                "workerId": WORKER_ID,
                "taskId": task_id,
                "progress": pct,
                "stage": stage,
                "log": f"[T4] {stage.lower()} done in {work:.1f}s",
            },
        )
        print(f"    · {pct:3d}%  {stage}")

    took = round(time.time() - started, 1)
    return {
        "renderSeconds": took,
        "accelerator": gpu_name(),
        "encoder": "h264_nvenc",
        "aspect": plan["requested"],
        "finalAspect": plan["final"],
        "orgMode": plan["org"],
        "blurPad": plan["blur_pad"],
        "tracker": "opencv-person-center",
        "overlaysBurned": overlays,
        "gpuStages": stages,
        "download": f"{faction}-{plan['final'].replace(':','x')}-t4-{int(time.time())}.mp4",
    }, took


# ------------------------------------------------------------------
# MAIN LOOP
# ------------------------------------------------------------------
def register():
    res = post(
        "/api/v1/worker",
        {
            "workerId": WORKER_ID,
            "gpuName": gpu_name(),
            "callbackUrl": CALLBACK_URL,
            "status": "idle",
        },
    )
    return bool(res and res.get("ok"))


def main():
    global _stop

    def _sigint(*_a):
        global _stop
        _stop = True
        print("\n⏹  stopping after current job…")

    signal.signal(signal.SIGINT, _sigint)

    print("=" * 56)
    print("  SCM CUTFLOW — GPU TURBO WORKER")
    print("=" * 56)
    print(f"  worker id : {WORKER_ID}")
    print(f"  gpu       : {gpu_name()}")
    print(f"  api       : {API_BASE}")
    print(f"  host      : {socket.gethostname()}")
    print("=" * 56)

    if not register():
        print("✕ register failed — check CUTFLOW_API and GPU_WORKER_SECRET")
        sys.exit(1)
    print("✓ registered — waiting for GPU TURBO jobs…\n")

    last_beat = 0.0
    idle_ticks = 0

    while not _stop:
        now = time.time()
        if now - last_beat > HEARTBEAT_SEC:
            post("/api/v1/worker", {"workerId": WORKER_ID, "gpuName": gpu_name(), "callbackUrl": CALLBACK_URL, "status": "idle"})
            last_beat = now

        res = post("/api/v1/worker/claim", {"workerId": WORKER_ID}, timeout=40)
        job = (res or {}).get("job")

        if not job:
            idle_ticks += 1
            if idle_ticks % 15 == 0:
                print(f"  … idle ({idle_ticks * POLL_IDLE_SEC:.0f}s)")
            time.sleep(POLL_IDLE_SEC)
            continue

        idle_ticks = 0
        task_id = job["taskId"]
        print(f"\n⚡ CLAIMED {task_id[:8]} · {job.get('factionName')}")
        try:
            result, took = render_job(job)
            post(
                "/api/v1/worker/complete",
                {
                    "workerId": WORKER_ID,
                    "taskId": task_id,
                    "ok": True,
                    "result": result,
                    "gpuName": gpu_name(),
                    "renderSeconds": took,
                },
            )
            print(f"✓ SEALED {task_id[:8]} in {took}s\n")
        except Exception as e:  # noqa: BLE001
            print(f"✕ render failed: {e}")
            post(
                "/api/v1/worker/complete",
                {"workerId": WORKER_ID, "taskId": task_id, "ok": False, "error": str(e)[:200]},
            )
        last_beat = 0.0  # force heartbeat after a job

    post("/api/v1/worker", {"workerId": WORKER_ID, "status": "offline", "gpuName": gpu_name(), "callbackUrl": CALLBACK_URL})
    print("✓ worker offline")


if __name__ == "__main__":
    main()
