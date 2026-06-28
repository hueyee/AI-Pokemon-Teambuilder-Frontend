const { proxyBackend } = require("../shared/backend-proxy");

module.exports = async function (context, req) {
  const jobName = req.params.jobName;
  await proxyBackend(context, req, `/api/batch-jobs/${encodeURIComponent(jobName)}`, { method: "GET" });
};
