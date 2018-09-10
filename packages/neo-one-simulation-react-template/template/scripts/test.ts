import execa from 'execa';
import * as path from 'path';
import * as semver from 'semver';

// tslint:disable-next-line no-let
let args: ReadonlyArray<string> = [];
if (semver.satisfies(process.version, '8.x')) {
  args = ['--harmony-async-iteration'];
} else if (semver.satisfies(process.version, '9.x')) {
  args = ['--harmony'];
}

const jest = path.resolve(require.resolve('jest'), '..', '..', 'bin', 'jest.js');
const proc = execa('node', args.concat([jest]).concat(process.argv.slice(2)), {
  stdio: 'inherit',
  env: {
    NODE_NO_WARNINGS: '1',
  },
});
process.on('SIGTERM', () => proc.kill('SIGTERM'));
process.on('SIGINT', () => proc.kill('SIGINT'));
process.on('SIGBREAK', () => proc.kill('SIGBREAK'));
process.on('SIGHUP', () => proc.kill('SIGHUP'));
proc.on('exit', (code: number | null, signal) => {
  let exitCode = code;
  if (exitCode === null) {
    exitCode = signal === 'SIGINT' ? 0 : 1;
  }
  process.exit(exitCode);
});
