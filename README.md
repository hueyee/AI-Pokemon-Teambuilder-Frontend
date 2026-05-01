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

- Backend URL on Azure Static Web Apps: the app's own origin, using the included `/api/*` proxy functions
- Backend URL locally: `https://ai-pokemon-model-backend-bfg2abbtambqb0h0.westus3-01.azurewebsites.net`
- API Key: blank in the browser by default. The proxy sends `AI_POKEMON_BACKEND_API_KEY`, `API_KEY`, or the development fallback `key`.

The browser stores edits to those fields in localStorage. Because this is a static frontend, any key used directly by the browser is visible to users. In Azure Static Web Apps, set `AI_POKEMON_BACKEND_API_KEY` as an application setting so the included proxy can keep the real key server-side.

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

## Gen 3 reference data

Autocomplete and stat/type data are generated from Pokemon Showdown's `Dex.mod("gen3")` output and committed in `gen3-data.js`.

To refresh it after downloading or installing Pokemon Showdown:

```bash
SHOWDOWN_DEX_PATH=/path/to/pokemon-showdown/dist/sim/dex node scripts/build-gen3-data.cjs
```

## Azure Static Web Apps

This repo is buildless. Use the repository root as the app location and leave the build output path empty.

The workflow must set `api_location: "api"` so Azure deploys the proxy functions for `/api/generate-team` and
`/api/complete-team`. If `POST /api/complete-team` returns `405` with `Allow: GET, HEAD, OPTIONS`, the functions were
not deployed and Azure is treating `/api/*` as static content.
