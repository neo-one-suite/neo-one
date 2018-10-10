import { FileTab } from '@neo-one/react-common';
import { ActionMap, Container } from 'constate';
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { Markdown } from '../common';
import { selectChapter } from '../coursesData';
import { ChapterFile, SelectedChapter } from '../types';

const Wrapper = styled(Grid)`
  grid:
    'header' auto
    'solution' auto
    / auto;
  grid-gap: 0;
  min-height: 0;
  max-height: 480px;
  width: 100%;
`;

const HeaderWrapper = styled(Grid)`
  grid-auto-flow: column;
  grid-auto-columns: auto;
  grid-gap: 0;
  overflow-x: scroll;
  justify-content: start;
`;

const StyledMarkdown = styled(Markdown)`
  min-height: 0;
  overflow-y: scroll;
  padding: 0;

  &&& pre {
    margin: 0;
  }
`;

const getFiles = (selected: SelectedChapter) =>
  selectChapter(selected).files.filter((file) => file.initial !== undefined);

interface State {
  readonly selectedFilePath: string;
}

interface Actions {
  readonly onSelectFile: (file: ChapterFile) => void;
}

const actions: ActionMap<State, Actions> = {
  onSelectFile: (file: ChapterFile) => () => ({
    selectedFilePath: file.path,
  }),
};

interface Props {
  readonly selected: SelectedChapter;
}

export const DocsSolution = ({ selected, ...props }: Props) => (
  <Container initialState={{ selectedFilePath: getFiles(selected)[0].path }} actions={actions}>
    {({ selectedFilePath, onSelectFile }) => (
      <Wrapper {...props}>
        <HeaderWrapper>
          {getFiles(selected).map((file, idx) => (
            <FileTab
              data-test={`docs-solution-file-tab-${file.path}`}
              first={idx === 0}
              selected={file.path === selectedFilePath}
              file={{ path: file.path, writable: false }}
              onClick={() => onSelectFile(file)}
              omitReadOnly
            />
          ))}
        </HeaderWrapper>
        <StyledMarkdown
          data-test="docs-solution-markdown"
          source={`\`\`\`typescript\n${
            getFiles(selected).filter((file) => file.path === selectedFilePath)[0].solution
          }\`\`\``}
        />
      </Wrapper>
    )}
  </Container>
);
