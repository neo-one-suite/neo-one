/* @flow */
import { type StorageItem, utils } from '@neo-one/client-core';
import { utils as commonUtils } from '@neo-one/utils';

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

export const expectItemBNEquals = (item: StorageItem, value: string) => {
  expect(utils.fromSignedBuffer(item.value).toString(10)).toEqual(value);
};
