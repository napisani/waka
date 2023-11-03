import fs from 'fs';
import type {
  Package,
  PackageDocument,
  PackageJsonContents,
  Root,
  RootDocument,
} from './schema';
import path from 'path';
const configName = 'waka.config.js';

export interface InstallPreEvaluateArgs {
  workspaceDir: string;
  depType: string;
  wakaRoot: RootDocument;
  installPackageAndVersion: string;
}
interface InstallCommonArgs {
  wakaRootFile: string;
  workspaceDir: string;
  depType: string;
  wakaRoot: RootDocument;
  wakaPackage?: PackageDocument;
  wakaPackageFile?: string;
  parsedPackageInfo: {
    name: string;
    version: string | null;
  };
}
export type InstallPreWriteArgs = InstallCommonArgs;

export type InstallPostWriteArgs = InstallCommonArgs;

interface ApplyCommonArgs {
  wakaRoot: Root;
  wakaPackages: Record<string, Package>;
}
export type ApplyPreEvaluateArgs = ApplyCommonArgs;

export interface ApplyPreWriteArgs extends ApplyCommonArgs {
  packageDirToJsonContents: [string, PackageJsonContents][];
}

export interface ApplyPostWriteArgs extends ApplyCommonArgs {
  packageDirToJsonContents: [string, PackageJsonContents][];
}

const configTemplate = {
  installPreEvaluate: async (_args: InstallPreEvaluateArgs) => {
    // pre install
  },
  installPreWrite: async (_args: InstallPreWriteArgs) => {
    // install pre write
  },
  installPostWrite: async (_args: InstallPostWriteArgs) => {
    // install post write
  },
  applyPreEvaluate: async (_args: ApplyPreEvaluateArgs) => {
    // apply pre evaluate
  },
  applyPreWrite: async (_args: ApplyPreWriteArgs) => {
    // apply pre write
  },
  applyPostWrite: async (_args: ApplyPostWriteArgs) => {
    // apply post write
  },
};

type Config = typeof configTemplate;

export async function getExternalConfig(
  rootDir: string,
  opts?: {
    configPath?: string;
  }
): Promise<Config> {
  if (opts?.configPath) {
    if (fs.existsSync(opts.configPath)) {
      const config = (await import(opts.configPath)) as Config;
      return { ...configTemplate, ...config };
    } else {
      const configPath = path.join(opts.configPath, configName);
      if (fs.existsSync(configPath)) {
        const config = (await import(configPath)) as Config;
        return { ...configTemplate, ...config };
      }
    }
  }
  const configPath = path.join(rootDir, configName);
  if (fs.existsSync(configPath)) {
    const config = (await import(configPath)) as Config;
    return { ...configTemplate, ...config };
  }

  return configTemplate;
}
