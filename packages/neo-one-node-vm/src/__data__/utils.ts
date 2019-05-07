import { utils } from '@neo-one/client-common';
import { StorageItem } from '@neo-one/node-core';

// tslint:disable-next-line no-any
export const verifyBlockchainSnapshot = (blockchain: any) => {
  Object.values(blockchain).forEach((obj) => {
    if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach((maybeMock) => {
        if (maybeMock != undefined && maybeMock.mock != undefined) {
          expect(maybeMock.mock.calls).toMatchSnapshot();
        }
      });
    }
  });
};

// tslint:disable-next-line no-any
export const verifyListeners = (listeners: any) => {
  // tslint:disable-next-line no-any
  Object.values(listeners).forEach((func: any) => {
    expect(func.mock.calls).toMatchSnapshot();
  });
};

export const expectItemBNEquals = (item: StorageItem, value: string) => {
  expect(utils.fromSignedBuffer(item.value).toString(10)).toEqual(value);
};

// tslint:disable-next-line:no-any readonly-array
export const badSeen = (...args: any[]) => new Set(args);
