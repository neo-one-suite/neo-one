import { PouchDBFileSystem } from '@neo-one/local-browser';
import { WorkerManager } from '@neo-one/worker';
import { Observable } from 'rxjs';
import { AsyncLanguageService } from './AsyncLanguageService';

export interface MonacoWorkerManager {
  readonly manager: WorkerManager<typeof AsyncLanguageService>;
  readonly fs: PouchDBFileSystem;
  readonly openFiles$: Observable<ReadonlyArray<string>>;
  readonly fileChanged$: Observable<string>;
  readonly isLanguageFile: (file: string) => boolean;
}
