// tslint:disable no-console
import execa from 'execa';
import isRunning from 'is-running';
import * as path from 'path';
import yargs from 'yargs';

yargs.describe('report', 'Write out test reports.').default('report', false);
yargs.describe('coverage', 'Write coverage to .nyc_output.').default('coverage', false);

const runCypress = async ({ report, coverage }: { readonly report: boolean; readonly coverage: boolean }) => {
  // tslint:disable-next-line no-unused
  const { NODE_OPTIONS, TS_NODE_PROJECT, ...newEnv } = process.env;
  let command = ['cypress', 'run', '--spec', 'cypress/integration/**/*'];
  if (report) {
    command = command.concat([
      '--reporter',
      'mocha-multi-reporters',
      '--reporter-options',
      `configFile=${path.resolve(__dirname, '..', 'mocha.json')}`,
    ]);
  }
  if (coverage) {
    command = command.concat(['--env', `coverageDir=${path.resolve(process.cwd(), '.nyc_output')}`]);
  }

  console.log(`$ yarn ${command.join(' ')}`);
  const proc = execa('yarn', command, {
    env: newEnv,
    extendEnv: false,
    cwd: path.resolve(__dirname, '..'),
  });

  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);

  await proc;
};

const nowSeconds = () => Math.round(Date.now() / 1000);

const createKillProcess = (proc: execa.ExecaChildProcess) => async () => killProcess(proc);

const killProcess = async (proc: execa.ExecaChildProcess) => {
  const { pid } = proc;
  const startTime = nowSeconds();
  let alive = isRunning(pid);
  if (!alive) {
    return;
  }

  // tslint:disable-next-line no-loop-statement
  while (nowSeconds() - startTime <= 10) {
    try {
      let signal = 'SIGINT';
      if (nowSeconds() - startTime > 7) {
        signal = 'SIGKILL';
      } else if (nowSeconds() - startTime > 5) {
        signal = 'SIGTERM';
      }
      process.kill(pid, signal);
    } catch (error) {
      if (error.code === 'ESRCH') {
        return;
      }

      throw error;
    }
    // eslint-disable-next-line
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    alive = isRunning(pid);
    if (!alive) {
      return;
    }
  }

  throw new Error(`Failed to kill process ${pid}`);
};

// tslint:disable-next-line readonly-array
const mutableCleanup: Array<() => Promise<void> | void> = [];

// tslint:disable-next-line no-let
let shuttingDown = false;
const shutdown = (exitCode: number) => {
  if (!shuttingDown) {
    shuttingDown = true;
    console.log('Shutting down...');
    Promise.all(mutableCleanup.map((callback) => callback()))
      .then(() => {
        process.exit(exitCode);
      })
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
};

process.on('uncaughtException', (error) => {
  console.error(error);
  shutdown(1);
});

process.on('unhandledRejection', (error) => {
  console.error(error);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT: Exiting...');
  shutdown(0);
});

process.on('SIGTERM', () => {
  console.log('\nSIGTERM: Exiting...');
  shutdown(0);
});

const run = async ({ report, coverage }: { readonly report: boolean; readonly coverage: boolean }) => {
  console.log('$ yarn website:serve');
  const proc = execa('yarn', ['website:serve']);
  mutableCleanup.push(createKillProcess(proc));

  await runCypress({ report, coverage });
};

run({ report: yargs.argv.report, coverage: yargs.argv.coverage })
  .then(() => shutdown(0))
  .catch((error) => {
    console.error(error);
    shutdown(1);
  });
