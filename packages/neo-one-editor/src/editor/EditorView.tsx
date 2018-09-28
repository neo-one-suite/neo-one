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
  readonly selectedFile: EditorFile;
  readonly range?: TextRange;
  readonly files: EditorFiles;
  readonly onSelectFile: (file: EditorFile) => void;
  readonly onChangeFile: (file: EditorFile) => void;
  readonly onChangeProblems?: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) => void;
}

export const EditorView = ({
  selectedFile,
  range,
  files,
  onChangeFile,
  onChangeProblems,
  onSelectFile,
  ...props
}: Props & ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <EditorHeader selectedFile={selectedFile} files={files} onSelectFile={onSelectFile} />
    <MonacoEditor
      file={selectedFile}
      range={range}
      files={files}
      readOnly={!selectedFile.writable}
      onValueChange={(content) => onChangeFile({ ...selectedFile, content })}
      onUpdateDiagnostics={onChangeProblems}
    />
  </Wrapper>
);
