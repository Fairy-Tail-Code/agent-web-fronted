import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const nestedPackagesRoot = path.join(
  projectRoot,
  'node_modules',
  '@copilotkit',
  'react-core',
  'node_modules',
);
const agUiPackagesRoot = path.join(projectRoot, 'node_modules', '@ag-ui');

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function repairPackage(packageDir) {
  const packageJsonPath = path.join(packageDir, 'package.json');
  const raw = await readFile(packageJsonPath, 'utf8');
  const pkg = JSON.parse(raw);
  const devExport = pkg?.exports?.development;

  if (typeof devExport !== 'string' || !devExport.startsWith('./')) {
    return null;
  }

  const devPath = path.join(packageDir, devExport.slice(2));
  if (await exists(devPath)) {
    return null;
  }

  const defaultExport =
    typeof pkg?.exports?.default === 'string' && pkg.exports.default.startsWith('./')
      ? pkg.exports.default
      : typeof pkg?.main === 'string'
        ? pkg.main
        : null;

  if (!defaultExport) {
    return `skip ${pkg.name}: no fallback export`;
  }

  const sourcePath = path.join(packageDir, defaultExport.replace(/^\.\//, ''));
  if (!(await exists(sourcePath))) {
    return `skip ${pkg.name}: missing fallback ${defaultExport}`;
  }

  await mkdir(path.dirname(devPath), { recursive: true });
  await cp(sourcePath, devPath, { force: true });
  return `repaired ${pkg.name}`;
}

async function repairMicromarkPackages() {
  if (!(await exists(nestedPackagesRoot))) {
    return ['skip micromark repair: nested CopilotKit packages not found'];
  }

  const dirents = await readdir(nestedPackagesRoot, {
    withFileTypes: true,
  });

  const results = [];
  for (const dirent of dirents) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const packageDir = path.join(nestedPackagesRoot, dirent.name);
    const packageJsonPath = path.join(packageDir, 'package.json');
    if (!(await exists(packageJsonPath))) {
      continue;
    }

    const result = await repairPackage(packageDir);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

async function repairAgUiPackage(packageDir) {
  const packageJsonPath = path.join(packageDir, 'package.json');
  const raw = await readFile(packageJsonPath, 'utf8');
  const pkg = JSON.parse(raw);

  if (typeof pkg?.main !== 'string' || typeof pkg?.module !== 'string') {
    return null;
  }

  const mainPath = path.join(packageDir, pkg.main.replace(/^\.\//, ''));
  if (await exists(mainPath)) {
    return null;
  }

  const modulePath = path.join(packageDir, pkg.module.replace(/^\.\//, ''));
  if (!(await exists(modulePath))) {
    return `skip ${pkg.name}: missing module fallback ${pkg.module}`;
  }

  pkg.main = pkg.module;
  await mkdir(path.dirname(packageJsonPath), { recursive: true });
  await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return `repaired ${pkg.name} main -> ${pkg.module}`;
}

async function repairAgUiPackages() {
  if (!(await exists(agUiPackagesRoot))) {
    return ['skip @ag-ui repair: packages not found'];
  }

  const dirents = await readdir(agUiPackagesRoot, {
    withFileTypes: true,
  });

  const results = [];
  for (const dirent of dirents) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const packageDir = path.join(agUiPackagesRoot, dirent.name);
    const packageJsonPath = path.join(packageDir, 'package.json');
    if (!(await exists(packageJsonPath))) {
      continue;
    }

    const result = await repairAgUiPackage(packageDir);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

async function main() {
  const results = [
    ...(await repairMicromarkPackages()),
    ...(await repairAgUiPackages()),
  ].filter(result => !result.startsWith('skip '));

  if (results.length === 0) {
    console.log('repair: no missing runtime entries found');
    return;
  }

  for (const result of results) {
    console.log(`repair: ${result}`);
  }
}

await main();
