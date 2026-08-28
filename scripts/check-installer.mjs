import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const expectedCommand =
  'irm https://eharness.dev/install.ps1 -OutFile $env:TEMP\\e.ps1; powershell.exe -NoProfile -ExecutionPolicy Bypass -File $env:TEMP\\e.ps1';
const expectedInstallerHash =
  '312dd80b35c2f7e44e2b30557b400e35be8fa7a59096ae82c40904e3e3bc3940';

const [page, installer] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/install.ps1', import.meta.url), 'utf8'),
]);

assert.ok(
  page.includes(`<code id="cmd-text">${expectedCommand}</code>`),
  'The published install command must use Windows PowerShell with ExecutionPolicy Bypass.',
);
assert.doesNotMatch(
  page,
  /\bpwsh\b/i,
  'The site must not require PowerShell 7.',
);
assert.equal(
  installer.split(/\r?\n/, 1)[0],
  '#Requires -Version 5.1',
  'The hosted installer must support built-in Windows PowerShell 5.1.',
);
assert.equal(
  createHash('sha256').update(installer).digest('hex'),
  expectedInstallerHash,
  'The hosted installer must match pjperez/e main.',
);
