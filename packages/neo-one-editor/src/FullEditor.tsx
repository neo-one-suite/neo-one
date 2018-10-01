import {
  dirname,
  ensureDir,
  FileSystem,
  initializeFileSystem,
  LocalForageFileSystem,
  MemoryFileSystem,
  MirrorFileSystem,
  pathExists,
} from '@neo-one/local-browser';
import { Container, OnMountProps } from 'constate';
import * as React from 'react';
import { METADATA_FILE } from './constants';
import { Editor, EditorFiles } from './editor';
import { Loading } from './Loading';
import { FileMetadata, FileSystemMetadata } from './types';

export interface EditorContentFile {
  readonly path: string;
  readonly content: string;
  readonly writable: boolean;
  readonly open: boolean;
}

export type EditorContentFiles = ReadonlyArray<EditorContentFile>;

interface State {
  readonly fileSystemID: string;
  readonly initialFiles: EditorContentFiles;
  readonly files: EditorFiles;
  readonly fs?: FileSystem;
}

const onMount = ({ state: { fileSystemID, initialFiles }, setState }: OnMountProps<State>) => {
  MirrorFileSystem.create(new MemoryFileSystem(), new LocalForageFileSystem(fileSystemID))
    .then(async (fs) => {
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

      setState({
        fs,
        files: metadata.files.map((file) => {
          const fileMetadata = metadata.fileMetadata[file] as FileMetadata | undefined;

          return {
            path: file,
            writable: fileMetadata === undefined ? true : fileMetadata.writable,
          };
        }),
      });
    })
    .catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });
};

interface Props {
  readonly id: string;
  readonly initialFiles: EditorContentFiles;
}
export const FullEditor = ({ id, initialFiles, ...props }: Props) => (
  <Container initialState={{ fileSystemID: id, initialFiles, files: [] }} onMount={onMount}>
    {({ files, fs, fileSystemID }) =>
      fs === undefined ? (
        <Loading {...props} />
      ) : (
        <Editor files={files} fs={fs} fileSystemID={fileSystemID} {...props} />
      )
    }
  </Container>
);
