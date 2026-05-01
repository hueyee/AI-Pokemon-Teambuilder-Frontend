# Gen 3 Pokemon Builder Frontend

Static frontend for the AI Pokemon teambuilder backend.

## Run locally

```bash
python3 -m http.server 3000 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:3000
```

The app runs in demo mode until both fields are set:

- Backend URL, for example `http://127.0.0.1:8000`
- API Key, sent as `x-api-key`

## Backend contract

- `POST /api/generate-team`
- `POST /api/complete-team`

Both use `format: "gen3ou"`, `num_candidates`, and `num_samples`. Completion sends Showdown text from the filled builder slots.

## Azure Static Web Apps

This repo is buildless. Use the repository root as the app location and leave the build output path empty.
