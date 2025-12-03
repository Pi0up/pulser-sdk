#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// Promisified fs helpers
const readFile = fs.promises.readFile;
const writeFile = fs.promises.writeFile;
const mkdir = fs.promises.mkdir;
const copyFile = fs.promises.copyFile;

function log(message) {
  const t = new Date().toISOString();
  console.log(`[${t}] ${message}`);
}

function fail(message, err) {
  console.error(`ERROR: ${message}` + (err ? `: ${err.message || err}` : ''));
  if (err && err.stack) {
    console.error(err.stack);
  }
  process.exitCode = 1;
}

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

async function main() {
  try {
    // 1) Read version from package.json
    const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    log(`Reading package.json from ${packageJsonPath}`);
    const pkgRaw = await readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(pkgRaw);
    const version = pkg.version;
    if (!version) throw new Error('Version not found in package.json');
    log(`Detected version: ${version}`);

    // 2) Define paths
    const buildMinJs = path.resolve(__dirname, '..', 'build', 'sdk', 'pulser-sdk.min.js');
    const buildMinJsMap = path.resolve(__dirname, '..', 'build', 'sdk', 'pulser-sdk.min.js.map');
    const deployRoot = path.resolve(__dirname, '..', 'deploy', 'cdn');
    const versionTag = `v${version}`;
    const destMin = path.resolve(deployRoot, `pulser-sdk.${versionTag}.min.js`);
    const destMap = path.resolve(deployRoot, `pulser-sdk.${versionTag}.min.js.map`);

    // 3) Ensure deployment directory exists
    await ensureDir(deployRoot);

    // 4) Copy generated files to deployment folder
    log(`Copying ${buildMinJs} to ${destMin}`);
    await copyFile(buildMinJs, destMin);
    log(`Copying ${buildMinJsMap} to ${destMap}`);
    await copyFile(buildMinJsMap, destMap);

    // 5) Simulate upload to CDN
    const cdnBase = 'https://cdn.pulser.uk/pulser-sdk';
    const remoteMinUrl = `${cdnBase}/pulser-sdk.${versionTag}.min.js`;
    const remoteMapUrl = `${cdnBase}/pulser-sdk.${versionTag}.min.js.map`;
    log(`Simulated upload: ${remoteMinUrl}`);
    log(`Simulated upload: ${remoteMapUrl}`);

    // 6) Optional: record upload details
    const uploadsDir = path.resolve(deployRoot, 'uploads');
    await ensureDir(uploadsDir);
    const uploadLogPath = path.resolve(uploadsDir, `upload-${versionTag}.json`);
    const uploadRecord = {
      version: versionTag,
      minJs: {
        local: destMin,
        remote: remoteMinUrl
      },
      map: {
        local: destMap,
        remote: remoteMapUrl
      },
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    await writeFile(uploadLogPath, JSON.stringify(uploadRecord, null, 2), 'utf8');
    log(`Wrote upload record to ${uploadLogPath}`);

    // 7) Update latest.json
    const latestPath = path.resolve(deployRoot, 'latest.json');
    const latestContent = {
      version: versionTag,
      minJsUrl: remoteMinUrl,
      minJsMapUrl: remoteMapUrl,
      deployedAt: new Date().toISOString()
    };
    await writeFile(latestPath, JSON.stringify(latestContent, null, 2), 'utf8');
    log(`Updated latest.json at ${latestPath}`);

    log('Deployment to CDN (simulated) completed successfully.');
  } catch (err) {
    fail('Deployment to CDN failed', err);
  }
}

main();

module.exports = { main };