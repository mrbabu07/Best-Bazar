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
const clearedProductionOutput = clearProductionBuildOutput();
const shouldClearWebpackCache = process.env.CLEAR_NEXT_CACHE === "1";
const clearedForcedOutput = !clearedProductionOutput && shouldClearWebpackCache ? clearNextOutput() : false;

fs.writeFileSync(pidFile, String(process.pid));

if (clearedProductionOutput) {
  console.log("Removed production .next output before starting dev.");
} else if (clearedForcedOutput) {
  console.log("Cleared full .next output because CLEAR_NEXT_CACHE=1 was set.");
} else if (shouldClearWebpackCache) {
  console.log("No .next output existed to clear.");
} else {
  console.log("Keeping warm Next dev cache. Set CLEAR_NEXT_CACHE=1 only when you need a clean rebuild.");
}

console.log(`Starting Next dev server on http://localhost:${port}`);

const nextCli = require.resolve("next/dist/bin/next");
let child;
let restartCount = 0;
let stopping = false;

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
  child = spawn(process.execPath, [nextCli, "dev", "-p", port], {
    cwd: root,
    env: process.env,
    stdio: "inherit"
  });

  child.on("exit", (code, signal) => {
    if (stopping || signal) {
      clearPidFile();
      process.exit(0);
    }

    if ((code ?? 0) === 0) {
      clearPidFile();
      process.exit(0);
    }

    if (restartCount < maxRestarts) {
      restartCount += 1;
      const delay = Math.min(1000 * restartCount, 5000);

      console.warn(
        `Next dev server exited with code ${code ?? "unknown"}. Restarting with warm cache (${restartCount}/${maxRestarts}) in ${delay}ms...`
      );
      setTimeout(startNextDevServer, delay);
      return;
    }

    clearPidFile();
    process.exit(code ?? 1);
  });
}

startNextDevServer();
