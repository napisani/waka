import {
  command,
  flag,
  option,
  positional,
  run,
  string,
  subcommands,
} from 'cmd-ts';
import { identifyRootDir } from './file';
import { importFn, applyFn, initFn, installFn } from './subcmd';
const rootDir = identifyRootDir();
const scriptCmd = 'pnpm run waka';

const initCmd = command({
  name: 'init',
  description: 'Initialize waka yaml files within the monorepo',
  args: {},
  handler: async () => {
    process.chdir(rootDir);
    await initFn(rootDir);
  },
});

const importCmd = command({
  name: 'import',
  description: 'Import dependencies from package.json into waka.yaml files',
  args: {
    registerAll: flag({
      description: 'register all dependencies in root registry',
      short: 'r',
      long: 'register-all',
    }),
    acceptLatest: flag({
      description:
        'for all dependencies of the same name but different versions in the monorepo, assign to the latest defined version',
      short: 'l',
      long: 'accept-latest',
    }),
  },
  handler: async () => {
    process.chdir(rootDir);
    await importFn(rootDir);
  },
});

const applyCmd = command({
  name: 'apply',
  description: 'Apply waka.yaml files to package.json files',
  args: {},
  handler: async () => {
    process.chdir(rootDir);
    await applyFn(rootDir);
  },
});

const installCmd = command({
  name: 'install',
  description: 'install new dependencies and update waka.yaml files',
  args: {
    packageName: positional({
      description: 'package to install',
      displayName: 'package',
    }),
    workspace: option({
      description: 'workspace to install to',
      long: 'workspace',
      short: 'w',
      type: string,
      defaultValue: () => '',
    }),
    saveDev: flag({
      description: 'save as dev dependency',
      long: 'save-dev',
      short: 'D',
    }),
    savePeer: flag({
      description: 'save as dev dependency',
      long: 'save-peer',
      short: 'P',
    }),
    saveOpt: flag({
      description: 'save as dev dependency',
      long: 'save-opt',
      short: 'O',
    }),
    noRegister: flag({
      description: 'do not register dependency in root registry',
      long: 'no-register',
      short: 'N',
    }),
  },
  handler: async (args) => {
    process.chdir(rootDir);
    await installFn(rootDir, args);
  },
});
const app = subcommands({
  name: scriptCmd,
  cmds: {
    init: initCmd,
    import: importCmd,
    apply: applyCmd,
    install: installCmd,
  },
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run(app, process.argv.slice(2));
