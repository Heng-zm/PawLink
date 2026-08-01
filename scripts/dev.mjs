import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const serverEntry = path.join(projectDirectory, 'server', 'index.mjs');
const viteEntry = path.join(
  projectDirectory,
  'node_modules',
  'vite',
  'bin',
  'vite.js',
);

const processes = [
  {
    name: 'API',
    child: spawn(process.execPath, ['--watch', serverEntry], {
      cwd: projectDirectory,
      stdio: 'inherit',
      windowsHide: true,
    }),
  },
  {
    name: 'Web',
    child: spawn(process.execPath, [viteEntry], {
      cwd: projectDirectory,
      stdio: 'inherit',
      windowsHide: true,
    }),
  },
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const { child } of processes) {
    if (!child.killed && child.exitCode === null) {
      child.kill();
    }
  }

  process.exitCode = exitCode;
}

for (const { name, child } of processes) {
  child.on('error', (error) => {
    console.error(`\n${name} process failed to start:`, error.message);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`\n${name} process stopped${signal ? ` from ${signal}` : ` with code ${code ?? 0}`}.`);
      shutdown(code === 0 ? 1 : (code ?? 1));
    }
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
