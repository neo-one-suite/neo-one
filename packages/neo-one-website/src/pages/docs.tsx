import * as React from 'react';
import { withRouteData } from 'react-static';
import { SectionProps, Sidebar } from '../components';
import { Markdown } from '../elements';
import { DocsLayout } from '../layout';
import { AdjacentInfo } from '../utils';

interface DocData {
  readonly doc: string;
  readonly sidebar: ReadonlyArray<SectionProps>;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

// tslint:disable-next-line export-name no-default-export
export default withRouteData(({ doc, next, previous, sidebar }: DocData) => (
  <DocsLayout next={next} previous={previous}>
    <Markdown source={doc} />
    <Sidebar sectionProps={sidebar} />
  </DocsLayout>
));
