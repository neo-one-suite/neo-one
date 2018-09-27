import * as React from 'react';
import { withRouteData } from 'react-static';
import { Markdown } from '../elements';

// tslint:disable-next-line export-name no-default-export
export default withRouteData(({ section }: { readonly section: string }) => <Markdown source={section} />);
