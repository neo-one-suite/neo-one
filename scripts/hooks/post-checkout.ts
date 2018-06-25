import { checkForUpdates } from './checkForUpdates';

checkForUpdates(`git diff --name-only ${process.argv[2]}`);
