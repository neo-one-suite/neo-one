import styled from '@emotion/styled';
import { Box } from './Box';
import { ColorProps } from './styledProps';

export const LinkBase = styled(Box.withComponent('a'))<ColorProps>`
  cursor: pointer;
`;

// tslint:disable-next-line:no-object-mutation
LinkBase.defaultProps = {
  palette: 'primary',
};
