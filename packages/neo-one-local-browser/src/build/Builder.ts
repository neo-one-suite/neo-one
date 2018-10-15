import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { Subject } from 'rxjs';
import { createPouchDBFileSystem, PouchDBFileSystem } from '../filesystem';
import { OutputMessage } from '../types';
import { build } from './build';

interface BuilderOptions {
  readonly dbID: string;
  readonly endpoint: comlink.Endpoint;
  readonly output$: Subject<OutputMessage>;
  readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;
}

export class Builder {
  private readonly fs: Promise<PouchDBFileSystem>;
  private readonly output$: Subject<OutputMessage>;
  private readonly jsonRPCLocalProviderManager: WorkerManager<typeof JSONRPCLocalProvider>;

  public constructor({ dbID, endpoint, output$, jsonRPCLocalProviderManager }: BuilderOptions) {
    this.fs = createPouchDBFileSystem(dbID, endpoint);
    this.output$ = output$;
    this.jsonRPCLocalProviderManager = jsonRPCLocalProviderManager;
  }

  public async build(): Promise<void> {
    const fs = await this.fs;
    const result = await build({ output$: this.output$, fs, providerManager: this.jsonRPCLocalProviderManager });

    await Promise.all(result.files.map(async (file) => fs.writeFile(file.path, file.content)));
  }
}
