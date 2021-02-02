import { common, crypto, ECPoint, PrivateKey, PublicKeyString, UInt160 } from '@neo-one/client-common';

export const keys: ReadonlyArray<{
  readonly name: string;
  readonly address: string;
  readonly privateKey: PrivateKey;
  readonly privateKeyString: string;
  readonly publicKey: ECPoint;
  readonly publicKeyString: PublicKeyString;
  readonly wif: string;
  readonly password: string;
  readonly encryptedWIF: string;
  readonly scriptHash: UInt160;
  readonly scriptHashString: string;
}> = [
  {
    name: 'first',
    address: 'NNWAo5vdVJz1oyCuNiaTBA3amBHnWCF4Yk',
    privateKey: common.bufferToPrivateKey(
      Buffer.from('7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344', 'hex'),
    ),
    privateKeyString: '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344',
    publicKey: common.bufferToECPoint(
      Buffer.from('02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef', 'hex'),
    ),
    publicKeyString: common.ecPointToString(
      common.bufferToECPoint(Buffer.from('02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef', 'hex')),
    ),
    wif: 'L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g',
    password: 'city of zion',
    encryptedWIF: '6PYLHmDf6AjF4AsVtosmxHuPYeuyJL3SLuw7J1U8i7HxKAnYNsp61HYRfF',
    scriptHash: common.hexToUInt160('36a6e6a7c4658acf096f5d288cc81129c815681c'),
    scriptHashString: '36a6e6a7c4658acf096f5d288cc81129c815681c',
  },
  {
    name: 'second',
    address: 'NiwvMyWYeNghLG8tDyKkWwuZV3wS8CPrrV',
    privateKey: common.bufferToPrivateKey(
      Buffer.from('9ab7e154840daca3a2efadaf0df93cd3a5b51768c632f5433f86909d9b994a69', 'hex'),
    ),
    privateKeyString: '9ab7e154840daca3a2efadaf0df93cd3a5b51768c632f5433f86909d9b994a69',
    publicKey: common.bufferToECPoint(
      Buffer.from('031d8e1630ce640966967bc6d95223d21f44304133003140c3b52004dc981349c9', 'hex'),
    ),
    publicKeyString: common.ecPointToString(
      common.bufferToECPoint(Buffer.from('031d8e1630ce640966967bc6d95223d21f44304133003140c3b52004dc981349c9', 'hex')),
    ),
    wif: 'L2QTooFoDFyRFTxmtiVHt5CfsXfVnexdbENGDkkrrgTTryiLsPMG',
    password: '我的密码',
    encryptedWIF: '6PYWVp3xfgvnuNKP7ZavSViYvvim2zuzx9Q33vuWZr8aURiKeJ6Zm7BfPQ',
    scriptHash: common.hexToUInt160('5461c33e9bbc7de7076754540ba9e62b255ea9fc'),
    scriptHashString: '5461c33e9bbc7de7076754540ba9e62b255ea9fc',
  },
  {
    name: 'third',
    address: 'NTWHAzB82LRGWNuuqjVyyzpGvF3WxbbPoG',
    privateKey: common.bufferToPrivateKey(
      Buffer.from('3edee7036b8fd9cef91de47386b191dd76db2888a553e7736bb02808932a915b', 'hex'),
    ),
    privateKeyString: '3edee7036b8fd9cef91de47386b191dd76db2888a553e7736bb02808932a915b',
    publicKey: common.bufferToECPoint(
      Buffer.from('02232ce8d2e2063dce0451131851d47421bfc4fc1da4db116fca5302c0756462fa', 'hex'),
    ),
    publicKeyString: common.ecPointToString(
      common.bufferToECPoint(Buffer.from('02232ce8d2e2063dce0451131851d47421bfc4fc1da4db116fca5302c0756462fa', 'hex')),
    ),
    wif: 'KyKvWLZsNwBJx5j9nurHYRwhYfdQUu9tTEDsLCUHDbYBL8cHxMiG',
    password: 'MyL33tP@33w0rd',
    encryptedWIF: '6PYNoc1EG5J38MTqGN9Anphfdd6UwbS4cpFCzHhrkSKBBbV1qkbJJZQnkn',
    scriptHash: common.hexToUInt160('a38db239bb36ace1a69eb727a5b0157baa094653'),
    scriptHashString: 'a38db239bb36ace1a69eb727a5b0157baa094653',
  },
];

export const addKeysToCrypto = () => {
  keys.forEach(({ privateKey, publicKey }) => {
    crypto.addPublicKey(privateKey, publicKey);
  });
};
