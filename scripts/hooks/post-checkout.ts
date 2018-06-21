import { checkForUpdates } from './checkForUpdates';

// we get 3 parameters from git: <previous HEAD> <new HEAD> <flag>
if (process.argv.length < 5) {
  // tslint:disable-next-line no-console
  console.error('invalid parameters specified!');
  process.exit(1);
}

// only execute the hook if it's a branch checkout
if (process.argv[4] === '1') {
  checkForUpdates(`git diff --name-only ${process.argv[2]} ${process.argv[3]}`);
}
