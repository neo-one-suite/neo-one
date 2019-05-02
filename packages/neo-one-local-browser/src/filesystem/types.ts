export interface FileStat {
  readonly isFile: () => boolean;
  readonly isDirectory: () => boolean;
}

export interface FileSystem {
  readonly statSync: (path: string) => FileStat;
  readonly readFileSync: (path: string) => string;
  readonly readdirSync: (path: string) => readonly string[];
  readonly writeFile: (path: string, content: string) => Promise<void>;
}
