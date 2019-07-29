import styled from '@emotion/styled';
import { Box } from './Box';

export const LinkBase = styled(Box.withComponent('a'))`
  cursor: pointer;
`;

// tslint:disable-next-line:no-object-mutation
LinkBase.defaultProps = {
  palette: 'primary',
};
