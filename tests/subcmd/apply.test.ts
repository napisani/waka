import path from 'path';
import { exec } from 'shelljs';
import { applyFn, initFn } from '../../src';
import {
  getNPMPackageFile,
  getNPMPackageJsonContents,
  getWakaRoot,
  getWakaRootFile,
  writeWakaRoot,
} from '../../src/package';
import { importFn } from '../../src/subcmd/import';

const mockRepoDir = path.resolve(path.join(__dirname, '../../mocks/mock-mono'));
function cleanUp() {
  exec('git restore --source=HEAD --staged --worktree --  ' + mockRepoDir);
  exec('git clean -f --  ' + mockRepoDir);
}
describe('importFn', () => {
  beforeEach(async () => {
    cleanUp();
    await initFn(mockRepoDir);
    await importFn(mockRepoDir, {
      registerAll: true,
      acceptLatest: true,
    });
  });

  afterEach(() => {
    cleanUp();
  });

  it('applying an update to the waka files should result in the respective package.json getting updated', async () => {
    const wakaRootFile = await getWakaRootFile(mockRepoDir);
    const wakaRoot = await getWakaRoot(mockRepoDir);
    wakaRoot.rootDepRegistry.next = '^14.0.0';
    await writeWakaRoot(wakaRootFile, wakaRoot);
    await applyFn(mockRepoDir, {});
    const pkgJsonContents = await getNPMPackageJsonContents(
      await getNPMPackageFile(path.join(mockRepoDir, 'apps/web'))
    );
    expect(pkgJsonContents.dependencies!.next).toEqual('^14.0.0');
  });

  it('applying an update to the waka files should be a noop if the CI envvar is true', async () => {
    const wakaRootFile = await getWakaRootFile(mockRepoDir);
    const wakaRoot = await getWakaRoot(mockRepoDir);
    wakaRoot.rootDepRegistry.next = '^14.0.0';
    await writeWakaRoot(wakaRootFile, wakaRoot);
    process.env.CI = 'true';
    await applyFn(mockRepoDir, {});
    const pkgJsonContents = await getNPMPackageJsonContents(
      await getNPMPackageFile(path.join(mockRepoDir, 'apps/web'))
    );
    expect(pkgJsonContents.dependencies!.next).toEqual('^13.4.19');
  });
});
