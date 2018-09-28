import * as React from 'react';
import { withRouteData } from 'react-static';
// import { Markdown } from '../elements';
import { DocsLayout } from '../layout';

// tslint:disable-next-line export-name no-default-export
export default withRouteData(({ section }: { readonly section: string }) => <DocsLayout source={section} />);
