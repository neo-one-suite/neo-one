import * as React from 'react';
import { SectionData } from '../../types';
import { Content, ReferenceItemContent, ReferenceItemsContent } from '../content';

export interface ReferenceProps {
  readonly current: string;
  readonly title: string;
  readonly content: ReferenceItemsContent | ReferenceItemContent;
  readonly sidebar: ReadonlyArray<SectionData>;
}

export const Reference = (props: ReferenceProps) => <Content sidebarAlwaysVisible {...props} />;
