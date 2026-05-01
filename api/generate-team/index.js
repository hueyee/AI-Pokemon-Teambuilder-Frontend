const { proxyBackend } = require("../shared/backend-proxy");

module.exports = async function (context, req) {
  await proxyBackend(context, req, "/api/generate-team");
};
