import { common } from '@neo-one/client-core';

export const keys = [
  {
    name: 'first',
    address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
    privateKey: common.bufferToPrivateKey(
      Buffer.from('7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344', 'hex'),
    ),
    publicKey: common.bufferToECPoint(
      Buffer.from('02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef', 'hex'),
    ),
    wif: 'L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g',
    password: 'city of zion',
    encryptedWIF: '6PYLHmDf6AjF4AsVtosmxHuPYeuyJL3SLuw7J1U8i7HxKAnYNsp61HYRfF',
    scriptHash: common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex')),
  },
  {
    name: 'second',
    address: 'ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s',
    privateKey: common.bufferToPrivateKey(
      Buffer.from('9ab7e154840daca3a2efadaf0df93cd3a5b51768c632f5433f86909d9b994a69', 'hex'),
    ),
    publicKey: common.bufferToECPoint(
      Buffer.from('031d8e1630ce640966967bc6d95223d21f44304133003140c3b52004dc981349c9', 'hex'),
    ),
    wif: 'L2QTooFoDFyRFTxmtiVHt5CfsXfVnexdbENGDkkrrgTTryiLsPMG',
    password: '我的密码',
    encryptedWIF: '6PYWVp3xfgvnuNKP7ZavSViYvvim2zuzx9Q33vuWZr8aURiKeJ6Zm7BfPQ',
    scriptHash: common.bufferToUInt160(Buffer.from('35b20010db73bf86371075ddfba4e6596f1ff35d', 'hex')),
  },
  {
    name: 'third',
    address: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
    privateKey: common.bufferToPrivateKey(
      Buffer.from('3edee7036b8fd9cef91de47386b191dd76db2888a553e7736bb02808932a915b', 'hex'),
    ),
    publicKey: common.bufferToECPoint(
      Buffer.from('02232ce8d2e2063dce0451131851d47421bfc4fc1da4db116fca5302c0756462fa', 'hex'),
    ),
    wif: 'KyKvWLZsNwBJx5j9nurHYRwhYfdQUu9tTEDsLCUHDbYBL8cHxMiG',
    password: 'MyL33tP@33w0rd',
    encryptedWIF: '6PYNoc1EG5J38MTqGN9Anphfdd6UwbS4cpFCzHhrkSKBBbV1qkbJJZQnkn',
    scriptHash: common.bufferToUInt160(Buffer.from('9847e26135152874355e324afd5cc99f002acb33', 'hex')),
  },
];
