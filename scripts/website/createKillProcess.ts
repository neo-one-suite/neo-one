import execa from 'execa';

const isRunning = (pid: number) => {
  try {
    // tslint:disable-next-line no-void-expression
    return process.kill(pid, 0);
  } catch (e) {
    return e.code === 'EPERM';
  }
};

export const createKillProcess = (proc: execa.ExecaChildProcess) => async () => killProcess(proc);

const nowSeconds = () => Math.round(Date.now() / 1000);

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
