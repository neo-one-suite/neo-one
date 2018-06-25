import { checkForUpdates } from './checkForUpdates';

// we get 3 parameters from git: <previous HEAD> <new HEAD> <flag>
if (process.argv.length < 5) {
  // tslint:disable-next-line no-console
  console.error('Failed to check yarn.lock for changes.');
  process.exit(0);
}

// only execute the hook if it's a branch checkout
if (process.argv[4] === '1') {
  checkForUpdates(`git diff --name-only ${process.argv[2]} ${process.argv[3]}`);
}
