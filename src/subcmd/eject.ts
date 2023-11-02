import { getWakaPackageFiles } from '../package';
import select from '@inquirer/select';
import fs from 'fs';

async function confirm() {
  return select<boolean>({
    message:
      'Are you sure you want to eject? This will remove all waka files from the repo.',
    choices: [
      { name: 'yes', value: true },
      { name: 'no', value: false },
    ],
  });
}
interface EjectOptions {
  confirm?: boolean;
}
export async function ejectFn(repoRootDir: string, opts: EjectOptions) {
  const files = await getWakaPackageFiles(repoRootDir, {
    ensureExists: false,
    includeRoot: true,
  });
  const confirmEject = opts.confirm ?? (await confirm());

  if (!confirmEject) {
    console.log('eject cancelled');
    return;
  }

  for (const file of files) {
    if (fs.existsSync(file)) {
      console.log(`Removing ${file}`);
      fs.unlinkSync(file);
    }
  }
  console.log('all waka files have been removed from the repo');
}
