import fs from 'fs';
import path from 'path';
import {
  getNPMPackageDir,
  getWakaPackage,
  getWakaPackageFile,
  getWakaRoot,
  getWakaRootFile,
  writeWakaPackage,
  writeWakaRoot,
} from '../package';
import type { Dependency, NPMDepType, Package, Root } from '../schema';
import { ROOT_REGISTRY_VERSION } from '../schema';
import { getLatestVersion } from '../npmjs';

async function parseWorkspaceDir(cwd: string, workspace: string | undefined) {
  if ((workspace ?? '') === '') {
    return null;
  }
  const fullPath = path.resolve(path.join(cwd, workspace!));
  if (!fs.existsSync(fullPath)) {
    const dir = await getNPMPackageDir(workspace!, cwd);
    return dir;
  }
  return fullPath;
}

function parsePackageAndVersion(packageName: string): {
  name: string;
  version: string | null;
} {
  if (packageName.lastIndexOf('@') > 0) {
    const name = packageName.substring(0, packageName.lastIndexOf('@'));
    const version = packageName.substring(packageName.lastIndexOf('@') + 1);
    return { name, version };
  }
  return { name: packageName, version: null };
}

function lookupDefaultVersion(
  packageName: string,
  requestedVersion: string,
  wakaRoot: Root
): string {
  let version = wakaRoot.rootDepRegistry[packageName];
  if (!version) {
    console.log('version not found in registry -- looking up in npmjs');
    version = getLatestVersion(
      packageName + '@' + (requestedVersion ?? 'latest')
    );
    if (!version) {
      throw new Error(`Package ${packageName} not found in npmjs registry.`);
    }
  }
  return version;
}

function getDepType(opts: InstallOptions): NPMDepType {
  const { saveDev, savePeer, saveOpt } = opts;
  if (saveDev) {
    return 'devDependencies';
  } else if (savePeer) {
    return 'peerDependencies';
  } else if (saveOpt) {
    return 'optionalDependencies';
  }
  return 'dependencies';
}

export interface InstallOptions {
  workspace?: string;
  saveDev?: boolean;
  savePeer?: boolean;
  saveOpt?: boolean;
  packageName: string;
  noRegister?: boolean;
}
function updatePackage<T extends Package>({
  wakaPackage,
  depType,
  packageName,
  version,
  noRegister,
}: {
  wakaPackage: T;
  depType: NPMDepType;
  packageName: string;
  version: string;
  noRegister: boolean;
}): T {
  if (!wakaPackage[depType]) {
    wakaPackage[depType] = {} as Record<string, Dependency>;
  }
  wakaPackage[depType]![packageName] = noRegister
    ? version
    : ROOT_REGISTRY_VERSION;
  return wakaPackage;
}

export async function installFn(cwd: string, opts: InstallOptions) {
  const { workspace, packageName } = opts;

  let workspaceDir = await parseWorkspaceDir(cwd, workspace);
  const depType = getDepType(opts);
  const wakaRoot = await getWakaRoot(cwd);
  let targetIsRoot = false;
  if (!workspaceDir) {
    targetIsRoot = true;
    workspaceDir = cwd;
  }

  const parsedPackage = parsePackageAndVersion(packageName);
  if (
    wakaRoot.rootDepRegistry[parsedPackage.name] &&
    !opts.noRegister &&
    parsedPackage.version
  ) {
    throw new Error(`Package ${parsedPackage.name} already registered in root. 
Use --no-register to install this different version to this workspace. 
Otherwise, run again without a version to install the root-version`);
  }

  if (!parsedPackage.version) {
    console.log('no version specified -- looking up version');
    parsedPackage.version = lookupDefaultVersion(
      parsedPackage.name,
      parsedPackage.version,
      wakaRoot
    );
  }

  if (!opts.noRegister || wakaRoot.rootDepRegistry[parsedPackage.name]) {
    console.log('registering to root registry');
    wakaRoot.rootDepRegistry[parsedPackage.name] = parsedPackage.version;
  } else {
    console.log('not registering to root registry');
  }
  if (targetIsRoot) {
    console.log('installing to root');
    const newWakaRoot = updatePackage<Root>({
      wakaPackage: wakaRoot,
      depType,
      packageName: parsedPackage.name,
      version: parsedPackage.version,
      noRegister: opts.noRegister ?? false,
    });
    const rootFile = await getWakaRootFile(cwd);
    console.log(`writing to ${rootFile}`);
    await writeWakaRoot(rootFile, newWakaRoot);
  } else {
    console.log('installing to package');
    const wakaPackageFile = await getWakaPackageFile(workspaceDir, {
      ensureExists: true,
    });
    const wakaPackage = await getWakaPackage(workspaceDir);
    const newWakaPackage = updatePackage<Package>({
      wakaPackage,
      depType,
      packageName: parsedPackage.name,
      version: parsedPackage.version,
      noRegister: opts.noRegister ?? false,
    });
    console.log(`writing to ${wakaPackageFile}`);
    await writeWakaPackage(wakaPackageFile, newWakaPackage);
  }
}
