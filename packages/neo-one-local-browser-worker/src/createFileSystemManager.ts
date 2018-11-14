import { FileSystemManager } from './FileSystemManager';

// tslint:disable-next-line no-let
let fileSystemManager: FileSystemManager | undefined;
export const createFileSystemManager = () => {
  if (fileSystemManager === undefined) {
    fileSystemManager = new FileSystemManager();
  }

  return fileSystemManager;
};
