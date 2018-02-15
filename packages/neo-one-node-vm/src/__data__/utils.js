/* @flow */
import { utils as commonUtils } from '@neo-one/utils';

// eslint-disable-next-line
export const verifyBlockchainSnapshot = (blockchain: any) => {
  commonUtils.values(blockchain).forEach(obj => {
    if (typeof obj === 'object') {
      commonUtils.values(obj).forEach(maybeMock => {
        if (maybeMock != null && maybeMock.mock != null) {
          expect(maybeMock.mock.calls).toMatchSnapshot();
        }
      });
    }
  });
};
