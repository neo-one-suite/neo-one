/* @flow */
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import spawn from 'cross-spawn';

const exec = promisify(execCallback);

const shouldUseYarn = async () => {
  try {
    await exec('yarn --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

const checkThatNpmCanReadCwd = () => {
  const cwd = process.cwd();
  let childOutput = null;
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    childOutput = spawn.sync('npm', ['config', 'list']).output.join('');
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true;
  }
  if (typeof childOutput !== 'string') {
    return true;
  }
  const lines = childOutput.split('\n');
  // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = '; cwd = ';
  const line = lines.find(l => l.indexOf(prefix) === 0);
  if (typeof line !== 'string') {
    // Fail gracefully. They could remove it.
    return true;
  }
  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }
  return false;
};

const install = async () => {
  const useYarn = await shouldUseYarn();

  let command = 'npm';
  const args = ['install'];
  if (useYarn) {
    command = 'yarn';
    args.push('--cwd');
    args.push(process.cwd());
    args.push('--ignore-engines');
  } else if (!checkThatNpmCanReadCwd()) {
    throw new Error(
      'npm could not read cwd. This is probably caused by a misconfigured ' +
        'system terminal shell.',
    );
  }

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`),
        );
      } else {
        resolve();
      }
    });
  });
};

export default {
  install,
};
