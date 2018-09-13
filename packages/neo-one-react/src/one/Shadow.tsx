import { as, styled } from 'reakit';
import { withProp } from 'styled-tools';
import { Fit } from './Fit';

export const Shadow = as('div')(styled(Fit)`
  border-radius: inherit;
  pointer-events: none;
  box-shadow: ${withProp('depth', (d) => `0 ${d * 2}px ${d * 4}px rgba(0, 0, 0, 0.2)`)};

  &&& {
    margin: 0;
  }
`);
