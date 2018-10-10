import { FileTab } from '@neo-one/react-common';
import * as React from 'react';
import { Flex, styled } from 'reakit';
import { EditorFile, EditorFiles } from './types';

const Wrapper = styled(Flex)`
  flex: 0 0 auto;
  flex-wrap: nowrap;
  overflow-x: scroll;
`;

interface Props {
  readonly file?: EditorFile;
  readonly files: EditorFiles;
  readonly onSelectFile: (file: EditorFile) => void;
}

export const EditorHeader = ({ file, files, onSelectFile, ...props }: Props) => (
  <Wrapper {...props}>
    {files.map((otherFile, idx) => (
      <FileTab
        data-test={`editor-header-file-tab-${otherFile.path}`}
        key={otherFile.path}
        first={idx === 0}
        selected={file !== undefined && file.path === otherFile.path}
        onClick={() => onSelectFile(otherFile)}
        file={otherFile}
      />
    ))}
  </Wrapper>
);
