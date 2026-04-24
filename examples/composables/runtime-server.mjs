import http from "node:http";
import {
  CopilotSseRuntime,
  createCopilotRuntimeHandler,
} from "./node_modules/@copilotkit/runtime/dist/v2/index.mjs";
import { createCopilotNodeHandler } from "./node_modules/@copilotkit/runtime/dist/v2/node.mjs";
import { HttpAgent } from "@ag-ui/client";
import { TranscriptionServiceOpenAI } from "@copilotkit/voice";
import OpenAI from "openai";

const endpoint = "/api/copilotkit";
const port = Number(process.env.RUNTIME_PORT ?? 4000);
const agentUrl = process.env.AGENT_URL ?? "http://localhost:8000/";
const openAIApiKey = process.env.OPENAI_API_KEY?.trim();

/**
 * Mirrors React examples runtime behavior: configure a transcription service
 * when OPENAI_API_KEY is available; otherwise /transcribe returns 503.
 */
const transcriptionService = openAIApiKey
  ? new TranscriptionServiceOpenAI({
      openai: new OpenAI({ apiKey: openAIApiKey }),
    })
  : undefined;

const runtime = new CopilotSseRuntime({
  agents: {
    my_agent: new HttpAgent({
      url: agentUrl,
    }),
  },
  transcriptionService,
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: endpoint,
  cors: true,
});

const nodeHandler = createCopilotNodeHandler(handler);

const server = http.createServer((req, res) => {
  if (!req.url?.startsWith(endpoint)) {
    res.statusCode = 404;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  Promise.resolve(nodeHandler(req, res)).catch((error) => {
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
  if (transcriptionService) {
    console.log("[runtime] transcription: enabled (OpenAI whisper-1)");
  } else {
    console.log(
      "[runtime] transcription: disabled (set OPENAI_API_KEY to enable /transcribe)",
    );
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
