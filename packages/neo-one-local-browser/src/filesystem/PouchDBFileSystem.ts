import { DataWriter } from '../DataWriter';
import { createENOENT, createENOTDIR } from './errors';
import { FileStat, FileSystem } from './types';
import { normalizePath } from './utils';

type Database = PouchDB.Database<PouchDBFileSystemDoc>;
interface File {
  readonly content: string;
  readonly _rev: string;
}
type Files = Map<string, File>;
export interface PouchDBFileSystemDoc {
  readonly content: string;
}
interface Doc extends PouchDBFileSystemDoc {
  readonly _id: string;
  readonly content: string;
  readonly _rev?: string;
  readonly _deleted?: boolean;
}

interface WriteEntry {
  readonly type: 'write';
  readonly content: string;
}
interface RemoveEntry {
  readonly type: 'remove';
}
type Entry = WriteEntry | RemoveEntry;

export class PouchDBFileSystem implements FileSystem {
  public static async create(db: Database): Promise<PouchDBFileSystem> {
    const mutableFiles: Files = new Map();
    const changes = db.changes({ since: 'now', live: true, include_docs: true }).on('change', (change) => {
      if (change.doc === undefined) {
        mutableFiles.delete(change.id);
      } else {
        mutableFiles.set(change.id, { content: change.doc.content, _rev: change.doc._rev });
      }
    });

    const docs = await db.allDocs({ include_docs: true });
    // tslint:disable-next-line no-loop-statement
    for (const row of docs.rows) {
      if (row.doc !== undefined) {
        mutableFiles.set(row.id, { content: row.doc.content, _rev: row.doc._rev });
      }
    }

    return new PouchDBFileSystem(db, changes, mutableFiles);
  }

  private readonly writer: DataWriter<string, Entry, PouchDB.Core.Response>;

  private constructor(
    public readonly db: Database,
    public readonly changes: PouchDB.Core.Changes<PouchDBFileSystemDoc>,
    public readonly files: Files,
  ) {
    this.writer = new DataWriter(async (batch) => {
      const mutableBulk: Doc[] = [];
      // tslint:disable-next-line no-loop-statement
      for (const [path, entry] of batch.entries()) {
        const value = this.files.get(path);
        if (entry.type === 'remove') {
          if (value !== undefined) {
            mutableBulk.push({ _id: path, content: value.content, _rev: value._rev, _deleted: true });
          }
        } else {
          const doc = { _id: path, content: entry.content };
          mutableBulk.push(value === undefined ? doc : { ...doc, _rev: value._rev });
        }
      }

      const results = await db.bulkDocs(mutableBulk);
      // tslint:disable-next-line no-any
      const badResult = results.find((result: any) => !result.ok);
      if (badResult) {
        throw new Error('Failed to write');
      }

      const output = new Map<string, PouchDB.Core.Response>();
      results.forEach((resultIn) => {
        const result = resultIn as PouchDB.Core.Response;
        output.set(result.id, result);
      });

      return output;
    });
  }

  public readonly dispose = async () => {
    this.changes.cancel();
    await this.db.close();
  };

  public readonly statSync = (path: string): FileStat =>
    this.files.has(normalizePath(path))
      ? { isDirectory: () => false, isFile: () => true }
      : { isDirectory: () => true, isFile: () => false };

  public readonly readFileSync = (pathIn: string): string => {
    const path = normalizePath(pathIn);
    const value = this.files.get(path);
    if (value === undefined) {
      throw createENOENT(path);
    }

    return value.content;
  };

  public readonly readdirSync = (pathIn: string): ReadonlyArray<string> => {
    const path = normalizePath(pathIn);
    if (this.files.has(path)) {
      throw createENOTDIR(path);
    }
    const pathWithTrailing = path === '/' ? path : `${path}/`;

    const mutableOutput = new Set<string>();
    // tslint:disable-next-line no-loop-statement
    for (const otherPath of this.files.keys()) {
      if (otherPath.startsWith(pathWithTrailing)) {
        let filePath = otherPath.slice(pathWithTrailing.length);
        const index = filePath.indexOf('/');
        if (index !== -1) {
          filePath = filePath.slice(0, index);
        }
        mutableOutput.add(filePath);
      }
    }

    return [...mutableOutput];
  };

  public readonly writeFile = async (pathIn: string, content: string): Promise<void> => {
    const path = normalizePath(pathIn);
    const response = await this.writer.write(path, { type: 'write', content });
    this.files.set(path, { content, _rev: response.rev });
  };

  public readonly removeFile = async (pathIn: string): Promise<void> => {
    const path = normalizePath(pathIn);
    await this.writer.write(path, { type: 'remove' });
    this.files.delete(path);
  };
}
