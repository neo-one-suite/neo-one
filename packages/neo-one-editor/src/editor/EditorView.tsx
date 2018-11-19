import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { EditorContext } from '../EditorContext';
import { EditorContextType } from '../types';
import { EditorHeader } from './EditorHeader';
import { MonacoEditor } from './MonacoEditor';
import { EditorFile, EditorFiles, FileDiagnostic, TextRange } from './types';

const Wrapper = styled(Box)`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

interface Props {
  readonly file?: EditorFile;
  readonly range?: TextRange;
  readonly openFiles: EditorFiles;
  readonly onSelectFile: (file: EditorFile) => void;
  readonly onChangeProblems?: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) => void;
}

export const EditorView = ({
  file,
  range,
  openFiles,
  onChangeProblems,
  onSelectFile,
  ...props
}: Props & React.ComponentProps<typeof Wrapper>) => (
  <Wrapper {...props}>
    <EditorHeader file={file} openFiles={openFiles} onSelectFile={onSelectFile} />
    <EditorContext.Consumer>
      {({ engine }: EditorContextType) => (
        <MonacoEditor
          file={file}
          files={openFiles}
          range={range}
          engine={engine}
          onUpdateDiagnostics={onChangeProblems}
        />
      )}
    </EditorContext.Consumer>
  </Wrapper>
);
