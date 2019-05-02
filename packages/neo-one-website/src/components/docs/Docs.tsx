// tslint:disable-next-line no-import-side-effect
import * as React from 'react';
import { AdjacentInfo, SectionData } from '../../types';
import { Content, MarkdownContent } from '../content';

export interface DocsProps {
  readonly current: string;
  readonly title: string;
  readonly link: string;
  readonly content: MarkdownContent;
  readonly sidebar: readonly SectionData[];
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

export const Docs = (props: DocsProps) => <Content sidebarAlwaysVisible={false} {...props} />;
