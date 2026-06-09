const { execFileSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = process.env.PORT || "3002";

function escapePowerShellSingleQuote(value) {
  return value.replace(/'/g, "''");
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

function clearWebpackCache() {
  const cachePath = path.resolve(root, ".next", "cache");

  if (!cachePath.startsWith(root)) {
    throw new Error(`Refusing to remove unexpected cache path: ${cachePath}`);
  }

  fs.rmSync(cachePath, { recursive: true, force: true });
}

stopStaleNextProcesses();
clearWebpackCache();

console.log(`Starting Next dev server on http://localhost:${port}`);

const nextCli = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextCli, "dev", "-p", port], {
  cwd: root,
  env: process.env,
  stdio: "inherit"
});

function stopChild() {
  if (!child.killed) {
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  stopChild();
  process.exit(130);
});

process.on("SIGTERM", () => {
  stopChild();
  process.exit(143);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
  }

  process.exit(code ?? 0);
});
