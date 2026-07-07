# Runbase QR scanner (Raspberry Pi)

Reads a runner's personal QR / fob at the starting point and posts it to the
CITYRNNG check-in endpoint. Presence = proof: the backend decides if the scan
falls inside an open run window and credits the attendance + points.

This folder is **not** part of the pnpm/Turborepo build — it's a standalone
Python app deployed to a Pi.

## How it fits together

```
runner QR/fob ──▶ USB scanner (or camera) ──▶ scanner.py ──▶ POST /api/v1/integrations/checkin/scan
                                                   │                     (X-Device-Key: csk_…)
                                                   └─ offline? buffer to disk, retry later
```

- Each scan carries a client-generated `scanId`, so re-sends are idempotent on
  the server (a run is never double-credited, and a network blip never loses a
  scan — it's buffered to disk and flushed when the link is back).
- The device authenticates with a **device key** issued in the admin panel.

## 1. Create the device + key

In the site: **Admin → Сканеры → Новый сканер**. Pick the starting point,
name it, create. Copy the key (`csk_…`) shown **once**.

## 2. Install on the Pi

```bash
sudo mkdir -p /opt/cityrnng-scanner
sudo cp scanner.py config.example.ini /opt/cityrnng-scanner/
cd /opt/cityrnng-scanner
sudo cp config.example.ini config.ini      # edit api_url + input mode

# Keep the key out of config.ini:
echo 'CITYRNNG_DEVICE_KEY=csk_your_key_here' | sudo tee /etc/cityrnng-scanner.env
sudo chmod 600 /etc/cityrnng-scanner.env
```

Input-mode extras (only what you use):

```bash
# HID scanner pinned to a device (recommended):
sudo apt install python3-evdev
#   then set hid_device in config.ini, e.g.
#   ls -l /dev/input/by-id/   → *-event-kbd

# Camera mode:
sudo apt install libzbar0
pip3 install opencv-python-headless pyzbar

# Optional buzzer/LED feedback:
pip3 install gpiozero
```

## 3. Run it

Quick manual test (HID scanner typing into the terminal, or just type a code):

```bash
CITYRNNG_DEVICE_KEY=csk_… python3 scanner.py
# scan a QR → prints "OK Отметили — пробежка засчитана" / "!! Код не распознан"
```

As a service:

```bash
sudo cp runbase-scanner.service /etc/systemd/system/
sudo systemctl enable --now runbase-scanner
journalctl -u runbase-scanner -f
```

## Configuration

All keys live in `config.ini` `[scanner]` (see `config.example.ini`) and can be
overridden by `CITYRNNG_<UPPERCASE_KEY>` env vars. Key ones:

| key | meaning |
|-----|---------|
| `api_url` | site API base, no trailing `/scan` |
| `device_key` | `csk_…` from the admin panel (prefer the env var) |
| `input_mode` | `hid` (keyboard-like scanner) or `camera` (webcam) |
| `hid_device` | pinned `/dev/input/by-id/…-event-kbd`; empty = stdin |
| `buffer_path` | on-disk outbox for scans made while offline |

## Server responses

`POST /integrations/checkin/scan` returns `{ result, ok, idempotent, message }`.
`result` is one of: `matched`, `duplicate`, `no_window`, `unknown_code`,
`error`. The scanner beeps/flashes green on `matched`/`duplicate`, red
otherwise, and prints `message` to the log.

## Troubleshooting

- **`device key rejected (401)`** — key wrong, or the device is disabled in the
  admin panel. Re-issue with "ключ" (rotate) and update the env file.
- **`no_window`** — the scan is outside any points-eligible run window at this
  device's location. Check the recurrence schedule and the device's location.
- **codes leak to the console** — set `hid_device` so the scanner input is
  grabbed exclusively (evdev), instead of the stdin fallback.
