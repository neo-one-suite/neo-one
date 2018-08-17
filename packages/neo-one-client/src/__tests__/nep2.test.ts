// tslint:disable no-object-mutation no-any
import BigNumber from 'bignumber.js';
import { data, factory, keys } from '../__data__';
import { Client } from '../Client';
import * as nep5 from '../nep5';
import { ReadClient } from '../ReadClient';

describe('nep2', () => {
  test('abi', () => {
    expect(nep5.abi(4)).toMatchSnapshot();
  });

  const readSmartContract: { decimals?: () => BigNumber } = {};
  const readClientSmartContract = jest.fn(() => readSmartContract);
  const readClient: ReadClient = {
    smartContract: readClientSmartContract,
  } as any;

  const smartContract: { decimals?: () => BigNumber } = {};
  const clientSmartContract = jest.fn(() => smartContract);
  const client: Client = {
    smartContract: clientSmartContract,
  } as any;

  test('getDecimals', async () => {
    readSmartContract.decimals = jest.fn(() => data.bigNumbers.a);

    const result = await nep5.getDecimals(readClient, keys[0].address);

    expect(result).toEqual(data.bigNumbers.a.toNumber());
  });

  test('createNEP5SmartContract', () => {
    const contract = nep5.createNEP5SmartContract(client, factory.createSmartContractDefinition().networks, 8);

    expect(contract).toEqual(smartContract);
    expect(clientSmartContract.mock.calls).toMatchSnapshot();
  });

  test('createNEP5ReadSmartContract', () => {
    const contract = nep5.createNEP5ReadSmartContract(readClient, keys[0].address, 8);

    expect(contract).toEqual(readSmartContract);
    expect(readClientSmartContract.mock.calls).toMatchSnapshot();
  });
});
