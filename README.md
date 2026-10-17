# PC Field Lab

A Django-served browser capability dashboard with 21 interactive tests. Sensor processing stays in the browser; there are no accounts, uploads, third-party scripts, or report database.

## Run locally

Requires Python 3.12+.

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python manage.py runserver 127.0.0.1:8000
```

Open http://127.0.0.1:8000. Localhost is a trusted context for browser APIs. Use HTTPS for remote hosting. Camera, microphone, screen sharing, location, and device pickers require individual user actions. Browser/OS support varies; unsupported tests are disabled.

## Features

Keyboard, pointer/touch, webcam, microphone RMS/dBFS, stereo speaker test, display, system hints, battery, connectivity, WebGL capabilities, animation timing, gamepad, screen sharing, file metadata, BLE chooser, serial chooser, USB chooser, and location. External device tests select devices only; they do not implement arbitrary peripheral protocols. Screen sharing is preview-only. A separate Record & listen test explicitly records up to 10 seconds locally; Stop, Delete recording, Reset, or closing the page discards it. Audio is never exported. Microphone values are relative, not calibrated sound pressure measurements.

Report export downloads JSON locally and excludes coordinates, keyboard/pointer data, selected file names, and external device identities. Stop & reset releases resources and clears readings but cannot revoke browser permissions. Individual Stop preserves the last reading for inspection. Tests use no backend data endpoints.

## Architecture

- `config/`: Django settings, routing, and WSGI entry point.
- `lab/views.py`: dashboard rendering.
- `lab/templates/lab/dashboard.html`: accessible responsive interface.
- `lab/static/lab/app.js`: feature registry, lifecycle manager, test adapters, filtering, report export.
- `lab/static/lab/style.css`: self-contained styling; no external assets.

## Checks

```powershell
python manage.py check
python manage.py test
```

## Deployment

The repository includes `render.yaml` for a Render Python web service. It uses Gunicorn and WhiteNoise, disables debug mode, generates a secret key, and accepts Render's assigned hostname. No database is required.

1. Push this project folder (the folder containing `manage.py`) to GitHub.
2. In Render, choose **New > Blueprint** and connect that repository.
3. Review the free web service and deploy. The build runs `bash build.sh`.
4. Open the assigned HTTPS URL after deployment succeeds.

For a manual Render web service, use build command `bash build.sh` and start command `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --access-logfile -`. Set `DJANGO_DEBUG=0` and generate a `DJANGO_SECRET_KEY`. Render supplies `RENDER_EXTERNAL_HOSTNAME`. Set `DJANGO_ALLOWED_HOSTS` to a comma-separated list if you add custom domains. `.env.example` documents variables; it is not loaded automatically.

## Push to GitHub

Create an empty GitHub repository, then run these commands inside this project folder, replacing YOUR-USER and YOUR-REPO:

```powershell
git add .
git commit -m "Add PC Field Lab and Render deployment configuration"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

Only run `git remote add` if `origin` is not configured. Python environments, secrets, generated static files, and caches are ignored. GitHub Actions runs Django checks, tests, and static collection on pushes and pull requests.

## Inspiration

Inspired by [Anand's Mobile Field Lab](https://sanand0.github.io/research/mobile-features/), adapted for desktop testing and guided readiness checks.

## Readiness additions

- Seven display patterns (white, black, RGB, gradient, grid), with optional fullscreen and an exit control. Inspection is manual.
- Microphone sample recording/playback with a 10-second limit, early finish, and deletion controls.
- Toggleable webcam rule-of-thirds framing guide.
- Ten-target mouse accuracy challenge (task performance, not hardware latency).
- Meeting, new laptop, peripherals, and custom checklists with user-confirmed outcomes.
- Expandable explanations for all tests and actionable permission/device error guidance.
- Downloadable text checklist summary, plus checklist observations in the existing JSON report. Nothing is automatically published or sent.

Checklist observations are in-memory only, survive switching presets, and are cleared by Stop & reset all or a page reload. Each preset has its own observations. Clear checklist results clears only the selected preset. No automatic pass/fail claims are made.
