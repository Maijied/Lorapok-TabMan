#!/usr/bin/env node
/**
 * scripts/push.mjs
 *
 * Usage:  npm run push [-- "optional commit message"]
 *
 * What it does:
 *  1. Reads current version from public/extension/manifest.json
 *  2. Removes ALL existing lorapok-tabman-*.zip and lorapok-tabman-latest.zip
 *  3. Builds a fresh ZIP from public/extension/ (manifest.json, background.js, icons/, README.md)
 *  4. Also writes lorapok-tabman-latest.zip as a stable alias
 *  5. Stages everything, commits, and pushes to origin/main
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

function readVersion() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'public/extension/manifest.json'), 'utf8')
  );
  return manifest.version;
}

function removeOldZips() {
  const files = fs.readdirSync(ROOT);
  let removed = 0;
  for (const f of files) {
    if (f.match(/^lorapok-tabman.*\.zip$/)) {
      fs.rmSync(path.join(ROOT, f));
      console.log(`  🗑  Removed ${f}`);
      removed++;
    }
  }
  if (removed === 0) console.log('  ℹ  No old ZIPs found.');
}

function buildZip(version) {
  return new Promise((resolve, reject) => {
    const zipName = `lorapok-tabman-${version}.zip`;
    const zipPath = path.join(ROOT, zipName);
    const output = createWriteStream(zipPath);
    const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`  📦 Created ${zipName} (${archive.pointer()} bytes)`);
      fs.copyFileSync(zipPath, path.join(ROOT, 'lorapok-tabman-latest.zip'));
      console.log('  📦 Created lorapok-tabman-latest.zip');
      resolve(zipName);
    });
    archive.on('error', reject);
    archive.pipe(output);

    const extDir = path.join(ROOT, 'public/extension');
    archive.file(path.join(extDir, 'manifest.json'), { name: 'manifest.json' });
    archive.file(path.join(extDir, 'background.js'), { name: 'background.js' });
    archive.directory(path.join(extDir, 'icons'), 'icons');

    const readme = path.join(extDir, 'README.md');
    if (fs.existsSync(readme)) {
      archive.file(readme, { name: 'README.md' });
    }

    archive.finalize();
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Check archiver is available
  try {
    require('archiver');
  } catch {
    console.error('\n❌  "archiver" package not found. Run: npm install --save-dev archiver\n');
    process.exit(1);
  }

  const commitMsg = process.argv[2] || `chore: update extension build`;

  console.log('\n🔧  Lorapok TabMan — local build & push\n');

  // 1. Read version
  const version = readVersion();
  console.log(`  📋 Extension version: ${version}`);

  // 2. Remove old ZIPs
  console.log('\n🗑  Removing old ZIPs...');
  removeOldZips();

  // 3. Build fresh ZIP
  console.log('\n📦  Building extension ZIP...');
  const zipName = await buildZip(version);

  // 4. Stage, commit, push
  console.log('\n🚀  Committing and pushing...');
  run('git add -A');

  // Check if there's anything to commit
  try {
    execSync('git diff --staged --quiet', { cwd: ROOT });
    console.log('  ℹ  Nothing new to commit.');
  } catch {
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
  }

  // Pull remote changes (rebase) before pushing to avoid rejection
  console.log('  ↓  Pulling remote changes (rebase)...');
  run('git pull --rebase origin main');

  run('git push origin main');

  console.log(`\n✅  Done! Pushed with ${zipName} + lorapok-tabman-latest.zip\n`);
}

main().catch((err) => {
  console.error('\n❌  Error:', err.message);
  process.exit(1);
});
