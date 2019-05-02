// tslint:disable no-console
import execa from 'execa';
import * as path from 'path';
import yargs from 'yargs';
import { createKillProcess } from './createKillProcess';

const argv = yargs
  .boolean('report')
  .describe('report', 'Write out test reports.')
  .default('report', false)
  .boolean('coverage')
  .describe('coverage', 'Write coverage to .nyc_output.')
  .default('coverage', false).argv;

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

  if (proc.stdout !== null) {
    proc.stdout.pipe(process.stdout);
  }
  if (proc.stderr !== null) {
    proc.stderr.pipe(process.stderr);
  }

  await proc;
};

// tslint:disable-next-line readonly-array
const mutableCleanup: (() => Promise<void> | void)[] = [];

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

run({ report: argv.report, coverage: argv.coverage })
  .then(() => shutdown(0))
  .catch((error) => {
    console.error(error);
    shutdown(1);
  });
