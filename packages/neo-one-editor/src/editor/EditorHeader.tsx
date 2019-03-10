import { Box, FileTab } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { PreviewButton } from './PreviewButton';
import { EditorFile, EditorFiles } from './types';

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 8px;
  justify-content: space-between;
`;

const FileTabWrapper = styled(Box)`
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  overflow-x: auto;
`;

const ActionWrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  padding-right: 8px;
`;

interface Props {
  readonly file?: EditorFile;
  readonly openFiles: EditorFiles;
  readonly onSelectFile: (file: EditorFile) => void;
}

export const EditorHeader = ({ file, openFiles, onSelectFile, ...props }: Props) => (
  <Wrapper>
    <FileTabWrapper {...props}>
      {openFiles.map((otherFile, idx) => (
        <FileTab
          data-test={`editor-header-file-tab-${otherFile.path}`}
          key={otherFile.path}
          first={idx === 0}
          selected={file !== undefined && file.path === otherFile.path}
          onClick={() => onSelectFile(otherFile)}
          file={otherFile}
        />
      ))}
    </FileTabWrapper>
    <ActionWrapper>
      <PreviewButton />
    </ActionWrapper>
  </Wrapper>
);
