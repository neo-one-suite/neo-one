import * as React from 'react';
import { Flex, styled } from 'reakit';
import { EditorFileTab } from './EditorFileTab';
import { EditorFile, EditorFiles } from './types';

const Wrapper = styled(Flex)`
  flex: 0 0 auto;
  flex-wrap: no-wrap;
  overflow-x: scroll;
`;

interface Props {
  readonly selectedFile: EditorFile;
  readonly files: EditorFiles;
  readonly onSelectFile: (file: EditorFile) => void;
}

export const EditorHeader = ({ selectedFile, files, onSelectFile, ...props }: Props) => (
  <Wrapper {...props}>
    {files.map((file, idx) => (
      <EditorFileTab
        key={file.path}
        first={idx === 0}
        selected={selectedFile.path === file.path}
        onSelectFile={onSelectFile}
        file={file}
      />
    ))}
  </Wrapper>
);
