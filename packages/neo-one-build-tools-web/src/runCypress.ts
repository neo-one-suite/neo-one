// tslint:disable no-console
import execa from 'execa';
import * as path from 'path';
import { timer } from 'rxjs';
import yargs from 'yargs';

const { argv } = yargs
  .boolean('local')
  .describe('local', 'Run test locally')
  .default('local', false)
  .boolean('express')
  .describe('express', 'Run quick test on a single course')
  .default('express', false);

const runCypress = async () => {
  // tslint:disable-next-line no-unused
  const { NODE_OPTIONS, TS_NODE_PROJECT, ...newEnv } = process.env;
  const cypressRetries = '3';
  const finalEnv = { ...newEnv, CYPRESS_RETRIES: cypressRetries };
  let command = ['cypress-run', '--browser', 'chrome', '--spec'];
  command = argv.express
    ? command.concat(['cypress/integration/TokenomicsCourse/Lesson2/Chapter5.ts'])
    : // the glob must be in two sets of quotes so that Cypress reads the glob inside a single set of quotes
      command.concat(['"cypress/integration/**/*"']);

  console.log(
    `$ rush CYPRESS_RETRIES=${cypressRetries} cypress run --browser chrome --spec ${command[command.length - 1]}`,
  );
  const proc = execa('rush', command, {
    env: finalEnv,
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

const run = async () => {
  const shutdownWait = 5000;
  console.log('$ rush compile-website-prod');
  const buildProc = execa('rush', ['compile-website-prod']);
  mutableCleanup.push(async () => {
    buildProc.kill('SIGTERM', { forceKillAfterTimeout: shutdownWait });
    await timer(shutdownWait + 500).toPromise();
  });

  // Uncomment (and build) to debug compile-website-prod command
  // if (buildProc.stdout !== null) {
  //   buildProc.stdout.pipe(process.stdout);
  // }
  // if (buildProc.stderr !== null) {
  //   buildProc.stderr.pipe(process.stderr);
  // }

  await buildProc;
  console.log('$ rush run-website-prod');
  const startProc = execa('rush', ['run-website-prod']);
  mutableCleanup.push(async () => {
    startProc.kill('SIGTERM', { forceKillAfterTimeout: shutdownWait });
    await timer(shutdownWait + 500).toPromise();
  });

  // Uncomment (and build) to debug run-website-prod command
  // if (startProc.stdout !== null) {
  //   startProc.stdout.pipe(process.stdout);
  // }
  // if (startProc.stderr !== null) {
  //   startProc.stderr.pipe(process.stderr);
  // }

  const TWENTY_MINUTES = 20 * 60 * 1000;
  const EIGHT_MINUTES = 8 * 60 * 1000;
  await timer(argv.local ? EIGHT_MINUTES : TWENTY_MINUTES).toPromise();
  await runCypress();
};

run()
  .then(() => {
    shutdown(0);
  })
  .catch((error) => {
    console.error(error);
    shutdown(1);
  });
