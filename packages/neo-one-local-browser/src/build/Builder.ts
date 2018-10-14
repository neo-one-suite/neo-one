import { JSONRPCLocalProvider } from '@neo-one/node-browser';
import { WorkerManager } from '@neo-one/worker';
import { Subject } from 'rxjs';
import { LocalForageFileSystem, MemoryFileSystem, WithWorkerMirroredFileSystem } from '../filesystem';
import { OutputMessage } from '../types';
import { build, BuildResult } from './build';

interface BuilderOptions {
  readonly output$: Subject<OutputMessage>;
  readonly fileSystemID: string;
  readonly provider: WorkerManager<typeof JSONRPCLocalProvider>;
}

export class Builder extends WithWorkerMirroredFileSystem {
  private readonly output$: Subject<OutputMessage>;
  private readonly provider: WorkerManager<typeof JSONRPCLocalProvider>;

  public constructor({ output$, fileSystemID, provider }: BuilderOptions) {
    super(new MemoryFileSystem(), new LocalForageFileSystem(fileSystemID));
    this.output$ = output$;
    this.provider = provider;
  }

  public async build(): Promise<BuildResult> {
    const fs = await this.fs;

    return build({ output$: this.output$, fs, providerManager: this.provider });
  }
}
