export const BATCH_POLL_INTERVAL_MS = 5000;
export const BATCH_TIMEOUT_MS = 10 * 60 * 1000;

export async function requestTeam({
  backendUrl,
  endpoint,
  payload,
  apiKey = "",
  signal,
  onProgress = () => {},
  fetchFn = fetch,
  wait = delay,
  now = () => Date.now(),
  pollIntervalMs = BATCH_POLL_INTERVAL_MS,
  timeoutMs = BATCH_TIMEOUT_MS,
}) {
  const headers = buildHeaders(apiKey);
  const response = await fetchFn(buildBackendUrl(backendUrl, endpoint), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });
  const data = await parseJson(response);

  if (response.status === 202) {
    if (!data.status_url) throw new Error("Batch job did not include a status URL.");
    if (data.status) onProgress(data.status);
    return pollBatchJob({
      backendUrl,
      statusUrl: data.status_url,
      headers,
      signal,
      onProgress,
      fetchFn,
      wait,
      now,
      pollIntervalMs,
      timeoutMs,
    });
  }

  if (!response.ok) throw responseError(response, data);
  return data;
}

async function pollBatchJob({
  backendUrl,
  statusUrl,
  headers,
  signal,
  onProgress,
  fetchFn,
  wait,
  now,
  pollIntervalMs,
  timeoutMs,
}) {
  const startedAt = now();
  const url = buildBackendUrl(backendUrl, statusUrl);

  while (true) {
    throwIfAborted(signal);
    const remainingMs = timeoutMs - (now() - startedAt);
    if (remainingMs <= 0) throw new Error("Team generation is still running after 10 minutes. You can retry.");

    await wait(Math.min(pollIntervalMs, remainingMs), signal);
    throwIfAborted(signal);
    if (now() - startedAt >= timeoutMs) {
      throw new Error("Team generation is still running after 10 minutes. You can retry.");
    }

    const response = await fetchFn(url, {
      method: "GET",
      headers,
      signal,
    });
    const data = await parseJson(response);

    if (response.status === 202) {
      if (data.status) onProgress(data.status);
      continue;
    }

    if (!response.ok) throw responseError(response, data);
    return data;
  }
}

function buildHeaders(apiKey) {
  const headers = {
    "content-type": "application/json",
  };
  if (apiKey) headers["x-api-key"] = apiKey;
  return headers;
}

function buildBackendUrl(backendUrl, path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${backendUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

function responseError(response, data) {
  const message = data?.detail?.message || data?.error?.message || `Request failed with ${response.status}`;
  return new Error(message);
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

function abortError() {
  if (typeof DOMException !== "undefined") return new DOMException("Aborted", "AbortError");
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}
