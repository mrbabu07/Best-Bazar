#!/usr/bin/env node

/**
 * Kill process running on port 3002
 * Usage: node scripts/kill-port.js
 */

const { execSync } = require('child_process');
const port = process.env.PORT || 3002;

console.log(`🔍 Checking for processes on port ${port}...`);

try {
  if (process.platform === 'win32') {
    // Windows
    try {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = result.trim().split('\n');
      
      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(pid);
        }
      });

      if (pids.size === 0) {
        console.log(`✅ No process found on port ${port}`);
        process.exit(0);
      }

      pids.forEach(pid => {
        console.log(`🔪 Killing process ${pid}...`);
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
      });

      console.log(`✅ Successfully killed ${pids.size} process(es) on port ${port}`);
    } catch (err) {
      if (err.message.includes('find any processes')) {
        console.log(`✅ No process found on port ${port}`);
      } else {
        console.log(`✅ Port ${port} is free`);
      }
    }
  } else {
    // Unix-like systems
    try {
      const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      
      if (!pid) {
        console.log(`✅ No process found on port ${port}`);
        process.exit(0);
      }

      console.log(`🔪 Killing process ${pid}...`);
      execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
      console.log(`✅ Successfully killed process on port ${port}`);
    } catch (err) {
      console.log(`✅ Port ${port} is free`);
    }
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
