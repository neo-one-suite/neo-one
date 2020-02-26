// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
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

const PageLayout = styled(Box)<{}, {}>`
  display: grid;
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

export const ReferencePage = ({ content, ...props }: Props) => (
  <PageLayout {...props}>
    <ReferenceHeader type={content.type} description={content.description} definition={content.definition} />
    {content.functionData === undefined ? null : <ParameterReturns functionData={content.functionData} />}
    {content.classData === undefined ? null : <InterfaceClassItems data={content.classData} />}
    {content.enumData === undefined ? null : (
      <ParameterPropertyList values={content.enumData.members} title="Members" />
    )}
    {content.constData === undefined ? null : <InterfaceClassItems data={content.constData} />}
    {content.interfaceData === undefined ? null : <InterfaceClassItems data={content.interfaceData} />}
    {content.extra === undefined ? null : content.extra.map((extra) => <Extra data={extra} key={extra.title} />)}
  </PageLayout>
);
