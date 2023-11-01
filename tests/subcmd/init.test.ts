import { initFn } from '../../src/subcmd/init';
import path from 'path';
import { exec } from 'shelljs';
import {
  getNPMPackageFiles,
  getWakaPackageFiles,
  getWakaRootFile,
} from '../../src/package';

const mockRepoDir = path.resolve(path.join(__dirname, '../../mocks/mock-mono'));
function cleanUp() {
  exec('git restore --source=HEAD --staged --worktree --  ' + mockRepoDir);
  exec('git clean -f --  ' + mockRepoDir);
}
describe('initFn', () => {
  beforeEach(() => {
    cleanUp();
  });

  afterEach(() => {
    cleanUp();
  });

  it('should generate root waka file if it does not exist', async () => {
    await initFn(mockRepoDir);
    let wakaPkgFiles = await getWakaPackageFiles(mockRepoDir, {
      ensureExists: true,
      includeRoot: true,
    });
    let pkgJsonFiles = await getNPMPackageFiles(mockRepoDir, {
      includeRoot: true,
    });
    expect(wakaPkgFiles.length).toEqual(pkgJsonFiles.length);

    wakaPkgFiles = await getWakaPackageFiles(mockRepoDir, {
      ensureExists: true,
      includeRoot: false,
    });
    pkgJsonFiles = await getNPMPackageFiles(mockRepoDir, {
      includeRoot: false,
    });

    expect(wakaPkgFiles.length).toEqual(pkgJsonFiles.length);

    const root = getWakaRootFile(mockRepoDir, { ensureExists: true });
    expect(root).toBeTruthy();
  });
});
