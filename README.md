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

The app defaults to:

- Backend URL: `https://ai-pokemon-model-backend-bfg2abbtambqb0h0.westus3-01.azurewebsites.net`
- API Key: `key`, sent as `x-api-key`

The browser stores edits to those fields in localStorage. Because this is a static frontend, any key used directly by the browser is visible to users. If the key becomes a real secret, put a small proxy/API layer in front of the model backend rather than shipping the secret in static assets.

For deployment-time configuration, define `window.APP_CONFIG` before `app.js` runs:

```html
<script>
  window.APP_CONFIG = {
    backendUrl: "https://your-backend.example",
    apiKey: "key"
  };
</script>
```

## Backend contract

- `POST /api/generate-team`
- `POST /api/complete-team`

Both use `format: "gen3ou"`, `num_candidates`, and `num_samples`. Completion sends Showdown text from the filled builder slots.

## Azure Static Web Apps

This repo is buildless. Use the repository root as the app location and leave the build output path empty.
