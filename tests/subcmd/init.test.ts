import { initFn } from '../../src/subcmd/init';
import path from 'path';
import { exec } from 'shelljs';
import { getNPMPackageFiles, getWakaPackageFiles } from '../../src/package';

// Mocking the functions from '../package' module

const mockRepoDir = path.resolve(path.join(__dirname, '../../mocks/mock-mono'));

describe('initFn', () => {
  beforeEach(() => {
    exec('git restore --source=HEAD --staged --worktree --  ' + mockRepoDir);
  });

  it('should generate root waka file if it does not exist', async () => {
    await initFn(mockRepoDir);
    const wakaPkgFiles = await getWakaPackageFiles(mockRepoDir, {
      ensureExists: true,
      includeRoot: true,
    });
    const pkgJsonFiles = await getNPMPackageFiles(mockRepoDir, {
      includeRoot: true,
    });
    expect(wakaPkgFiles.length).toEqual(pkgJsonFiles.length);
  });
});
