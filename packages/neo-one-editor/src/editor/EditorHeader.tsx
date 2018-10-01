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
  readonly file?: EditorFile;
  readonly files: EditorFiles;
  readonly onSelectFile: (file: EditorFile) => void;
}

export const EditorHeader = ({ file, files, onSelectFile, ...props }: Props) => (
  <Wrapper {...props}>
    {files.map((otherFile, idx) => (
      <EditorFileTab
        key={otherFile.path}
        first={idx === 0}
        selected={file !== undefined && file.path === otherFile.path}
        onSelectFile={onSelectFile}
        file={otherFile}
      />
    ))}
  </Wrapper>
);
