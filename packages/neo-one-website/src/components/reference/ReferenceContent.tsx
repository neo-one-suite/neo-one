import * as React from 'react';
import { ReferenceItemContent, ReferenceItemsContent } from '../content';
import { ReferenceGrid } from './ReferenceGrid';
import { ReferencePage } from './ReferencePage';

interface Props {
  readonly content: ReferenceItemsContent | ReferenceItemContent;
}

export const ReferenceContent = ({ content, ...props }: Props) =>
  content.type === 'referenceItems' ? (
    <ReferenceGrid content={content.value} {...props} />
  ) : (
    <ReferencePage content={content.value} />
  );
