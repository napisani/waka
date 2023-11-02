import {
  getNPMPackageDir,
  getNPMPackageFile,
  getNPMPackageJsonContents,
  getWakaPackages,
  getWakaRoot,
  writePackageJson,
} from '../package';
import type { Package, PackageJsonContents, Root } from '../schema';
import { ROOT_REGISTRY_VERSION, npmDepTypes } from '../schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEmptyDeps(deps: Record<string, any> | undefined | null) {
  return !deps || Object.keys(deps).length === 0;
}
async function applyToPackage(
  wakaRoot: Root,
  fullPackagePath: string,
  wakaPackage: Package
): Promise<PackageJsonContents> {
  const packageJsonContents = await getNPMPackageJsonContents(fullPackagePath);
  for (const depType of npmDepTypes) {
    const wakaDeps = wakaPackage[depType];
    const npmDeps = packageJsonContents[depType]!;
    if (isEmptyDeps(wakaDeps) && isEmptyDeps(npmDeps)) {
      continue;
    } else if (isEmptyDeps(wakaDeps) && !isEmptyDeps(npmDeps)) {
      delete packageJsonContents[depType];
    } else {
      packageJsonContents[depType] = Object.entries(wakaDeps!)
        .map(([name, wakaDep]) => {
          if (wakaDep === ROOT_REGISTRY_VERSION) {
            const rootRegVersion = wakaRoot.rootDepRegistry[name];
            if (!rootRegVersion) {
              throw new Error(
                `Root registry version for ${name} does not exist.`
              );
            }
            return [name, rootRegVersion] as [string, string];
          }
          return [name, wakaDep] as [string, string];
        })
        .reduce(
          (acc, next) => {
            const [name, version] = next;
            acc[name] = version;
            return acc;
          },
          {} as Record<string, string>
        );
    }
  }

  return packageJsonContents;
}

async function writeApplication(
  packageDir: string,
  packageJsonContents: PackageJsonContents
) {
  const packageJsonFile = await getNPMPackageFile(packageDir);
  await writePackageJson(packageJsonFile, packageJsonContents);
}

export async function applyFn(repoRootDir: string) {
  const wakaRoot = await getWakaRoot(repoRootDir);
  const wakaPackages = await getWakaPackages(repoRootDir);

  const rootPackageJson = await applyToPackage(wakaRoot, repoRootDir, wakaRoot);
  const packageDirToJsonContents = await Promise.all(
    Object.entries(wakaPackages).map(async ([packageName, wakaPackage]) => {
      const packageDir = await getNPMPackageDir(packageName, repoRootDir);
      const content = await applyToPackage(wakaRoot, packageDir, wakaPackage);
      return Promise.all([packageDir, content]);
    })
  );
  await Promise.all(
    packageDirToJsonContents.map(async ([packageDir, packageJsonContents]) => {
      await writeApplication(packageDir, packageJsonContents);
    })
  );
  await writeApplication(repoRootDir, rootPackageJson);
}
