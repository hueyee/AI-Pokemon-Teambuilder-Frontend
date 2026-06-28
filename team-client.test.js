import test from "node:test";
import assert from "node:assert/strict";
import { BATCH_POLL_INTERVAL_MS, requestTeam } from "./team-client.js";

test("returns immediate 200 generate-team success", async () => {
  const calls = [];
  const payload = { format: "gen3ou" };
  const success = generatedTeam();
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    return jsonResponse(200, success);
  };

  const data = await requestTeam({
    backendUrl: "https://backend.example",
    endpoint: "/api/generate-team",
    payload,
    apiKey: "secret",
    fetchFn,
  });

  assert.equal(data, success);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://backend.example/api/generate-team");
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(calls[0].options.headers, {
    "content-type": "application/json",
    "x-api-key": "secret",
  });
  assert.equal(calls[0].options.body, JSON.stringify(payload));
});

test("polls initial 202 until polling 200 returns generated-team payload", async () => {
  const calls = [];
  const waits = [];
  const progress = [];
  const success = generatedTeam();
  const responses = [
    jsonResponse(202, {
      job_name: "batchjob-1",
      status: "Submitted",
      status_url: "/api/batch-jobs/batchjob-1",
    }),
    jsonResponse(202, {
      job_name: "batchjob-1",
      status: "Running",
    }),
    jsonResponse(200, success),
  ];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    return responses.shift();
  };

  const data = await requestTeam({
    backendUrl: "https://backend.example/",
    endpoint: "/api/generate-team",
    payload: { format: "gen3ou" },
    apiKey: "secret",
    fetchFn,
    wait: async (ms) => waits.push(ms),
    onProgress: (status) => progress.push(status),
  });

  assert.equal(data, success);
  assert.deepEqual(progress, ["Submitted", "Running"]);
  assert.deepEqual(waits, [BATCH_POLL_INTERVAL_MS, BATCH_POLL_INTERVAL_MS]);
  assert.equal(calls.length, 3);
  assert.equal(calls[1].url, "https://backend.example/api/batch-jobs/batchjob-1");
  assert.equal(calls[1].options.method, "GET");
  assert.deepEqual(calls[1].options.headers, calls[0].options.headers);
  assert.equal(calls[2].url, "https://backend.example/api/batch-jobs/batchjob-1");
});

test("uses the existing error message path for polling errors", async () => {
  const responses = [
    jsonResponse(202, {
      job_name: "batchjob-2",
      status: "Submitted",
      status_url: "/api/batch-jobs/batchjob-2",
    }),
    jsonResponse(500, {
      error: {
        message: "Backend sad",
      },
    }),
  ];

  await assert.rejects(
    requestTeam({
      backendUrl: "https://backend.example",
      endpoint: "/api/generate-team",
      payload: { format: "gen3ou" },
      fetchFn: async () => responses.shift(),
      wait: async () => {},
    }),
    /Backend sad/,
  );
});

test("aborting during polling wait stops before the next poll", async () => {
  const controller = new AbortController();
  const calls = [];
  let waitStarted;
  const waitStartedPromise = new Promise((resolve) => {
    waitStarted = resolve;
  });

  const promise = requestTeam({
    backendUrl: "https://backend.example",
    endpoint: "/api/generate-team",
    payload: { format: "gen3ou" },
    signal: controller.signal,
    fetchFn: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse(202, {
        job_name: "batchjob-3",
        status: "Submitted",
        status_url: "/api/batch-jobs/batchjob-3",
      });
    },
    wait: (_ms, signal) => {
      waitStarted();
      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(abortError()), { once: true });
      });
    },
  });

  await waitStartedPromise;
  controller.abort();

  await assert.rejects(promise, { name: "AbortError" });
  assert.equal(calls.length, 1);
});

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

function generatedTeam() {
  return {
    mode: "generate_team",
    format: "gen3ou",
    candidate_count: 1,
    candidates: [
      {
        showdown: "Tyranitar @ Leftovers",
        rank_score: 1,
      },
    ],
  };
}

function abortError() {
  return new DOMException("Aborted", "AbortError");
}
