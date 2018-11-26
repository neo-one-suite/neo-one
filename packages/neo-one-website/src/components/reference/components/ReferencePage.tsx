import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { ReferenceItem } from '../types';
import { Extra } from './Extra';
import { InterfaceClassItems } from './InterfaceClassItems';
import { ParameterPropertyList } from './ParameterPropertyList';
import { ParameterReturns } from './ParameterReturns';
import { ReferenceHeader } from './ReferenceHeader';

export interface Props {
  readonly content: ReferenceItem;
}

const PageLayout = styled(Box)`
  display: grid;
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

export const ReferencePage = ({ content, ...props }: Props) => (
  <PageLayout {...props}>
    <ReferenceHeader type={content.type} description={content.description} definition={content.definition} />
    {content.functionData === undefined ? undefined : <ParameterReturns functionData={content.functionData} />}
    {content.classData === undefined ? undefined : <InterfaceClassItems data={content.classData} />}
    {content.enumData === undefined ? (
      undefined
    ) : (
      <ParameterPropertyList values={content.enumData.members} title="Members" />
    )}
    {content.interfaceData === undefined ? undefined : <InterfaceClassItems data={content.interfaceData} />}
    {content.extra === undefined ? undefined : content.extra.map((extra) => <Extra data={extra} key={extra.title} />)}
  </PageLayout>
);
