# Cross-Repository Data Transfer

This document describes how data moves between these repositories:

- `AI-Pokemon-Teambuilder`: training, Azure ML pipelines, and model artifact publication.
- `inference-service-repo`: HTTP service that loads a Phase 2 serving bundle and runs inference.
- `AI-Pokemon-Teambuilder-Backend`: public API gateway used by the frontend.
- `AI-Pokemon-Teambuilder-Frontend`: browser UI and optional Static Web Apps proxy functions.

Keep a copy of this document in each repo. When a model change affects artifact
layout, request/response fields, SetSpec IDs, or Showdown parsing, update all
copies and the code/tests listed below.

## High-Level Flow

```text
Training repo
  replay/team data -> Phase 1 SetSpec artifacts -> Phase 2 model
  -> phase2_model_bundle in Blob Storage / Azure ML managed artifacts
  -> updates inference service PHASE2_BUNDLE_BLOB_URL

Inference service
  downloads/loads phase2_model_bundle
  exposes /v1/generate-team and /v1/complete-team

Backend
  exposes /api/generate-team and /api/complete-team to the frontend
  validates public API key and request limits
  forwards to the inference service when PHASE2_SERVICE_BASE_URL is set
  can fall back to Azure ML online or batch endpoints

Frontend
  builds generation or completion payloads from the browser UI
  sends them to the backend, directly or through Static Web Apps proxy functions
  renders candidate Showdown text, SetSpec IDs, and rank scores
```

## Repository Responsibilities

| Repo | Owns | Sends | Receives |
| --- | --- | --- | --- |
| `AI-Pokemon-Teambuilder` | Data prep, Phase 1 embeddings, Phase 2 training, serving bundle layout, deployment pipeline | `phase2_model_bundle` and `PHASE2_BUNDLE_BLOB_URL` updates | Replay/team data, Phase 1 inputs |
| `inference-service-repo` | FastAPI inference API, model loading, bundle download/cache, response construction | Candidate team JSON to backend | HTTP requests from backend, bundle files from Blob/local disk |
| `AI-Pokemon-Teambuilder-Backend` | Public API contract, auth, CORS, limits, routing to inference/Azure ML | Inference requests to `/v1/*`; responses/errors to frontend | Browser/API requests from frontend, inference responses |
| `AI-Pokemon-Teambuilder-Frontend` | User-entered team state, Showdown import/export, result rendering, optional proxy | `/api/*` requests to backend | Candidate result JSON, batch status responses |

## Training Repo To Inference Service

The training repo produces a self-contained Phase 2 serving bundle. The current
canonical bundle directory is named `phase2_model_bundle`.

Important files:

- `phase2-generator.pt`: trained Set Transformer checkpoint.
- `phase2-config.json`: canonical model config.
- `phase2_config.json` and `model_config.json`: compatibility aliases.
- `setspec_embeddings.npy`: Phase 1 SetSpec embedding matrix.
- `setspec_index.json`: SetSpec metadata and IDs used at serving time.
- `setspec_index/` or `vector_index/`: optional retrieval index directory.
- `token_maps.json` or `token_registry.json`: token sidecars.
- `decoder_assets/`: copied Phase 1 decoder sidecars.
- `model_metadata.json`: bundle metadata, hashes, architecture, and serving contract.
- `phase2-artifact-manifest.json`, `phase2-version.json`, and `phase1-artifact-hash.txt`: reproducibility metadata.

The training pipeline writes the bundle under a Blob prefix like:

```text
https://<storage-account>.blob.core.windows.net/<container>/models/phase2/<format>/<run_tag>/managed_artifacts/phase2_model_bundle
```

The deployment step points the inference service at this prefix with:

```text
PHASE2_BUNDLE_BLOB_URL=<bundle-prefix-url>
```

For local inference development, use:

```text
PHASE2_BUNDLE_DIR=/path/to/phase2_model_bundle
```

Model changes that affect this transfer:

- Embedding dimension changes must keep `phase2-config.json`, `setspec_embeddings.npy`, and the checkpoint compatible.
- SetSpec ID or ordering changes must publish a matching `setspec_index.json` and embedding matrix together.
- New SetSpec metadata fields can be additive, but removing or renaming fields may break Showdown export, legality checks, or frontend display.
- Changes to the `src.train.phase2` runtime code in the training repo may need to be copied or otherwise synchronized into `inference-service-repo`, which vendors the serving-time modules under `src/`.

Primary code:

- Training bundle creation: `src/pipelines/artifact_registry/register_phase2_model.py`
- Bundle helpers: `src/pipelines/artifact_registry/phase2_artifacts.py`
- Pipeline/deployment guide: `docs/PHASE2_PIPELINE_GUIDE.md`
- Inference bundle resolver: `inference-service-repo/app/artifacts.py`
- Inference runtime: `inference-service-repo/src/train/phase2/inference.py`

## Backend To Inference Service

When the backend has `PHASE2_SERVICE_BASE_URL` configured, it calls the
self-hosted inference service instead of Azure ML. The backend strips the
internal `mode` field and chooses the endpoint by route.

Backend settings:

```text
PHASE2_SERVICE_BASE_URL=https://<inference-service-host>
PHASE2_SERVICE_API_KEY=<optional shared secret sent as x-api-key>
REQUEST_TIMEOUT_SECONDS=120
MAX_NUM_CANDIDATES=20
MAX_NUM_SAMPLES=512
```

Inference service settings:

```text
PHASE2_BUNDLE_DIR=/local/bundle
PHASE2_BUNDLE_BLOB_URL=https://<blob-prefix>/phase2_model_bundle
PHASE2_SERVICE_API_KEY=<optional shared secret expected as x-api-key>
PHASE2_DEVICE=cpu
MAX_NUM_CANDIDATES=20
MAX_NUM_SAMPLES=512
PHASE2_MODEL_CACHE_DIR=/tmp
```

### Generate Request

Backend public route:

```text
POST /api/generate-team
```

Inference service route:

```text
POST /v1/generate-team
```

Request body:

```json
{
  "format": "gen3ou",
  "num_candidates": 10,
  "num_samples": 256
}
```

### Complete Request

Backend public route:

```text
POST /api/complete-team
```

Inference service route:

```text
POST /v1/complete-team
```

Request body using SetSpec IDs:

```json
{
  "format": "gen3ou",
  "set_ids": [50, 28, 42],
  "num_candidates": 10,
  "num_samples": 64
}
```

Request body using Showdown text:

```json
{
  "format": "gen3ou",
  "showdown": "Tyranitar @ Leftovers\nAbility: Sand Stream\nEVs: 252 Atk / 4 Def / 252 Spe\nAdamant Nature\n- Rock Slide",
  "num_candidates": 10,
  "num_samples": 64
}
```

Exactly one of `set_ids` or non-empty `showdown` is allowed. `set_ids` must
contain 1 to 5 IDs.

### Successful Response

The backend passes successful inference responses through to the frontend. Both
generation and completion return the same top-level shape:

```json
{
  "mode": "generate_team",
  "format": "gen3ou",
  "input": {
    "source": "from_scratch",
    "set_ids": []
  },
  "candidate_count": 1,
  "candidates": [
    {
      "set_ids": [50, 28, 42, 77, 91, 103],
      "sets": [
        {
          "set_id": 50,
          "species": "tyranitar",
          "item": "leftovers",
          "ability": "sandstream",
          "nature": "adamant",
          "evs": {"hp": 0, "atk": 252, "def": 4, "spa": 0, "spd": 0, "spe": 252},
          "ivs": {"hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31},
          "moves": ["rockslide", "earthquake", "dragondance", "hiddenpowerflying"],
          "key": "...",
          "legacy_key": "...",
          "generation_eligible": true,
          "generation_exclusion_reasons": []
        }
      ],
      "showdown": "Tyranitar @ Leftovers\n...",
      "rank_score": 0.5,
      "score_components": {
        "rank_score": 0.5,
        "retrieval_score": 0.5,
        "coherence": 0.5,
        "redundancy_penalty": 0.0,
        "coverage": 0.5,
        "novelty": 0.0
      },
      "repair_diagnostics": {
        "strategy": "default",
        "success": true,
        "backtrack_count": 0,
        "candidates_explored": 0,
        "total_score": 0.0,
        "attempts": []
      },
      "generation_diagnostics": {
        "mode": "generate_team",
        "novelty_enabled": false
      },
      "warnings": []
    }
  ],
  "warnings": []
}
```

Fields the frontend currently relies on:

- `candidates`: array of result candidates. Missing or non-array values render as no results.
- `candidate.showdown`: preferred display and copy/load source.
- `candidate.rank_score`: displayed as the candidate score.
- `candidate.set_ids`: displayed as IDs when present.
- `warnings`: displayed as a message after results.

Fields the backend currently validates lightly:

- Response must decode to a JSON object.
- A top-level `error` key in a 2xx response is treated as a failed inference.

For expected errors, inference should return non-2xx JSON:

```json
{
  "error": {
    "code": "invalid_format",
    "message": "Unsupported format: gen9ou",
    "details": {}
  }
}
```

The backend maps non-2xx inference responses into an `azure_ml_error` response
for its public callers. See `AI-Pokemon-Teambuilder-Backend/INFERENCE_SERVICE_CONTRACT.md`
for the detailed backend-to-inference HTTP contract.

Primary code:

- Backend schema: `AI-Pokemon-Teambuilder-Backend/app/schemas.py`
- Backend route handling: `AI-Pokemon-Teambuilder-Backend/app/main.py`
- Backend forwarding: `AI-Pokemon-Teambuilder-Backend/app/azure_client.py`
- Inference API: `inference-service-repo/app/main.py`
- Inference response construction: `inference-service-repo/src/train/phase2/inference.py`

## Frontend To Backend

The frontend builds one of two payloads:

- Generate mode: `{format, num_candidates, num_samples}`
- Complete mode: `{format, num_candidates, num_samples, showdown}`

The browser UI clamps:

- `num_candidates`: 1 to 20, default 10.
- `num_samples`: 1 to 512, default 256 for generation and 64 for completion.

The frontend usually calls:

```text
POST <backendUrl>/api/generate-team
POST <backendUrl>/api/complete-team
GET  <backendUrl>/api/batch-jobs/{job_name}
```

Headers:

```text
content-type: application/json
x-api-key: <BACKEND_API_KEY>
```

When deployed to Azure Static Web Apps, the frontend can use same-origin proxy
functions under `api/`. Those functions forward to:

```text
AI_POKEMON_BACKEND_URL=<backend host>
AI_POKEMON_BACKEND_API_KEY=<backend public API key>
```

If the backend returns `202 Accepted`, the frontend expects:

```json
{
  "job_name": "batch-job-name",
  "status": "Submitted",
  "status_url": "/api/batch-jobs/batch-job-name"
}
```

The frontend polls `status_url` until it receives the normal successful
candidate response.

Primary code:

- UI payload construction and rendering: `AI-Pokemon-Teambuilder-Frontend/app.js`
- Browser request/polling client: `AI-Pokemon-Teambuilder-Frontend/team-client.js`
- Static Web Apps proxy: `AI-Pokemon-Teambuilder-Frontend/api/shared/backend-proxy.js`
- Proxy endpoints: `AI-Pokemon-Teambuilder-Frontend/api/generate-team/index.js`, `AI-Pokemon-Teambuilder-Frontend/api/complete-team/index.js`, and `AI-Pokemon-Teambuilder-Frontend/api/batch-jobs/index.js`

## Azure ML Fallback Path

The backend still supports older Azure ML online and batch paths:

- Online `/score` style endpoints receive the backend `AzurePayload` including `mode`.
- Batch `/jobs` endpoints receive a `request.json` containing the same wire payload.
- Batch calls return `202` to the frontend and require frontend polling through `/api/batch-jobs/{job_name}`.

This path is useful for compatibility, but the current preferred runtime path is:

```text
Frontend -> Backend -> inference-service-repo Container App -> phase2_model_bundle
```

## Compatibility Checklist For Model Changes

Before shipping a model or serving change, check each boundary:

1. Bundle layout
   - `model_metadata.json` exists at or under `phase2_model_bundle`.
   - Checkpoint, config, embeddings, and SetSpec index are from the same run.
   - `setspec_index.json` still maps IDs used by `setspec_embeddings.npy`.

2. Inference service
   - `/health` returns without loading the model.
   - `/startup` loads the bundle and reports the expected `format` and `num_sets`.
   - `/v1/generate-team` and `/v1/complete-team` accept the documented payloads.
   - Errors are non-2xx with top-level `error`.

3. Backend
   - `PHASE2_SERVICE_BASE_URL` points at the intended inference host.
   - `PHASE2_SERVICE_API_KEY` matches the inference service secret when enabled.
   - `MAX_NUM_CANDIDATES`, `MAX_NUM_SAMPLES`, and frontend clamps agree.
   - Tests still cover direct Phase 2 service forwarding and batch fallback.

4. Frontend
   - Candidate results still include `showdown`, `rank_score`, and preferably `set_ids`.
   - Warning messages are still top-level strings.
   - Static Web Apps proxy settings point at the same backend as direct mode.

## Common Breaking Changes

- Renumbering SetSpec IDs without publishing matching embeddings and metadata.
- Changing Showdown export format in a way the frontend parser cannot reload.
- Returning `200` with `{ "error": ... }` instead of a non-2xx status.
- Removing `candidate.showdown`; the frontend falls back to JSON display but load/copy becomes poor.
- Adding a required request field without updating frontend payload construction and backend schemas.
- Raising default sample/candidate counts above backend or inference service caps.
- Updating training runtime behavior without synchronizing vendored serving modules in `inference-service-repo`.

## Where To Update Tests

- Training repo: Phase 2 artifact, inference, and bundle tests under `tests/test_phase2_artifacts.py` and `tests/test_phase2_inference.py`.
- Inference repo: API and schema tests under `tests/test_app.py` and `tests/test_schemas.py`.
- Backend repo: forwarding/config/API tests under `tests/test_azure_client.py`, `tests/test_config.py`, and `tests/test_api.py`.
- Frontend repo: browser client tests under `team-client.test.js`; add UI tests when result rendering changes.
