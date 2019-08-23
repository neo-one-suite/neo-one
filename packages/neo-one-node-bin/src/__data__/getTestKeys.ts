import { common, crypto } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';

export const getTestKeys = () => {
  const privateKey = common.stringToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY);
  const publicKey = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
  crypto.addPublicKey(privateKey, publicKey);

  const standbyValidator = common.ecPointToString(publicKey);
  const address = common.uInt160ToString(crypto.privateKeyToScriptHash(privateKey));
  const privateKeyString = common.privateKeyToString(privateKey);

  return { standbyValidator, address, privateKeyString };
};
