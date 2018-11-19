import { Box } from './Box';

export const Input = Box.withComponent('input');

// tslint:disable-next-line:no-object-mutation
Input.defaultProps = {
  type: 'text',
  opaque: true,
  palette: 'white',
};
