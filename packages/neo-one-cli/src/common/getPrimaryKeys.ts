import { common, crypto } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';

export const getPrimaryKeys = () => {
  const privateKey = common.stringToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY);
  const publicKey = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
  crypto.addPublicKey(privateKey, publicKey);

  return { privateKey, publicKey };
};
