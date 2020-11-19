import {
  common,
  crypto,
  privateKeyToAddress,
  privateKeyToScriptHash,
  ScriptBuilder,
  scriptHashToAddress,
  SignerModel,
  TransactionModel,
  WitnessModel,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import BN from 'bn.js';
import { LocalKeyStore, LocalMemoryStore } from '../../user';

describe('RPC Call sendrawtransaction', () => {
  const keystore = new LocalKeyStore(new LocalMemoryStore());
  const messageMagic = 1951352142; // This is TestNet number. Make sure it matches the network's magic number

  test('Create a valid private net transaction with one signer', async () => {
    await keystore.addUserAccount({
      network: constants.LOCAL_NETWORK_NAME,
      privateKey: constants.PRIVATE_NET_PRIVATE_KEY,
      name: 'master',
    });

    const signer = new SignerModel({
      account: common.stringToUInt160(privateKeyToScriptHash(constants.PRIVATE_NET_PRIVATE_KEY)),
      scopes: WitnessScopeModel.None,
    });

    const txUnsigned = new TransactionModel({
      script: new ScriptBuilder().emitOp('PUSHNULL').build(),
      systemFee: new BN(0),
      networkFee: new BN(1590000),
      validUntilBlock: 800000,
      signers: [signer],
      messageMagic,
    });

    const signature = await keystore.sign({
      account: { network: 'local', address: privateKeyToAddress(constants.PRIVATE_NET_PRIVATE_KEY) },
      message: txUnsigned.message.toString('hex'),
    });

    const witness = crypto.createWitnessForSignature(
      Buffer.from(signature, 'hex'),
      common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY),
      WitnessModel,
    );

    const finalTransaction = txUnsigned.clone({ witnesses: [witness] });

    // tslint:disable-next-line: no-console
    console.log(finalTransaction.serializeWire().toString('hex'));
  });

  test('Create a valid private net transaction with multiple signers', async () => {
    await keystore.addUserAccount({
      network: constants.LOCAL_NETWORK_NAME,
      privateKey: constants.PRIVATE_NET_PRIVATE_KEY,
      name: 'master',
    });

    const standbyValidators = ['0248be3c070df745a60f3b8b494efcc6caf90244d803a9a72fe95d9bae2120ec70'].map((val) =>
      common.stringToECPoint(val),
    );

    // The sender needs to be the address of the multisig address
    const address = crypto.toScriptHash(
      crypto.createMultiSignatureVerificationScript(standbyValidators.length / 2 + 1, standbyValidators),
    );

    const signer = new SignerModel({
      account: address,
      scopes: WitnessScopeModel.None,
    });

    const txUnsigned = new TransactionModel({
      script: new ScriptBuilder().emitOp('PUSHNULL').build(),
      systemFee: new BN(0),
      networkFee: new BN(1590000),
      validUntilBlock: 800000,
      signers: [signer],
      messageMagic,
    });

    const signature = await keystore.sign({
      account: { network: 'local', address: privateKeyToAddress(constants.PRIVATE_NET_PRIVATE_KEY) },
      message: txUnsigned.message.toString('hex'),
    });

    const witness = crypto.createMultiSignatureWitness(
      standbyValidators.length / 2 + 1,
      standbyValidators,
      { [`${common.ecPointToHex(standbyValidators[0])}`]: Buffer.from(signature, 'hex') },
      WitnessModel,
    );

    const finalTransaction = txUnsigned.clone({ witnesses: [witness] });

    // tslint:disable-next-line: no-console
    console.log(finalTransaction.serializeWire().toString('hex'));
  });

  test('Get the private net initialization address from standby validators', async () => {
    // Standby validators is an array of public keys of the validators
    const standbyValidators = ['0248be3c070df745a60f3b8b494efcc6caf90244d803a9a72fe95d9bae2120ec70'].map((val) =>
      common.stringToECPoint(val),
    );
    const address = crypto.toScriptHash(
      // The first argument might have to be changed to: validators.length - (validators.length - 1) / 3
      crypto.createMultiSignatureVerificationScript(standbyValidators.length / 2 + 1, standbyValidators),
    );

    // The script hash and address printed here should match the script hash and address that is initialized in C# GasToken and NeoToken `initialize` methods
    // In this case that would be 0xa25e93cc2a5f7108c02e9e3b4898aad9d3e91486 and NY8vnYnwgxs3prMcxnQi7Mog7VHezJgfwx
    console.log(common.uInt160ToString(address));
    console.log(scriptHashToAddress(common.uInt160ToString(address)));
  });
});
