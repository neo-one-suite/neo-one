// tslint:disable no-console
import * as appRootDir from 'app-root-dir';
import * as execa from 'execa';

const changedFilesToArray = (files: string) => files.split('\n');

const yarnLock = /yarn\.lock/g;

const doCheck = async (files: string) => {
  const changedFiles = changedFilesToArray(files);
  const lockChanged = changedFiles.some((file) => yarnLock.test(file));
  if (lockChanged) {
    console.log('yarn.lock changed, executing `yarn install`');
    const childProc = execa('yarn', ['install'], {
      cwd: appRootDir.get(),
    });
    childProc.stdout.pipe(process.stdout);
    childProc.stderr.pipe(process.stderr);
    await childProc;
  }
};

const run = async (gitCommand: string) => {
  const splitCommand = gitCommand.split(' ');
  const { stdout } = await execa(splitCommand[0], splitCommand.slice(1));
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
