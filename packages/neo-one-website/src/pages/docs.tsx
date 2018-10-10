import * as React from 'react';
import { Redirect, withRouteData } from 'react-static';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { DocFooter, SectionProps, Sidebar } from '../components';
import { Markdown } from '../elements';
import { CoreLayout } from '../layout';
import { AdjacentInfo } from '../utils';

const DocMarkdown = styled(Markdown)`
  grid-area: markdown;
  padding-left: 240px;
  padding-right: 240px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding-left: 16px;
    padding-right: 16px;
  }
`;

const DocSidebar = styled(Sidebar)`
  grid-area: sidebar;
`;

const GridDocFooter = styled(DocFooter)`
  grid-area: footer;
`;

const StyledGrid = styled(Grid)`
  grid-template:
    'markdown sidebar' auto
    'footer sidebar' auto
    / 1fr 380px;
  grid-gap: 0;
  height: 100%;
  overflow-wrap: break-word;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-template:
      'sidebar' auto
      'markdown' auto
      'footer' auto
      / 100%;
  }
`;

interface DocData {
  readonly doc: string;
  readonly sidebar: ReadonlyArray<SectionProps>;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

// tslint:disable-next-line export-name no-default-export
export default withRouteData((props?: DocData) => {
  if (props === undefined) {
    return <Redirect to="/docs/getting-started" />;
  }
  const { doc, next, previous, sidebar } = props;

  return (
    <CoreLayout>
      <StyledGrid>
        <DocMarkdown source={doc} />
        <DocSidebar sectionProps={sidebar} />
        <GridDocFooter next={next} previous={previous} />
      </StyledGrid>
    </CoreLayout>
  );
});
