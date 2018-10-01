import { FileSystem } from '@neo-one/local-browser';
import * as React from 'react';
import { Flex, styled } from 'reakit';
import { ComponentProps } from '../types';
import { EditorHeader } from './EditorHeader';
import { MonacoEditor } from './MonacoEditor';
import { EditorFile, EditorFiles, FileDiagnostic, TextRange } from './types';

const Wrapper = styled(Flex)`
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

interface Props {
  readonly file?: EditorFile;
  readonly range?: TextRange;
  readonly files: EditorFiles;
  readonly fs: FileSystem;
  readonly fileSystemID: string;
  readonly onSelectFile: (file: EditorFile) => void;
  readonly onChangeProblems?: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) => void;
}

export const EditorView = ({
  file,
  range,
  files,
  onChangeProblems,
  onSelectFile,
  fs,
  fileSystemID,
  ...props
}: Props & ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <EditorHeader file={file} files={files} onSelectFile={onSelectFile} />
    <MonacoEditor
      file={file}
      range={range}
      files={files}
      fs={fs}
      fileSystemID={fileSystemID}
      onUpdateDiagnostics={onChangeProblems}
    />
  </Wrapper>
);
