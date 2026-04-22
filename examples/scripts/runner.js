const { spawn } = require("child_process");
const path = require("path");

const cmd = process.argv[2];
if (!cmd) {
  console.error("Usage: node runner.js <run-agent|setup-agent>");
  process.exit(1);
}

const scripts = {
  "run-agent": { sh: "run-agent.sh", bat: "run-agent.bat" },
  "setup-agent": { sh: "setup-agent.sh", bat: "setup-agent.bat" },
};

const entry = scripts[cmd];
if (!entry) {
  console.error("Unknown command:", cmd);
  process.exit(1);
}

const scriptDir = __dirname;

if (process.platform === "win32") {
  const scriptPath = path.join(scriptDir, entry.bat);
  const child = spawn(scriptPath, { stdio: "inherit", shell: true });
  child.on("exit", (code) => process.exit(code));
  child.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  const scriptPath = path.join(scriptDir, entry.sh);
  const child = spawn("sh", [scriptPath], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code));
  child.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
}
