// tslint:disable no-console
import * as appRootDir from 'app-root-dir';
import * as execa from 'execa';

const changedFilesToArray = (files: string) => files.split('\n');

const yarnLock = /yarn\.lock/g;

const doCheck = async (files: string) => {
  const changedFiles = changedFilesToArray(files);
  const lockChanged = changedFiles.some((file) => yarnLock.test(file));
  if (lockChanged) {
    await execa('yarn', ['install'], {
      cwd: appRootDir.get(),
      stdio: 'inherit',
    });
  }
};

const run = async (gitCommand: string) => {
  const { stdout } = await execa(gitCommand);
  await doCheck(stdout);
};

export const checkForUpdates = (gitCommand: string) => {
  run(gitCommand)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
};
