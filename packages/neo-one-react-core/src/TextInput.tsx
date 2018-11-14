import { Input, styled } from 'reakit';
import { prop } from 'styled-tools';

export const TextInput = styled(Input)`
  padding: 0 4px;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  background-color: ${prop('theme.gray1')};
  border: 1px solid rgba(0, 0, 0, 0.3);
  height: 40px;
`;
