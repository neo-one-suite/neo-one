import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { ParameterList } from './ParameterList';
import { ReferenceHeader } from './ReferenceHeader';
import { ReferenceItem } from './types';

export interface Props {
  readonly content: ReferenceItem;
}

const PageLayout = styled(Box)`
  display: grid;
  gap: 16px;
`;

export const ReferencePage = ({ content, ...props }: Props) => (
  <PageLayout {...props}>
    <ReferenceHeader type={content.type} description={content.description} definition={content.definition} />
    {content.parameters === undefined ? undefined : <ParameterList parameters={content.parameters} />}
  </PageLayout>
);
