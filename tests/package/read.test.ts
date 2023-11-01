import path from 'path';
import {
  getPackagePathsFromPnpmSelector,
  getNPMPackageDir,
  getNPMPackageName,
  getAllPackageDirectories,
  getWakaPackageFile,
  getNPMPackageFile,
  getWakaRootFile,
  getWakaPackageFiles,
  getNPMPackageFiles,
  getNPMPackageJsonContents,
  getRootNPMPackageFile,
  getWakaRoot,
  getWakaPackage,
  getWakaPackages,
  getNPMPackageDetails,
  getDetailKey,
  mapNPMPackageDetails,
} from '../../src/package/read';
const packageRelativePathes = [
  'apps/web',
  'apps/docs',
  'packages/ui',
  'packages/eslint-config-custom',
  'packages/tsconfig',
];
const mockRepoDir = path.resolve(path.join(__dirname, '../../mocks/mock-mono'));
describe('Package Read', () => {
  describe('getPackagePathsFromPnpmSelector', () => {
    it('should return an array of package paths from pnpm selector', async () => {
      const selector = 'web';

      const result = await getPackagePathsFromPnpmSelector(
        selector,
        mockRepoDir
      );

      expect(result).toEqual(['apps/web']);
    });
  });

  describe('getNPMPackageDir', () => {
    it('should return the directory of an npm package', async () => {
      const packageName = 'web';
      const result = await getNPMPackageDir(packageName, mockRepoDir);
      expect(result).toEqual(path.resolve(path.join(mockRepoDir, 'apps/web')));
    });
  });

  describe('getNPMPackageName', () => {
    it('should return the name of an npm package', async () => {
      const packageName = 'web';
      const packageJsonFile = await getNPMPackageDir(packageName, mockRepoDir);
      const result = getNPMPackageName(packageJsonFile);
      expect(result).toEqual('web');
    });
  });

  describe('getAllPackageDirectories', () => {
    it('should return an array of all package directories', async () => {
      const result = (
        await getAllPackageDirectories(mockRepoDir, { includeRoot: true })
      ).sort();
      const expected = ['', ...packageRelativePathes].sort();
      expect(result).toEqual(expected);
    });

    it('should return an array of all package directories including root', async () => {
      const result = (
        await getAllPackageDirectories(mockRepoDir, { includeRoot: false })
      ).sort();
      const expected = [...packageRelativePathes].sort();
      expect(result).toEqual(expected);
    });
  });

  describe('getWakaPackageFile', () => {
    it('should return the path of the waka-package.yaml file', async () => {
      const packageDir = path.join(mockRepoDir, 'apps/web');

      const result = await getWakaPackageFile(packageDir);

      expect(result).toEqual(
        path.resolve(path.join(mockRepoDir, 'apps/web/waka-package.yaml'))
      );
    });
  });

  describe('getNPMPackageFile', () => {
    it('should return the path of the package.json file', async () => {
      const packageDir = path.join(mockRepoDir, 'apps/web');

      const result = await getNPMPackageFile(packageDir);

      expect(result).toEqual(
        path.resolve(path.join(mockRepoDir, 'apps/web/package.json'))
      );
    });
  });

  describe('getWakaRootFile', () => {
    it('should return the path of the waka-root.yaml file', async () => {
      const result = await getWakaRootFile(mockRepoDir);

      expect(result).toEqual(
        path.resolve(path.join(mockRepoDir, 'waka-root.yaml'))
      );
    });
  });

  describe('getWakaPackageFiles', () => {
    it('should return an array of waka-package.yaml files', async () => {
      const result = (await getWakaPackageFiles(mockRepoDir)).sort();

      const expected = [...packageRelativePathes]
        .map((p) => path.join(mockRepoDir, p, 'waka-package.yaml'))
        .sort();
      expect(result).toEqual(expected);
    });

    it('should return an array of waka-package.yaml files including root', async () => {
      const result = await getWakaPackageFiles(mockRepoDir, {
        includeRoot: true,
      });
      const expected = [...packageRelativePathes]
        .map((p) => path.join(mockRepoDir, p, 'waka-package.yaml'))
        .sort();

      expect(result).toEqual([
        ...expected,
        path.join(mockRepoDir, 'waka-root.yaml'),
      ]);
    });
  });

  // describe('getNPMPackageFiles', () => {
  //   it('should return an array of package.json files', async () => {
  //     const cwd = '/Users/nick/code/waka';

  //     const result = await getNPMPackageFiles(cwd);

  //     expect(result).toEqual([
  //       '/Users/nick/code/waka/packages/example-package/package.json',
  //     ]);
  //   });

  //   it('should return an array of package.json files including root', async () => {
  //     const cwd = '/Users/nick/code/waka';

  //     const result = await getNPMPackageFiles(cwd, { includeRoot: true });

  //     expect(result).toEqual([
  //       '/Users/nick/code/waka/packages/example-package/package.json',
  //       '/Users/nick/code/waka/package.json',
  //     ]);
  //   });
  // });

  // describe('getNPMPackageJsonContents', () => {
  //   it('should return the contents of the package.json file as an object', async () => {
  //     const packageDir = '/Users/nick/code/waka/packages/example-package';

  //     const result = await getNPMPackageJsonContents(packageDir);

  //     expect(result).toEqual({
  //       name: 'example-package',
  //       version: '1.0.0',
  //       dependencies: {
  //         lodash: '1.0.0',
  //       },
  //       devDependencies: {},
  //     });
  //   });
  // });

  // describe('getRootNPMPackageFile', () => {
  //   it('should return the path of the root package.json file', async () => {
  //     const cwd = '/Users/nick/code/waka';

  //     const result = await getRootNPMPackageFile(cwd);

  //     expect(result).toEqual('/Users/nick/code/waka/package.json');
  //   });
  // });

  // describe('getWakaRoot', () => {
  //   it('should return the parsed contents of the waka-root.yaml file', async () => {
  //     const cwd = '/Users/nick/code/waka';

  //     const result = await getWakaRoot(cwd);

  //     expect(result).toEqual({
  //       name: 'example-project',
  //       version: '1.0.0',
  //       packages: ['example-package'],
  //     });
  //   });
  // });

  // describe('getWakaPackage', () => {
  //   it('should return the parsed contents of the waka-package.yaml file for a given package directory', async () => {
  //     const packageDirectory = '/Users/nick/code/waka/packages/example-package';

  //     const result = await getWakaPackage(packageDirectory);

  //     expect(result).toEqual({
  //       scripts: {
  //         build: 'npm run compile',
  //         compile: 'tsc',
  //         test: 'jest',
  //       },
  //     });
  //   });
  // });

  // describe('getWakaPackages', () => {
  //   it('should return a record of all waka packages', async () => {
  //     const cwd = '/Users/nick/code/waka';

  //     const result = await getWakaPackages(cwd);

  //     expect(result).toEqual({
  //       'example-package': {
  //         scripts: {
  //           build: 'npm run compile',
  //           compile: 'tsc',
  //           test: 'jest',
  //         },
  //       },
  //     });
  //   });
  // });

  // describe('getNPMPackageDetails', () => {
  //   it('should return an array of npm package details', async () => {
  //     const cwd = '/Users/nick/code/waka';

  //     const result = await getNPMPackageDetails(cwd);

  //     expect(result).toEqual([
  //       {
  //         name: 'lodash',
  //         version: '1.0.0',
  //         type: 'dependencies',
  //         packagePath:
  //           '/Users/nick/code/waka/packages/example-package/package.json',
  //         packageName: 'example-package',
  //       },
  //     ]);
  //   });

  //   it('should return an array of npm package details including root', async () => {
  //     const cwd = '/Users/nick/code/waka';

  //     const result = await getNPMPackageDetails(cwd, { includeRoot: true });

  //     expect(result).toEqual([
  //       {
  //         name: 'lodash',
  //         version: '1.0.0',
  //         type: 'dependencies',
  //         packagePath:
  //           '/Users/nick/code/waka/packages/example-package/package.json',
  //         packageName: 'example-package',
  //       },
  //       {
  //         name: 'lodash',
  //         version: '1.0.0',
  //         type: 'dependencies',
  //         packagePath: '/Users/nick/code/waka/package.json',
  //         packageName: 'example-project',
  //       },
  //     ]);
  //   });
  // });

  // describe('getDetailKey', () => {
  //   it('should return the key string for a given package detail', () => {
  //     const detail = {
  //       name: 'lodash',
  //       version: '1.0.0',
  //       type: 'dependencies',
  //       packagePath:
  //         '/Users/nick/code/waka/packages/example-package/package.json',
  //       packageName: 'example-package',
  //     };

  //     const result = getDetailKey(detail, ['name', 'version']);

  //     expect(result).toEqual('lodash|1.0.0');
  //   });
  // });

  // describe('mapNPMPackageDetails', () => {
  //   it('should return a record of npm package details grouped by a given key', () => {
  //     const details = [
  //       {
  //         name: 'lodash',
  //         version: '1.0.0',
  //         type: 'dependencies',
  //         packagePath:
  //           '/Users/nick/code/waka/packages/example-package/package.json',
  //         packageName: 'example-package',
  //       },
  //       {
  //         name: 'react',
  //         version: '2.0.0',
  //         type: 'dependencies',
  //         packagePath:
  //           '/Users/nick/code/waka/packages/example-package/package.json',
  //         packageName: 'example-package',
  //       },
  //       {
  //         name: 'lodash',
  //         version: '1.0.0',
  //         type: 'devDependencies',
  //         packagePath:
  //           '/Users/nick/code/waka/packages/example-package/package.json',
  //         packageName: 'example-package',
  //       },
  //     ];

  //     const result = mapNPMPackageDetails(details, ['name']);

  //     expect(result).toEqual({
  //       lodash: [
  //         {
  //           name: 'lodash',
  //           version: '1.0.0',
  //           type: 'dependencies',
  //           packagePath:
  //             '/Users/nick/code/waka/packages/example-package/package.json',
  //           packageName: 'example-package',
  //         },
  //         {
  //           name: 'lodash',
  //           version: '1.0.0',
  //           type: 'devDependencies',
  //           packagePath:
  //             '/Users/nick/code/waka/packages/example-package/package.json',
  //           packageName: 'example-package',
  //         },
  //       ],
  //       react: [
  //         {
  //           name: 'react',
  //           version: '2.0.0',
  //           type: 'dependencies',
  //           packagePath:
  //             '/Users/nick/code/waka/packages/example-package/package.json',
  //           packageName: 'example-package',
  //         },
  //       ],
  //     });
  //   });
  // });
});
