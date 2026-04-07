import { spawn } from "node:child_process";

const children = [];
let shuttingDown = false;

function getSpawnConfig(args) {
  if (process.platform === "win32") {
    const shell = process.env.comspec || "cmd.exe";
    return {
      command: shell,
      args: ["/d", "/s", "/c", "npm", ...args],
    };
  }

  return {
    command: "npm",
    args,
  };
}

function stopAll(signal = "SIGTERM") {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function startProcess(args) {
  const spawnConfig = getSpawnConfig(args);
  const child = spawn(spawnConfig.command, spawnConfig.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    shuttingDown = true;
    stopAll();
    console.error(`Failed to start process: ${error.message}`);
    process.exitCode = 1;
  });

  child.on("exit", (code) => {
    if (!shuttingDown) {
      shuttingDown = true;
      stopAll();
      if (typeof code === "number" && code !== 0) {
        process.exitCode = code;
      }
    }
  });

  children.push(child);
}

process.on("SIGINT", () => {
  shuttingDown = true;
  stopAll("SIGINT");
});

process.on("SIGTERM", () => {
  shuttingDown = true;
  stopAll("SIGTERM");
});

console.log("Starting backend on http://localhost:4000");
startProcess(["--prefix", "./backend", "run", "dev"]);

console.log("Starting frontend on http://localhost:5173 and network host 0.0.0.0");
startProcess(["--prefix", "./frontend", "run", "dev", "--", "--host", "0.0.0.0"]);
