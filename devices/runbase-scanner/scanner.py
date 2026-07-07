#!/usr/bin/env python3
"""
CITYRNNG runbase QR scanner.

Runs on a Raspberry Pi at a run's starting point. Reads a runner's personal
QR / fob code and posts it to the site's check-in endpoint. The runner's
presence is the proof — the backend decides whether it lands inside an open
run window and credits the attendance.

Two input modes (set INPUT_MODE in config):
  - hid    : a USB barcode/QR scanner that behaves like a keyboard. It "types"
             the code followed by Enter. We read complete lines from the input
             device (evdev) or, if no device is pinned, from stdin.
  - camera : a USB webcam. Frames are decoded with pyzbar (needs opencv +
             pyzbar + the zbar shared lib).

Resilience:
  - Every scan gets a client-generated scanId, so re-sends are idempotent on
    the server (unique per device). A scan is NEVER lost to a flaky network:
    if the POST fails it's appended to an on-disk buffer and retried by a
    background flusher until it lands.

Feedback:
  - Console line + terminal bell on every result. Optional GPIO buzzer/LED if
    `gpiozero` is available and pins are configured.

Config resolution order (later wins): built-in defaults -> config.ini ->
environment variables (CITYRNNG_*). See config.example.ini.
"""

from __future__ import annotations

import configparser
import json
import os
import queue
import sys
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib import error, request

DEFAULTS = {
    "api_url": "https://staging.cityrunning.online/api/v1",
    "device_key": "",
    "input_mode": "hid",           # hid | camera
    "hid_device": "",              # e.g. /dev/input/by-id/...-event-kbd; empty = stdin
    "camera_index": "0",
    "buffer_path": "/var/lib/cityrnng-scanner/outbox.jsonl",
    "post_timeout_sec": "8",
    "flush_interval_sec": "5",
    "min_code_len": "3",
    "buzzer_pin": "",              # BCM pin for a passive buzzer (optional)
    "led_ok_pin": "",              # BCM pin for a green LED (optional)
    "led_err_pin": "",             # BCM pin for a red LED (optional)
}


def load_config() -> dict:
    cfg = dict(DEFAULTS)
    ini_path = os.environ.get("CITYRNNG_CONFIG", str(Path(__file__).with_name("config.ini")))
    parser = configparser.ConfigParser()
    if parser.read(ini_path) and parser.has_section("scanner"):
        for k in cfg:
            if parser.has_option("scanner", k):
                cfg[k] = parser.get("scanner", k)
    # Env overrides win — handy for systemd EnvironmentFile / secrets.
    for k in cfg:
        env = os.environ.get(f"CITYRNNG_{k.upper()}")
        if env is not None:
            cfg[k] = env
    if not cfg["device_key"]:
        sys.exit("FATAL: device_key is not set (config.ini [scanner] device_key or CITYRNNG_DEVICE_KEY)")
    return cfg


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@dataclass
class Scan:
    code: str
    scanId: str
    scannedAt: str

    def payload(self) -> dict:
        return {"code": self.code, "scanId": self.scanId, "scannedAt": self.scannedAt}


class Feedback:
    """Console + terminal bell, plus optional GPIO buzzer/LED."""

    def __init__(self, cfg: dict):
        self._buzzer = self._led_ok = self._led_err = None
        try:
            if cfg["buzzer_pin"] or cfg["led_ok_pin"] or cfg["led_err_pin"]:
                from gpiozero import LED, Buzzer  # type: ignore

                if cfg["buzzer_pin"]:
                    self._buzzer = Buzzer(int(cfg["buzzer_pin"]))
                if cfg["led_ok_pin"]:
                    self._led_ok = LED(int(cfg["led_ok_pin"]))
                if cfg["led_err_pin"]:
                    self._led_err = LED(int(cfg["led_err_pin"]))
        except Exception as exc:  # noqa: BLE001 — GPIO is best-effort
            print(f"[feedback] GPIO unavailable, console only: {exc}", file=sys.stderr)

    def signal(self, ok: bool, message: str) -> None:
        mark = "OK " if ok else "!! "
        print(f"{mark}{message}\a", flush=True)  # \a = terminal bell
        led = self._led_ok if ok else self._led_err
        try:
            if led is not None:
                led.blink(on_time=0.15, off_time=0.1, n=1 if ok else 3, background=True)
            if self._buzzer is not None:
                self._buzzer.beep(on_time=0.08, off_time=0.05, n=1 if ok else 2, background=True)
        except Exception:  # noqa: BLE001
            pass


class Outbox:
    """Append-only disk buffer so a scan survives a network blip or reboot."""

    def __init__(self, path: str):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def append(self, scan: Scan) -> None:
        with self._lock, self.path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(scan.payload()) + "\n")

    def drain(self) -> list[Scan]:
        with self._lock:
            if not self.path.exists():
                return []
            lines = [ln for ln in self.path.read_text(encoding="utf-8").splitlines() if ln.strip()]
            self.path.write_text("", encoding="utf-8")
        out = []
        for ln in lines:
            try:
                d = json.loads(ln)
                out.append(Scan(d["code"], d["scanId"], d["scannedAt"]))
            except Exception:  # noqa: BLE001 — skip a corrupt line, don't crash
                continue
        return out


class ApiClient:
    def __init__(self, cfg: dict):
        self.url = cfg["api_url"].rstrip("/") + "/integrations/checkin/scan"
        self.key = cfg["device_key"]
        self.timeout = float(cfg["post_timeout_sec"])

    def post(self, scan: Scan) -> tuple[bool, bool, str]:
        """Return (delivered, ok, message).
          delivered=True  → server handled it; safe to drop from the buffer.
          delivered=False → transport error; keep and retry.
          ok              → the run was actually credited (matched/duplicate);
                            drives green vs red feedback."""
        body = json.dumps(scan.payload()).encode("utf-8")
        req = request.Request(self.url, data=body, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("X-Device-Key", self.key)
        # Some edges/WAFs 403 the default urllib UA — identify ourselves.
        req.add_header("User-Agent", "cityrnng-runbase-scanner/1.0")
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                msg = data.get("message", data.get("result", "ok"))
                return True, bool(data.get("ok", False)), msg
        except error.HTTPError as e:
            if e.code == 401:
                return True, False, "device key rejected (401) — check config"
            if 400 <= e.code < 500:
                # Malformed/duplicate — server won't ever accept it; drop it.
                return True, False, f"rejected ({e.code})"
            return False, False, f"server error ({e.code}) — will retry"
        except (error.URLError, TimeoutError, OSError) as e:
            return False, False, f"offline ({e}) — buffered"


class Sender:
    """Owns delivery: try live, buffer on failure, flush in the background."""

    def __init__(self, cfg: dict, api: ApiClient, outbox: Outbox, fb: Feedback):
        self.api, self.outbox, self.fb = api, outbox, fb
        self.flush_interval = float(cfg["flush_interval_sec"])
        self._q: "queue.Queue[Scan]" = queue.Queue()

    def submit(self, scan: Scan) -> None:
        self._q.put(scan)

    def drain_and_wait(self, timeout: float = 10.0) -> None:
        """Block until queued scans are handled (delivered or buffered), so a
        shutdown doesn't drop in-flight scans. Best-effort with a timeout."""
        end = time.time() + timeout
        while self._q.unfinished_tasks and time.time() < end:
            time.sleep(0.1)

    def _deliver(self, scan: Scan) -> None:
        delivered, ok, msg = self.api.post(scan)
        if delivered:
            self.fb.signal(ok, msg)
        else:
            self.outbox.append(scan)
            self.fb.signal(False, msg)

    def run_worker(self) -> None:
        while True:
            scan = self._q.get()
            self._deliver(scan)
            self._q.task_done()

    def run_flusher(self) -> None:
        while True:
            time.sleep(self.flush_interval)
            for scan in self.outbox.drain():
                delivered, _, _ = self.api.post(scan)
                if not delivered:
                    self.outbox.append(scan)  # still down — re-buffer, try later


def read_codes_hid(cfg: dict):
    """Yield codes from a keyboard-like scanner. Uses evdev if a device is
    pinned, else reads newline-delimited lines from stdin."""
    device = cfg["hid_device"].strip()
    if device:
        try:
            from evdev import InputDevice, categorize, ecodes  # type: ignore
        except ImportError:
            sys.exit("hid_device set but python-evdev is not installed (pip install evdev)")
        dev = InputDevice(device)
        dev.grab()  # take exclusive control so codes don't leak to the console
        keymap = _evdev_keymap()
        buf = ""
        for ev in dev.read_loop():
            if ev.type != ecodes.EV_KEY:
                continue
            data = categorize(ev)
            if data.keystate != data.key_down:
                continue
            key = ecodes.KEY[data.scancode]
            if key == "KEY_ENTER":
                if buf:
                    yield buf
                buf = ""
            elif key in keymap:
                buf += keymap[key]
    else:
        for line in sys.stdin:
            code = line.strip()
            if code:
                yield code


def _evdev_keymap() -> dict:
    m = {f"KEY_{c}": c for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"}
    m.update({f"KEY_{d}": d for d in "0123456789"})
    m["KEY_MINUS"] = "-"
    return m


def read_codes_camera(cfg: dict):
    """Yield codes decoded from a USB camera via pyzbar."""
    try:
        import cv2  # type: ignore
        from pyzbar.pyzbar import decode  # type: ignore
    except ImportError:
        sys.exit("camera mode needs opencv-python + pyzbar (and the zbar system lib)")
    cap = cv2.VideoCapture(int(cfg["camera_index"]))
    if not cap.isOpened():
        sys.exit(f"cannot open camera index {cfg['camera_index']}")
    last, last_at = None, 0.0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                time.sleep(0.05)
                continue
            for sym in decode(frame):
                code = sym.data.decode("utf-8", "ignore").strip()
                # Debounce: same code within 3s is the same physical scan.
                if code and not (code == last and time.time() - last_at < 3.0):
                    last, last_at = code, time.time()
                    yield code
            time.sleep(0.03)
    finally:
        cap.release()


def main() -> None:
    cfg = load_config()
    fb = Feedback(cfg)
    sender = Sender(cfg, ApiClient(cfg), Outbox(cfg["buffer_path"]), fb)
    threading.Thread(target=sender.run_worker, daemon=True).start()
    threading.Thread(target=sender.run_flusher, daemon=True).start()

    min_len = int(cfg["min_code_len"])
    reader = read_codes_camera if cfg["input_mode"] == "camera" else read_codes_hid
    print(f"[scanner] up · mode={cfg['input_mode']} · api={cfg['api_url']}", flush=True)
    try:
        for code in reader(cfg):
            if len(code) < min_len:
                fb.signal(False, f"too short, ignored: {code!r}")
                continue
            sender.submit(Scan(code=code, scanId=str(uuid.uuid4()), scannedAt=now_iso()))
    except KeyboardInterrupt:
        print("\n[scanner] bye", flush=True)
    finally:
        sender.drain_and_wait()


if __name__ == "__main__":
    main()
