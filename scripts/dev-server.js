const { execFileSync, spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = process.cwd();
const port = process.env.PORT || "3002";
const maxRestarts = Number(process.env.DEV_SERVER_MAX_RESTARTS ?? "20");
const rootHash = crypto.createHash("sha1").update(root.toLowerCase()).digest("hex").slice(0, 12);
const pidFile = path.resolve(os.tmpdir(), `best-mart-dev-${rootHash}.pid`);

function escapePowerShellSingleQuote(value) {
  return value.replace(/'/g, "''");
}

function readPid(filePath) {
  try {
    const pid = Number(fs.readFileSync(filePath, "utf8").trim());
    return Number.isInteger(pid) && pid > 0 ? pid : undefined;
  } catch {
    return undefined;
  }
}

function stopProcess(pid) {
  if (!pid || pid === process.pid) {
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // The previous dev process may already be gone.
  }
}

function stopPreviousDevServer() {
  stopProcess(readPid(pidFile));
}

function stopStaleNextProcesses() {
  if (process.platform !== "win32") {
    return;
  }

  const script = `
$root = '${escapePowerShellSingleQuote(root)}'
$escapedRoot = [regex]::Escape($root)
Get-CimInstance Win32_Process | Where-Object {
  $_.ProcessId -ne ${process.pid} -and
  $_.CommandLine -and
  $_.CommandLine -match $escapedRoot -and
  $_.CommandLine -match 'next(\\\\|/|\\s|$)'
} | ForEach-Object {
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
`;

  try {
    execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
      stdio: "ignore"
    });
  } catch {
    // If process cleanup fails, Next can still report the actual port/cache error.
  }
}

function assertPathInsideRoot(targetPath) {
  const relativePath = path.relative(root, targetPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to remove unexpected generated path: ${targetPath}`);
  }
}

function removeGeneratedPath(targetPath) {
  assertPathInsideRoot(targetPath);
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function clearProductionBuildOutput() {
  const nextPath = path.resolve(root, ".next");
  const buildIdPath = path.resolve(nextPath, "BUILD_ID");

  if (!fs.existsSync(buildIdPath)) {
    return false;
  }

  removeGeneratedPath(nextPath);
  return true;
}

function clearNextOutput() {
  const nextPath = path.resolve(root, ".next");

  if (!fs.existsSync(nextPath)) {
    return false;
  }

  removeGeneratedPath(nextPath);
  return true;
}

stopPreviousDevServer();
stopStaleNextProcesses();
const keepWarmCache = process.env.KEEP_NEXT_CACHE === "1";
const shouldClearWebpackCache = !keepWarmCache || process.env.CLEAR_NEXT_CACHE === "1";
const clearedProductionOutput = clearProductionBuildOutput();
const clearedForcedOutput = !clearedProductionOutput && shouldClearWebpackCache ? clearNextOutput() : false;

fs.writeFileSync(pidFile, String(process.pid));

if (clearedProductionOutput) {
  console.log("Removed production .next output before starting dev.");
} else if (clearedForcedOutput) {
  console.log("Cleared .next output before starting dev to avoid stale chunk errors.");
} else if (shouldClearWebpackCache) {
  console.log("No .next output existed to clear.");
} else {
  console.log("Keeping warm Next dev cache because KEEP_NEXT_CACHE=1 was set.");
}

console.log(`Starting Next dev server on http://localhost:${port}`);

const nextCli = require.resolve("next/dist/bin/next");
let child;
let restartCount = 0;
let stopping = false;
let pendingColdRestart = false;

function stopChild() {
  stopping = true;

  if (child && !child.killed) {
    child.kill("SIGTERM");
  }
}

function clearPidFile() {
  if (readPid(pidFile) === process.pid) {
    fs.rmSync(pidFile, { force: true });
  }
}

function isStaleNextChunkError(output) {
  return (
    output.includes("Cannot find module './vendor-chunks/") ||
    (output.includes("Cannot find module './") &&
      output.includes(".next") &&
      output.includes("webpack-runtime"))
  );
}

function requestColdRestart(reason) {
  if (pendingColdRestart || stopping) {
    return;
  }

  pendingColdRestart = true;
  console.warn(`${reason} Clearing .next and restarting dev server...`);

  if (child && !child.killed) {
    child.kill("SIGTERM");
  }
}

function attachOutputWatch(stream, writer) {
  stream.on("data", (chunk) => {
    const output = chunk.toString();
    writer.write(chunk);

    if (isStaleNextChunkError(output)) {
      requestColdRestart("Detected stale Next.js chunk cache.");
    }
  });
}

process.on("SIGINT", () => {
  stopChild();
  clearPidFile();
  process.exit(130);
});

process.on("SIGTERM", () => {
  stopChild();
  clearPidFile();
  process.exit(143);
});

function startNextDevServer() {
  pendingColdRestart = false;
  child = spawn(process.execPath, [nextCli, "dev", "-p", port], {
    cwd: root,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  attachOutputWatch(child.stdout, process.stdout);
  attachOutputWatch(child.stderr, process.stderr);

  child.on("exit", (code, signal) => {
    if (pendingColdRestart) {
      if (restartCount >= maxRestarts) {
        clearPidFile();
        process.exit(code ?? 1);
      }

      restartCount += 1;
      clearNextOutput();
      const delay = Math.min(1000 * restartCount, 5000);

      console.warn(`Next dev server restarting with clean cache (${restartCount}/${maxRestarts}) in ${delay}ms...`);
      setTimeout(startNextDevServer, delay);
      return;
    }

    if (stopping || signal) {
      clearPidFile();
      process.exit(0);
    }

    if ((code ?? 0) === 0) {
      console.log("Next dev server exited normally.");
      clearPidFile();
      process.exit(0);
    }

    if (restartCount < maxRestarts) {
      restartCount += 1;
      const delay = Math.min(1000 * restartCount, 5000);
      clearNextOutput();

      console.warn(
        `Next dev server exited with code ${code ?? "unknown"}. Restarting with clean cache (${restartCount}/${maxRestarts}) in ${delay}ms...`
      );
      setTimeout(startNextDevServer, delay);
      return;
    }

    clearPidFile();
    process.exit(code ?? 1);
  });
}

startNextDevServer();
