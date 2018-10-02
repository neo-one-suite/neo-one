import {
  Builder,
  createBuilderManager,
  dirname,
  ensureDir,
  FileSystem,
  LocalForageFileSystem,
  MemoryFileSystem,
  MirrorFileSystem,
  OutputMessage,
  pathExists,
} from '@neo-one/local-browser';
import { comlink, WorkerManager } from '@neo-one/worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { METADATA_FILE } from '../constants';
import { EditorFiles } from '../editor';
import { EngineContentFiles, FileMetadata, FileSystemMetadata } from '../types';
import { initializeFileSystem } from './initializeFileSystem';

export interface EngineCreateOptions {
  readonly id: string;
  readonly initialFiles: EngineContentFiles;
}

interface EngineOptions {
  readonly id: string;
  readonly output$: Subject<OutputMessage>;
  readonly builder: WorkerManager<typeof Builder>;
  readonly fs: FileSystem;
  readonly files: EditorFiles;
}

export class Engine {
  public static async create({ id, initialFiles }: EngineCreateOptions): Promise<Engine> {
    const output$ = new Subject<OutputMessage>();
    const fs = await MirrorFileSystem.create(new MemoryFileSystem(), new LocalForageFileSystem(id));

    const exists = pathExists(fs, METADATA_FILE);
    let metadata: FileSystemMetadata;
    if (exists) {
      const metadataContents = fs.readFileSync(METADATA_FILE);
      metadata = JSON.parse(metadataContents);
    } else {
      initializeFileSystem(fs);
      metadata = {
        fileMetadata: initialFiles.reduce<FileSystemMetadata['fileMetadata']>(
          (acc, file) => ({
            ...acc,
            [file.path]: { writable: file.writable },
          }),
          {},
        ),
        files: initialFiles.filter((file) => file.open).map((file) => file.path),
      };
      initialFiles.forEach((file) => {
        ensureDir(fs, dirname(file.path));
        fs.writeFileSync(file.path, file.content);
      });
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata));
    }

    const builder = createBuilderManager(output$, id);
    fs.subscribe((change) => {
      builder
        .getInstance()
        .then(async (instance) => instance.onFileSystemChange(change))
        .catch((error) => {
          // tslint:disable-next-line no-console
          console.error(error);
        });
    });

    const files = metadata.files.map((file) => {
      const fileMetadata = metadata.fileMetadata[file] as FileMetadata | undefined;

      return {
        path: file,
        writable: fileMetadata === undefined ? true : fileMetadata.writable,
      };
    });

    return new Engine({ id, output$, builder, fs, files });
  }

  private readonly id: string;
  private readonly output$: Subject<OutputMessage>;
  private readonly fs: FileSystem;
  private readonly openFiles$: BehaviorSubject<EditorFiles>;
  private readonly builder: WorkerManager<typeof Builder>;

  private constructor({ id, output$, fs, builder, files }: EngineOptions) {
    this.id = id;
    this.output$ = comlink.proxyValue(output$);
    this.fs = comlink.proxyValue(fs);
    this.openFiles$ = comlink.proxyValue(new BehaviorSubject(files));
    this.builder = builder;
  }

  public async getID(): Promise<string> {
    return this.id;
  }

  public async getFileSystem(): Promise<FileSystem> {
    return this.fs;
  }

  public async getOutput$(): Promise<Subject<OutputMessage>> {
    return this.output$;
  }

  public async getOpenFiles$(): Promise<BehaviorSubject<EditorFiles>> {
    return this.openFiles$;
  }

  public async writeFile(path: string, content: string): Promise<void> {
    this.fs.writeFileSync(path, content);
  }

  public async build(): Promise<void> {
    const instance = await this.builder.getInstance();
    const result = await instance.build();

    result.files.forEach((file) => {
      ensureDir(this.fs, dirname(file.path));
      this.fs.writeFileSync(file.path, file.content);
    });
  }
}
