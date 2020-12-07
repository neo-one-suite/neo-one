import { common, crypto } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import { LocalKeyStore, LocalMemoryStore } from '../user';

const validators = [constants.PRIVATE_NET_PUBLIC_KEY].map(common.stringToECPoint);
const multiScriptHash = crypto.toScriptHash(crypto.createMultiSignatureVerificationScript(1, validators));
const multiAddress = crypto.scriptHashToAddress({
  addressVersion: common.NEO_ADDRESS_VERSION,
  scriptHash: multiScriptHash,
});

const singleScriptHash = crypto.privateKeyToScriptHash(common.stringToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY));
const singleAddress = crypto.scriptHashToAddress({
  addressVersion: common.NEO_ADDRESS_VERSION,
  scriptHash: singleScriptHash,
});

describe('debug signature contract tests', () => {
  const keystore = new LocalKeyStore(new LocalMemoryStore());

  test.only('addressVersion test', () => {
    const newPrivateKey = crypto.createPrivateKey();
    const newPublicKey = crypto.privateKeyToPublicKey(newPrivateKey);
    const newScriptHash = crypto.publicKeyToScriptHash(newPublicKey);
    const newAddress = crypto.scriptHashToAddress({ addressVersion: 0x35, scriptHash: newScriptHash });

    console.log({
      privateKey: common.privateKeyToString(newPrivateKey),
      publicKey: common.ecPointToString(newPublicKey),
      scriptHash: common.uInt160ToHex(newScriptHash),
      address: newAddress,
    });
  });

  test('single', async () => {
    await keystore.addUserAccount({
      network: 'local',
      privateKey: constants.PRIVATE_NET_PRIVATE_KEY,
      name: 'single',
    });
    const singleUser = keystore
      .getUserAccounts()
      .find((account) => account.id.network === 'local' && account.id.address === singleAddress);

    if (singleUser === undefined) {
      throw new Error('for ts');
    }

    const witnessScript = singleUser.contract.script;
    const result = crypto.isSignatureContract(witnessScript);

    expect(result).toEqual(true);
  });
  test('multi', async () => {
    await keystore.addMultiSigUserAccount({
      network: 'local',
      privateKeys: [constants.PRIVATE_NET_PRIVATE_KEY],
      name: 'multi',
    });

    const multiUser = keystore
      .getUserAccounts()
      .find((account) => account.id.network === 'local' && account.id.address === multiAddress);

    if (multiUser === undefined) {
      throw new Error('for ts');
    }

    const witnessScript = multiUser.contract.script;
    const { result } = crypto.isMultiSigContractWithResult(witnessScript);

    expect(result).toEqual(true);
  });
});
