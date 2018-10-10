import * as React from 'react';
import { withRouteData } from 'react-static';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { TutorialSidebar } from '../components';
import { Markdown } from '../elements';
import { CoreLayout } from '../layout';
import { TutorialInfo } from '../utils';

const GridTutorialSidebar = styled(TutorialSidebar)`
  grid-area: sidebar;
`;

const TutorialMarkdown = styled(Markdown)`
  grid-area: markdown;
  padding-left: 240px;
  padding-right: 240px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding-left: 16px;
    padding-right: 16px;
  }
`;

const StyledGrid = styled(Grid)`
  grid-template:
    'markdown sidebar' auto
    / 1fr 380px;
  grid-gap: 0;
  height: 100%;
  overflow-wrap: break-word;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-template:
      'sidebar' auto
      'markdown' auto
      / 100%;
  }
`;

// tslint:disable-next-line export-name no-default-export
export default withRouteData(({ tutorial, sections }: TutorialInfo) => (
  <CoreLayout>
    <StyledGrid>
      <TutorialMarkdown source={tutorial} />
      <GridTutorialSidebar sections={sections} />
    </StyledGrid>
  </CoreLayout>
));
