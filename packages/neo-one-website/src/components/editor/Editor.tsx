import * as React from 'react';
import { Flex, styled } from 'reakit';
import { ComponentProps } from '../../types';
import { EditorHeader } from './EditorHeader';
import { EditorView } from './EditorView';
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

export const Editor = ({
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
    <EditorView
      selectedFile={selectedFile}
      range={range}
      files={files}
      onChangeFile={onChangeFile}
      onChangeProblems={onChangeProblems}
    />
  </Wrapper>
);
