import { LoadingDots } from '@neo-one/react-common';
import * as React from 'react';
import { MdDone, MdError, MdFiberManualRecord } from 'react-icons/md';
import styled from 'styled-components';
import { prop } from 'styled-tools';

const Failed = styled(MdError)`
  color: ${prop('theme.error')};
`;

const Passed = styled(MdDone)`
  color: ${prop('theme.primaryDark')};
`;

const Skipped = styled(MdFiberManualRecord)`
  & > circle {
    fill: ${prop('theme.gray3')};
  }
`;

interface Props {
  readonly running: boolean;
  readonly failing: boolean;
  readonly passing: boolean;
}
export const TestIcon = ({ running, failing, passing, ...props }: Props) => {
  if (running) {
    return <LoadingDots {...props} data-test="test-icon-running" />;
  }

  if (failing) {
    return <Failed {...props} data-test="test-icon-failing" />;
  }

  if (passing) {
    return <Passed {...props} data-test="test-icon-passing" />;
  }

  return <Skipped {...props} data-test="test-icon-skipped" />;
};
