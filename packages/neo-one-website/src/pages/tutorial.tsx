import * as React from 'react';
import { withRouteData } from 'react-static';
import { TutorialSidebar } from '../components';
import { Markdown } from '../elements';
import { TutorialLayout } from '../layout';
import { TutorialInfo } from '../utils';

// tslint:disable-next-line export-name no-default-export
export default withRouteData(({ tutorial, sections }: TutorialInfo) => (
  <TutorialLayout>
    <Markdown source={tutorial} />
    <TutorialSidebar sections={sections} />
  </TutorialLayout>
));
