import * as React from 'react';
import { Flex, styled } from 'reakit';
import { EditorContext } from '../EditorContext';
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
  readonly buildFiles: EditorFiles;
  readonly onSelectFile: (file: EditorFile) => void;
  readonly onChangeProblems?: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) => void;
}

export const EditorView = ({
  file,
  range,
  files,
  buildFiles,
  onChangeProblems,
  onSelectFile,
  ...props
}: Props & ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <EditorHeader file={file} files={files} onSelectFile={onSelectFile} />
    <EditorContext.Consumer>
      {({ engine }) => (
        <MonacoEditor
          file={file}
          range={range}
          files={files.concat(buildFiles)}
          engine={engine}
          onUpdateDiagnostics={onChangeProblems}
        />
      )}
    </EditorContext.Consumer>
  </Wrapper>
);
