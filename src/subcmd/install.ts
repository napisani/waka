import {
  getWakaPackage,
  getWakaPackageFile,
  getWakaRoot,
  getWakaRootFile,
  parseWorkspaceDir,
  writeWakaPackage,
  writeWakaRoot,
} from '../package';
import type { Dependency, NPMDepType, Package, Root } from '../schema';
import { ROOT_REGISTRY_VERSION } from '../schema';
import { getLatestVersion } from '../npmjs';
import { cwd, isMonoRepoRoot } from '../file';

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
  requestedVersion: string | null,
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
  wakaRoot,
  wakaPackage,
  depType,
  packageName,
  version,
  noRegister,
}: {
  wakaRoot: Root;
  wakaPackage: T;
  depType: NPMDepType;
  packageName: string;
  version: string;
  noRegister: boolean;
}): { wakaRoot: Root; wakaPackage: T } {
  if (!wakaPackage[depType]) {
    wakaPackage[depType] = {} as Record<string, Dependency>;
  }
  if (!noRegister) {
    wakaPackage[depType]![packageName] = ROOT_REGISTRY_VERSION;
    wakaRoot.rootDepRegistry[packageName] = version;
  } else {
    // if we have been told not to register or
    // the registry already has a version of this dependency, then don't register
    // just add the version to the package
    wakaPackage[depType]![packageName] = version;
  }

  return { wakaRoot, wakaPackage };
}

export async function installFn(repoRootDir: string, opts: InstallOptions) {
  const { workspace, packageName } = opts;

  let workspaceDir = await parseWorkspaceDir(repoRootDir, cwd, workspace);
  const depType = getDepType(opts);
  const wakaRoot = await getWakaRoot(repoRootDir);
  let targetIsRoot = false;
  if (isMonoRepoRoot(workspaceDir)) {
    targetIsRoot = true;
    workspaceDir = repoRootDir;
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

  if (!opts.noRegister) {
    console.log('registering to root registry');
    wakaRoot.rootDepRegistry[parsedPackage.name] = parsedPackage.version;
  } else {
    console.log('not registering to root registry');
  }
  const rootFile = await getWakaRootFile(repoRootDir);
  if (targetIsRoot) {
    console.log('installing to root');
    const { wakaRoot: newWakaRoot } = updatePackage<Root>({
      wakaRoot,
      wakaPackage: wakaRoot,
      depType,
      packageName: parsedPackage.name,
      version: parsedPackage.version,
      noRegister: opts.noRegister ?? false,
    });
    console.log(`writing to ${rootFile}`);
    await writeWakaRoot(rootFile, newWakaRoot);
  } else {
    console.log('installing to package');
    const wakaPackageFile = await getWakaPackageFile(workspaceDir, {
      ensureExists: true,
    });
    const wakaPackage = await getWakaPackage(workspaceDir);
    const { wakaRoot: newWakaRoot, wakaPackage: newWakaPackage } =
      updatePackage<Package>({
        wakaRoot,
        wakaPackage,
        depType,
        packageName: parsedPackage.name,
        version: parsedPackage.version,
        noRegister: opts.noRegister ?? false,
      });
    console.log(`writing to ${wakaPackageFile}`);
    await writeWakaPackage(wakaPackageFile, newWakaPackage);
    await writeWakaPackage(rootFile, newWakaRoot);
  }
}
