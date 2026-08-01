import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');

function parseVersion(value) {
  return String(value).replace(/^v/, '').split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function supportsVite8(version) {
  const [major, minor] = parseVersion(version);
  if (major > 22) return true;
  if (major === 22) return minor >= 12;
  if (major === 20) return minor >= 19;
  return false;
}

const problems = [];
if (!supportsVite8(process.version)) {
  problems.push(`Node ${process.version} is unsupported. Install Node 20.19+, 22.12+, or a newer release.`);
}

for (const relativePath of [
  'server/index.mjs',
  'src/main.jsx',
  'node_modules/vite/bin/vite.js',
  'node_modules/react/package.json',
  'node_modules/@tailwindcss/vite/package.json',
]) {
  try {
    await access(path.join(projectDirectory, relativePath));
  } catch {
    problems.push(`Missing ${relativePath}${relativePath.startsWith('node_modules/') ? ' — run npm install.' : '.'}`);
  }
}

const dataSetting = process.env.DATA_FILE || './server/data.json';
const dataPath = path.isAbsolute(dataSetting) ? dataSetting : path.resolve(projectDirectory, dataSetting);
try {
  await mkdir(path.dirname(dataPath), { recursive: true });
} catch (error) {
  problems.push(`Cannot create the data directory: ${error.message}`);
}

if (problems.length) {
  console.error('\nPawLink startup check failed:\n');
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(`PawLink checks passed with ${process.version}.`);
