import fs from 'fs';
import path from 'path';
import { getNPMPackageDir } from './package';
export const cwd = process.cwd();

export function toDirectoryOnly(p: string): string {
  if (fs.lstatSync(p).isDirectory()) {
    return p;
  }
  return path.dirname(p);
}

const terminalFiles = [
  'pnpm-workspace.yaml',
  'pnpm-workspace.yml',
  'pnpm-lock.yaml',
  'pnpm-lock.yml',
];
const semiTerminalFiles = ['package.json', 'node_modules', '.git'];
export function isMonoRepoRoot(dir: string) {
  const containsTerminalValue = terminalFiles.some((file) =>
    fs.existsSync(path.join(dir, file))
  );
  return containsTerminalValue;
}

export function isSubDirOfMonoRepo(dir: string) {
  const containsTerminalValue = semiTerminalFiles.some((file) =>
    fs.existsSync(path.join(dir, file))
  );
  return containsTerminalValue;
}

export function identifyRootDir(
  currntDir = cwd,
  lastProjectDir: string | null = null
) {
  if (isMonoRepoRoot(currntDir)) {
    return currntDir;
  }

  if (currntDir === path.resolve('/')) {
    throw new Error('Could not find root directory of repository');
  }

  if (!isSubDirOfMonoRepo(currntDir) && lastProjectDir) {
    return lastProjectDir;
  }
  return identifyRootDir(path.join(currntDir, '..'), currntDir);
}

export async function parseWorkspaceDir(
  repoRootDir: string,
  packageNameOrRelativePath?: string | undefined | null
) {
  const isSub = isSubDirOfMonoRepo(cwd);
  const isRoot = isMonoRepoRoot(cwd);
  if ((packageNameOrRelativePath ?? '') === '') {
    if (isSub && !isRoot) {
      return cwd;
    }
    return repoRootDir;
  }

  const fullPath = path.resolve(
    path.join(repoRootDir, packageNameOrRelativePath!)
  );
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  if (packageNameOrRelativePath ?? '' !== '') {
    const dir = await getNPMPackageDir(packageNameOrRelativePath!, repoRootDir);
    return dir;
  }
  throw new Error(
    `Could not determine package directory for ${packageNameOrRelativePath} or ${cwd}`
  );
}
// export const rootDir = identifyRootDir();
