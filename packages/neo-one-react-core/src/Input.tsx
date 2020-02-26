import { Box } from './Box';

// tslint:disable-next-line: no-any
export const Input = Box.withComponent<any>('input');

// tslint:disable-next-line:no-object-mutation
Input.defaultProps = {
  type: 'text',
  opaque: true,
  palette: 'white',
};
