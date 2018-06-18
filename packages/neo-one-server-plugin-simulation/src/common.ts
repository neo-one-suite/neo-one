import execa from 'execa';
import { Observable, Observer } from 'rxjs';

// tslint:disable-next-line export-name
export const executeHook = (cmd: string, cwd: string): Observable<string> =>
  Observable.create((observer: Observer<string>) => {
    observer.next(cmd);
    let running = true;
    const child = execa.shell(cmd, {
      cwd,
      // @ts-ignore
      windowsHide: true,
      shell: true,
    });

    child.stdout.on('data', (message: string) => {
      observer.next(message);
    });
    child.stderr.on('data', (message: string) => {
      observer.next(message);
    });
    child.on('error', (err) => {
      running = false;
      observer.error(err);
    });
    child.on('exit', (code) => {
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
