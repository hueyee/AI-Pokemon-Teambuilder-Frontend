const https = require("https");

const DEFAULT_BACKEND_URL = "https://ai-pokemon-model-backend-bfg2abbtambqb0h0.westus3-01.azurewebsites.net";
const REQUEST_TIMEOUT_MS = 120000;

function proxyBackend(context, req, endpoint) {
  const backendUrl = (process.env.AI_POKEMON_BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, "");
  const apiKey = process.env.AI_POKEMON_BACKEND_API_KEY || process.env.API_KEY || req.headers["x-api-key"] || "key";
  const body = typeof req.rawBody === "string" ? req.rawBody : JSON.stringify(req.body || {});
  const target = new URL(`${backendUrl}${endpoint}`);

  const options = {
    method: "POST",
    hostname: target.hostname,
    path: `${target.pathname}${target.search}`,
    port: target.port || 443,
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
      "x-api-key": apiKey,
    },
    timeout: REQUEST_TIMEOUT_MS,
  };

  return new Promise((resolve) => {
    const outbound = https.request(options, (upstream) => {
      const chunks = [];

      upstream.on("data", (chunk) => chunks.push(chunk));
      upstream.on("end", () => {
        const status = upstream.statusCode || 502;
        const responseBody = Buffer.concat(chunks).toString("utf8");
        const body =
          responseBody ||
          JSON.stringify({
            error: {
              message: `Backend returned ${status} for ${endpoint}. Check AI_POKEMON_BACKEND_URL and deployed backend routes.`,
            },
          });

        context.res = {
          status,
          headers: {
            "content-type": responseBody ? upstream.headers["content-type"] || "application/json" : "application/json",
          },
          body,
        };
        resolve();
      });
    });

    outbound.on("timeout", () => {
      outbound.destroy(new Error("Backend request timed out."));
    });

    outbound.on("error", (error) => {
      context.res = {
        status: 502,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          error: {
            message: error.message || "Backend proxy request failed.",
          },
        }),
      };
      resolve();
    });

    outbound.write(body);
    outbound.end();
  });
}

module.exports = {
  proxyBackend,
};
