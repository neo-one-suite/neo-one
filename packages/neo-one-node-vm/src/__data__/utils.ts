import { StorageItem, utils } from '@neo-one/client-core';

export const verifyBlockchainSnapshot = (blockchain: any) => {
  Object.values(blockchain).forEach((obj) => {
    if (typeof obj === 'object') {
      Object.values(obj).forEach((maybeMock) => {
        if (maybeMock != null && maybeMock.mock != null) {
          expect(maybeMock.mock.calls).toMatchSnapshot();
        }
      });
    }
  });
};

export const verifyListeners = (listeners: any) => {
  Object.values(listeners).forEach((func: any) => {
    expect(func.mock.calls).toMatchSnapshot();
  });
};

export const expectItemBNEquals = (item: StorageItem, value: string) => {
  expect(utils.fromSignedBuffer(item.value).toString(10)).toEqual(value);
};
