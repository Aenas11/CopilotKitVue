import http from "node:http";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";

const endpoint = "/api/copilotkit";
const port = Number(process.env.RUNTIME_PORT ?? 4000);
const agentUrl = process.env.AGENT_URL ?? "http://localhost:8000/";

const runtime = new CopilotRuntime({
  agents: {
    my_agent: new HttpAgent({
      url: agentUrl,
    }),
  },
});

const serviceAdapter = new ExperimentalEmptyAdapter();

const handler = copilotRuntimeNodeHttpEndpoint({
  runtime,
  serviceAdapter,
  endpoint,
});

const server = http.createServer((req, res) => {
  if (!req.url?.startsWith(endpoint)) {
    res.statusCode = 404;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  Promise.resolve(handler(req, res)).catch((error) => {
    console.error("[runtime] request failed", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Runtime request failed" }));
    }
  });
});

server.listen(port, () => {
  console.log(`[runtime] listening on http://localhost:${port}${endpoint}`);
  console.log(`[runtime] forwarding to agent: ${agentUrl}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
