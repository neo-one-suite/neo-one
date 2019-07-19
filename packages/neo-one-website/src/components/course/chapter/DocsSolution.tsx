import styled from '@emotion/styled';
import { Box, FileTab } from '@neo-one/react-common';
import * as React from 'react';
import { Markdown } from '../common';
import { selectChapter } from '../coursesData';
import { SelectedChapter } from '../types';

const { useState } = React;

const Wrapper = styled(Box)`
  display: grid;
  grid:
    'header' auto
    'solution' 1fr
    / auto;
  grid-gap: 0;
  min-height: 0;
  max-height: 480px;
  width: 100%;
`;

const HeaderWrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: auto;
  grid-gap: 0;
  overflow-x: auto;
  justify-content: start;
`;

const StyledMarkdown = styled(Markdown)`
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;

  &&& pre {
    margin: 0;
  }
`;

const getFiles = (selected: SelectedChapter) =>
  selectChapter(selected).files.filter((file) => file.initial !== undefined);

interface Props {
  readonly selected: SelectedChapter;
}

export const DocsSolution = ({ selected, ...props }: Props) => {
  const [selectedFilePath, setSelectedFilePath] = useState(getFiles(selected)[0].path);
  const foundFile = getFiles(selected).find((file) => file.path === selectedFilePath);
  if (foundFile === undefined) {
    setSelectedFilePath(getFiles(selected)[0].path);
  }

  return (
    <Wrapper {...props}>
      <HeaderWrapper>
        {getFiles(selected).map((file, idx) => (
          <FileTab
            key={file.path}
            data-test={`docs-solution-file-tab-${file.path}`}
            first={idx === 0}
            selected={file.path === selectedFilePath}
            file={{ path: file.path, writable: false }}
            onClick={() => setSelectedFilePath(file.path)}
            omitReadOnly
          />
        ))}
      </HeaderWrapper>
      <StyledMarkdown
        data-test="docs-solution-markdown"
        source={`\`\`\`typescript\n${foundFile === undefined ? '' : foundFile.solution}\`\`\``}
      />
    </Wrapper>
  );
};
