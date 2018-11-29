import * as React from 'react';
import { ReferenceItemContent, ReferenceItemsContent } from '../content';
import { ReferencePage } from './components';
import { ReferenceGrid } from './ReferenceGrid';

interface Props {
  readonly content: ReferenceItemsContent | ReferenceItemContent;
}

export const ReferenceContent = ({ content, ...props }: Props) =>
  content.type === 'referenceItems' ? (
    <ReferenceGrid content={content.value} {...props} />
  ) : (
    <ReferencePage content={content.value} />
  );
