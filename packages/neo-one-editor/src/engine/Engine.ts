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
import { WorkerManager } from '@neo-one/worker';
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

  public readonly id: string;
  public readonly output$: Subject<OutputMessage>;
  public readonly fs: FileSystem;
  public readonly openFiles$: BehaviorSubject<EditorFiles>;
  private readonly builder: WorkerManager<typeof Builder>;

  private constructor({ id, output$, fs, builder, files }: EngineOptions) {
    this.id = id;
    this.output$ = output$;
    this.fs = fs;
    this.openFiles$ = new BehaviorSubject(files);
    this.builder = builder;
  }

  public writeFileSync(path: string, content: string): void {
    this.fs.writeFileSync(path, content);
  }

  public async build(): Promise<void> {
    const instance = await this.builder.getInstance();
    const result = await instance.build();

    result.files.forEach((file) => {
      ensureDir(this.fs, dirname(file.path));
      this.writeFileSync(file.path, file.content);
    });
  }
}
