import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import yaml from 'yaml';
import type {
  NPMDepType,
  Package,
  PackageDetail,
  PackageJsonContents,
  Root,
} from '../schema';
import {
  npmDepTypes,
  packageSchema,
  rootSchema,
  PackageDocument,
  RootDocument,
} from '../schema';
import { isMonoRepoRoot, isSubDirOfMonoRepo } from '../file';
const packageDirToNameCache = new Map<string, string>();
const packageNameToDirCache = new Map<string, string>();
let workspaceDirCache: Record<string, string>;

function toDirectoryOnly(p: string): string {
  if (fs.existsSync(p) === false) {
    throw new Error(`Path ${p} does not exist.`);
  }

  if (fs.lstatSync(p).isDirectory()) {
    return p;
  }
  return path.dirname(p);
}

export function getNPMPackageName(packageJsonFile: string): string {
  const fullPath = path.resolve(packageJsonFile);
  const dir = toDirectoryOnly(fullPath);
  if (packageDirToNameCache.has(dir)) {
    return packageDirToNameCache.get(dir)!;
  }
  const rawData = fs.readFileSync(fullPath, 'utf8');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkgJsonData: Record<string, any> = JSON.parse(rawData) as Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;
  const pkgName = pkgJsonData.name as string;
  packageDirToNameCache.set(dir, pkgName);
  packageNameToDirCache.set(pkgName, dir);
  return pkgName;
}

export async function getWorkspaceDirectories(
  repoRootDir: string
): Promise<Record<string, string>> {
  if (workspaceDirCache && Object.keys(workspaceDirCache).length > 0) {
    return workspaceDirCache;
  }

  const pnpmWorkspaceYaml = path.join(repoRootDir, 'pnpm-workspace.yaml');
  const rootPackageJson = path.join(repoRootDir, 'package.json');
  let workspaceDirs: string[] = [];
  if (fs.existsSync(pnpmWorkspaceYaml)) {
    const rawData = fs.readFileSync(pnpmWorkspaceYaml, 'utf8');
    workspaceDirs = (yaml.parse(rawData) as { packages: string[] }).packages;
  } else if (fs.existsSync(rootPackageJson)) {
    const rawData = fs.readFileSync(rootPackageJson, 'utf8');
    workspaceDirs = (JSON.parse(rawData) as { workspaces: { packages: [] } })
      .workspaces.packages;
  } else {
    throw new Error('No pnpm-workspace.yaml or root package.json found');
  }
  const workspacePackageJsons = workspaceDirs.map(
    (dir) => `${repoRootDir}/${dir}/package.json`
  );
  const foundJsons = await glob(workspacePackageJsons, {
    ignore: '**/node_modules/**',
  });
  const foundDirs = foundJsons
    .map((json) => {
      const dir = path.relative(repoRootDir, path.dirname(json));
      const pkgName = getNPMPackageName(json);
      return { [pkgName]: dir };
    })
    .reduce((acc, p) => {
      return { ...acc, ...p };
    });
  workspaceDirCache = foundDirs;
  const rootName = getNPMPackageName(rootPackageJson);
  workspaceDirCache[rootName] = '';
  return foundDirs;
}

export async function getWorkspaceDirectoryByPackage(
  repoRootDir: string,
  packageName: string
): Promise<string> {
  const workspaces = await getWorkspaceDirectories(repoRootDir);
  const workspace = workspaces[packageName];
  if (!workspace) {
    throw new Error(`Package ${packageName} does not exist.`);
  }
  return workspace;
}

export async function getNPMPackageDir(
  packageName: string,
  repoRootDir: string
): Promise<string> {
  if (packageNameToDirCache.has(packageName)) {
    return packageNameToDirCache.get(packageName)!;
  }
  const packageDirRelative = await getWorkspaceDirectoryByPackage(
    repoRootDir,
    packageName
  );
  const dir = toDirectoryOnly(path.join(repoRootDir, packageDirRelative));
  const packageDir = path.resolve(dir);
  packageNameToDirCache.set(packageName, packageDir);
  packageDirToNameCache.set(packageDir, packageName);
  return packageDir;
}

export async function getAllPackageDirectories(
  repoRootDir: string,
  opts?: { includeRoot: boolean }
) {
  const packageDirs = Object.values(await getWorkspaceDirectories(repoRootDir));
  if (opts?.includeRoot === false) {
    return packageDirs.filter((p) => p !== '' && p !== '.' && p !== './');
  }
  return packageDirs;
}

async function getPackageFile(
  filename: string,
  packageDir: string,
  opts?: { ensureExists?: boolean }
): Promise<string> {
  const f = path.join(packageDir, filename);
  if (opts?.ensureExists && !fs.existsSync(f)) {
    throw new Error(`File ${f} does not exist.`);
  }
  return Promise.resolve(f);
}

export async function getWakaPackageFile(
  packageDir: string,
  opts?: { ensureExists?: boolean }
): Promise<string> {
  packageDir = toDirectoryOnly(packageDir);
  return getPackageFile('waka-package.yaml', packageDir, opts);
}

export async function getNPMPackageFile(
  packageDir: string,
  opts?: { ensureExists?: boolean }
): Promise<string> {
  packageDir = toDirectoryOnly(packageDir);
  return getPackageFile('package.json', packageDir, opts);
}

export function getWakaRootFile(
  repoRootDir: string,
  opts?: { ensureExists?: boolean }
): Promise<string> {
  const rootFile = path.join(repoRootDir, 'waka-root.yaml');
  if (opts?.ensureExists && !fs.existsSync(rootFile)) {
    throw new Error(`File ${rootFile} does not exist.`);
  }
  return Promise.resolve(rootFile);
}

export async function getWakaPackageFiles(
  repoRootDir: string,
  opts?: { ensureExists?: boolean; includeRoot?: boolean }
) {
  const packageDirs = await getAllPackageDirectories(repoRootDir, {
    includeRoot: false,
  });
  const pkgFilePromises = packageDirs.map(async (p) => {
    const f = await getWakaPackageFile(path.join(repoRootDir, p), opts);
    return f;
  });
  const allPackageFiles = await Promise.all(pkgFilePromises);
  if (opts?.includeRoot) {
    const rootFile = await getWakaRootFile(repoRootDir, {
      ensureExists: opts?.ensureExists,
    });
    allPackageFiles.push(rootFile);
  }
  return allPackageFiles.filter((f) => !!f);
}

export async function getNPMPackageFiles(
  repoRootDir: string,
  opts?: { ensureExists?: boolean; includeRoot?: boolean }
) {
  const packageDirs = await getAllPackageDirectories(repoRootDir, {
    includeRoot: opts?.includeRoot ?? false,
  });
  const pkgFilePromises = packageDirs.map(async (p) => {
    const f = await getNPMPackageFile(path.join(repoRootDir, p), opts);
    return f;
  });
  return (await Promise.all(pkgFilePromises)).filter((f) => !!f);
}

export async function getNPMPackageJsonContents(packageDir: string) {
  packageDir = toDirectoryOnly(packageDir);
  const fullPath = await getNPMPackageFile(packageDir, { ensureExists: true });
  const rawData = fs.readFileSync(fullPath, 'utf8');

  const pkgJsonData: PackageJsonContents = JSON.parse(
    rawData
  ) as PackageJsonContents;
  return pkgJsonData;
}

export function getRootNPMPackageFile(
  repoRootDir: string,
  opts?: { ensureExists: boolean }
): Promise<string> {
  const rootFile = path.join(repoRootDir, 'package.json');
  if (opts?.ensureExists && !fs.existsSync(rootFile)) {
    throw new Error(`File ${rootFile} does not exist.`);
  }
  return Promise.resolve(rootFile);
}

async function getRawWakaRootYamlData(repoRootDir: string): Promise<string> {
  const rootFile = await getWakaRootFile(repoRootDir, { ensureExists: true });
  const rawData = fs.readFileSync(rootFile, 'utf8');
  return rawData;
}
export async function getWakaRoot(repoRootDir: string): Promise<Root> {
  const rawData = await getRawWakaRootYamlData(repoRootDir);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const root = yaml.parse(rawData);
  const rootParsed = rootSchema.parse(root);
  return rootParsed;
}

export async function getWakaRootDocument(
  repoRootDir: string
): Promise<RootDocument> {
  const rawData = await getRawWakaRootYamlData(repoRootDir);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const root = yaml.parse(rawData);
  // still parse for validation purposes
  rootSchema.parse(root);
  const doc = yaml.parseDocument(rawData);
  const rootParsed = RootDocument.instanceFromDocument(doc);
  return rootParsed;
}

export async function getRawWakaPackageYamlData(
  packageDirectory: string
): Promise<string> {
  const packageDir = toDirectoryOnly(packageDirectory);
  const wakaPackageFile = await getWakaPackageFile(packageDir, {
    ensureExists: true,
  });
  const rawData = fs.readFileSync(wakaPackageFile, 'utf8');
  return rawData;
}
export async function getWakaPackage(
  packageDirectory: string
): Promise<Package> {
  const rawData = await getRawWakaPackageYamlData(packageDirectory);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const pkg = yaml.parse(rawData);
  const pkgParsed = packageSchema.parse(pkg);
  return pkgParsed;
}

export async function getWakaPackageDocument(
  packageDirectory: string
): Promise<PackageDocument> {
  const rawData = await getRawWakaPackageYamlData(packageDirectory);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const pkg = yaml.parse(rawData);
  // still parse for validation purposes
  packageSchema.parse(pkg);
  const doc = yaml.parseDocument(rawData);
  return PackageDocument.instanceFromDocument(doc);
}

async function getWakaPackagesInFormat<T = Package | PackageDocument>(
  repoRootDir: string,
  format: (filename: string) => Promise<T>
): Promise<Record<string, T>> {
  const packageFiles = await getWakaPackageFiles(repoRootDir, {
    ensureExists: true,
  });
  return (
    await Promise.all<Record<string, T>>(
      packageFiles.map(async (p) => {
        const packageDir = path.dirname(p);
        const packageJsonFile = await getNPMPackageFile(packageDir, {
          ensureExists: true,
        });
        const packageName = getNPMPackageName(packageJsonFile);
        const pkgParsed: T = await format(p);
        return { [packageName]: pkgParsed };
      })
    )
  ).reduce((acc, p) => {
    return { ...acc, ...p };
  }, {});
}

export async function getWakaPackages(
  repoRootDir: string
): Promise<Record<string, Package>> {
  return getWakaPackagesInFormat(repoRootDir, getWakaPackage);
}

export async function getWakaPackageDocuments(
  repoRootDir: string
): Promise<Record<string, PackageDocument>> {
  return getWakaPackagesInFormat(repoRootDir, getWakaPackageDocument);
}

export async function getNPMPackageDetails(
  repoRootDir: string,
  opts?: { includeRoot: boolean }
) {
  let pkgJsons = await getNPMPackageFiles(repoRootDir, {
    ensureExists: true,
    includeRoot: false,
  });
  if (opts?.includeRoot) {
    const rootPkgJson = await getRootNPMPackageFile(repoRootDir, {
      ensureExists: true,
    });
    pkgJsons = [...pkgJsons, rootPkgJson];
  }
  const details: PackageDetail[] = [];
  for (const p of pkgJsons) {
    const pkgJsonData = await getNPMPackageJsonContents(p);
    npmDepTypes.forEach((depType: NPMDepType) => {
      const deps = pkgJsonData[depType];
      if (deps) {
        Object.keys(deps).forEach((depName) => {
          details.push({
            name: depName,
            version: deps[depName]!,
            type: depType,
            packagePath: p,
            packageName: getNPMPackageName(p),
          });
        });
      }
    });
  }
  return details;
}

export function getDetailKey(
  detail: PackageDetail,
  mapBy: (keyof PackageDetail)[] = ['name']
) {
  return mapBy.map((mapByKey) => detail[mapByKey]).join('|');
}

export function mapNPMPackageDetails(
  details: PackageDetail[],
  mapBy: (keyof PackageDetail)[] = ['name']
): Record<string, PackageDetail[]> {
  const m = details.reduce(
    (acc, pkgDetail) => {
      const fullKey = getDetailKey(pkgDetail, mapBy);
      if (!acc[fullKey]) {
        acc[fullKey] = [];
      }
      acc[fullKey]!.push(pkgDetail);
      return acc;
    },
    {} as Record<string, PackageDetail[]>
  );
  return m;
}

export async function parseWorkspaceDir(
  repoRootDir: string,
  currentDir: string,
  packageNameOrRelativePath?: string | undefined | null
) {
  const isSub = isSubDirOfMonoRepo(currentDir);
  const isRoot = isMonoRepoRoot(currentDir);
  if ((packageNameOrRelativePath ?? '') === '') {
    if (isSub && !isRoot) {
      return currentDir;
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
    `Could not determine package directory for ${packageNameOrRelativePath} or ${currentDir}`
  );
}
