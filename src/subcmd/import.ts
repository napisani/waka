import select from '@inquirer/select';
import yaml from 'js-yaml';
import {
  getNPMPackageDetails,
  getNPMPackageDir,
  getNPMPackageFile,
  getNPMPackageName,
  getWakaPackageFile,
  getWakaPackages,
  getWakaRoot,
  getWakaRootFile,
  mapNPMPackageDetails,
  writeWakaPackage,
  writeWakaRoot,
} from '../package';
import type { NPMDepType, Package, PackageDetail, Root } from '../schema';
import { ROOT_REGISTRY_VERSION, defaultWakaPackage } from '../schema';
import semverSort from 'semver/functions/sort';
import semverCoerce from 'semver/functions/coerce';

async function promptForRootRegVersionSelect(
  name: string,
  detailsByNameAndVersion: Record<string, PackageDetail[]>,
  opts: ImportOptions
): Promise<{ rootRegVersion: string | null; changeAllToRootVersion: boolean }> {
  const selections: {
    rootRegVersion: string | null;
    changeAllToRootVersion: boolean;
  } = { rootRegVersion: null, changeAllToRootVersion: false };
  if (opts.acceptLatest) {
    const sortedVersions = semverSort(
      Object.values(detailsByNameAndVersion).map(
        (details) => semverCoerce(details[0]!.version)!
      ),
      { loose: true }
    );
    const latestVersion = sortedVersions[sortedVersions.length - 1]!;
    selections.rootRegVersion = latestVersion.raw;
  } else {
    selections.rootRegVersion = await select<string | null>({
      message: `Select which version of ${name} that you want to be pinned as the root registry version:`,
      choices: [
        { name: 'do not register to root registry', value: null },
        ...Object.values(detailsByNameAndVersion).map((details) => {
          const [detail] = details;
          return {
            name: detail.version,
            value: detail.version,
            description: `count: (${details.length})`,
          };
        }),
      ],
    });
  }

  if (selections.rootRegVersion) {
    if (opts.registerAll) {
      selections.changeAllToRootVersion = true;
    } else {
      selections.changeAllToRootVersion = await select<boolean>({
        message: `Do you want to change all versions of ${name} to be the root registry version?`,
        choices: [
          { name: 'yes', value: true },
          { name: 'no', value: false },
        ],
      });
    }
  }

  return selections;
  // const detail = Object.values(detailsByNameAndVersion)[0]!;
  // const answer = await Promise.resolve(detail[0]!.version);
  // return answer;
}

async function organizeDependencies(
  wakaRoot: Root,
  wakaPackages: Record<string, Package>,
  npmPackageDetails: PackageDetail[],
  opts: ImportOptions
): Promise<{ wakaRoot: Root; wakaPackages: Record<string, Package> }> {
  function adjustWakaRootRegistryVersion(
    name: string,
    newVersion: string | null
  ) {
    if (!newVersion) {
      if (wakaRoot.rootDepRegistry[name]) {
        delete wakaRoot.rootDepRegistry[name];
      }
      return wakaRoot;
    }
    wakaRoot.rootDepRegistry[name] = newVersion;
    return wakaRoot;
  }

  function adjustWakaPackageVersion(
    packageName: string,
    pkgName: string,
    newVersion: string,
    depType: NPMDepType
  ): Package {
    const wakaPackage = wakaPackages[packageName] ?? defaultWakaPackage;
    const deps = wakaPackage[depType] ?? {};
    deps[pkgName] = newVersion;
    return wakaPackage;
  }

  const detailsByName = mapNPMPackageDetails(npmPackageDetails, ['name']);
  // const detailsByNameAndVersion = mapNPMPackageDetails(npmPackageDetails, [
  //   'name',
  //   'version',
  // ]);
  const names = Object.keys(detailsByName);
  for (const name of names) {
    const detailForName = detailsByName[name]!;
    const detailsByNameAndVersion = mapNPMPackageDetails(detailForName, [
      'name',
      'version',
    ]);
    if (Object.keys(detailsByNameAndVersion).length === 1) {
      const [detail] = detailForName;
      const { version } = detail;
      wakaRoot = adjustWakaRootRegistryVersion(name, version);
      for (const detailToFix of detailForName) {
        const { packageName } = detailToFix;
        wakaPackages[packageName] = adjustWakaPackageVersion(
          packageName,
          name,
          ROOT_REGISTRY_VERSION,
          detail.type
        );
      }
    } else {
      const { rootRegVersion, changeAllToRootVersion } =
        await promptForRootRegVersionSelect(
          name,
          detailsByNameAndVersion,
          opts
        );
      if (rootRegVersion) {
        wakaRoot = adjustWakaRootRegistryVersion(name, rootRegVersion);
        detailForName.forEach((detail) => {
          const { packageName } = detail;
          wakaPackages[packageName] = adjustWakaPackageVersion(
            packageName,
            name,
            rootRegVersion === detail.version || changeAllToRootVersion
              ? ROOT_REGISTRY_VERSION
              : detail.version,
            detail.type
          );
        });
      } else {
        wakaRoot = adjustWakaRootRegistryVersion(name, null);
        detailForName.forEach((detail) => {
          const { packageName } = detail;
          wakaPackages[packageName] = adjustWakaPackageVersion(
            packageName,
            name,
            detail.version,
            detail.type
          );
        });
      }
    }
  }
  return Promise.resolve({
    wakaRoot,
    wakaPackages,
  });
}
export interface ImportOptions {
  acceptLatest?: boolean;
  registerAll?: boolean;
}

export async function importFn(repoRootDir: string, opts: ImportOptions) {
  const wakaRoot = await getWakaRoot(repoRootDir);
  const wakaPackages = await getWakaPackages(repoRootDir);

  const npmPackageDetails = await getNPMPackageDetails(repoRootDir, {
    includeRoot: true,
  });
  const { wakaRoot: newWakaRoot, wakaPackages: newWakaPackages } =
    await organizeDependencies(wakaRoot, wakaPackages, npmPackageDetails, opts);
  const rootFile = await getWakaRootFile(repoRootDir, { ensureExists: false });
  const rootPackageJson = await getNPMPackageFile(repoRootDir);
  const rootPackageName = getNPMPackageName(rootPackageJson);
  const newRootPackage = wakaPackages[rootPackageName];

  await writeWakaRoot(rootFile, { ...newWakaRoot, ...newRootPackage });
  const packageNames = Object.keys(newWakaPackages);
  for (const p of packageNames) {
    const packageDir = await getNPMPackageDir(p, repoRootDir);
    const wakaPackageYaml = await getWakaPackageFile(packageDir, {
      ensureExists: false,
    });
    await writeWakaPackage(wakaPackageYaml, newWakaPackages[p]!);
  }

  await writeWakaRoot(rootFile, newWakaRoot);
  console.log('all dependencies have been imported to waka yaml files');
}
