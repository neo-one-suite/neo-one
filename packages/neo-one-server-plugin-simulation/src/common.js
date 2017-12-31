/* @flow */
import { Observable } from 'rxjs/Observable';

import spawn from 'cross-spawn';

// eslint-disable-next-line
export const executeHook = (cmd: string, cwd: string) =>
  Observable.create(observer => {
    observer.next(cmd);
    let running = true;
    const child = spawn(cmd, [], {
      cwd,
      windowsHide: true,
      shell: true,
    });
    child.stdout.on('data', message => {
      observer.next(message);
    });
    child.stderr.on('data', message => {
      observer.next(message);
    });
    child.on('error', err => {
      running = false;
      observer.error(err);
    });
    child.on('exit', code => {
      running = false;
      if (code) {
        observer.error(new Error(`Hook exited with code ${code}`));
      } else {
        observer.complete();
      }
    });

    return () => {
      if (running) {
        child.kill('SIGTERM');
      }
    };
  });
