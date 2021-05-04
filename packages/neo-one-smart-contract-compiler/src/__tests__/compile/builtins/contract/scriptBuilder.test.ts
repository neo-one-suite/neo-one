import { CallFlags, common, ScriptBuilder } from '@neo-one/client-common';
import { BigNumber } from 'bignumber.js';
import { helpers } from '../../../../__data__';

const properties = `
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: "*",
  };
`;

// TODO: delete this later or put it in a better spot with better naming, etc.
describe('Calling contract', () => {
  test('Call with script', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class StorageContract extends SmartContract {
        ${properties}

        public run(): string {
          return 'hi';
        }
      }
    `);

    const result = await node.client.__call('priv', contract.address, 'run', ['run']);
    console.log(result);

    expect(result.state).toEqual('HALT');

    const sb = new ScriptBuilder().emitDynamicAppCall(
      common.stringToUInt160(contract.contract.hash),
      'run',
      CallFlags.All,
      'run',
      [],
    );
    const resultAgain = await node.userAccountProviders.memory.__execute(sb.build().toString('hex'), {
      from: node.masterWallet.userAccount.id,
      maxSystemFee: new BigNumber(-1),
      maxNetworkFee: new BigNumber(-1),
    });
    const final = await resultAgain.confirmed();
    console.log(final);

    expect(final.state).toEqual('HALT');
  });

  test('Contract publish and deply', async () => {
    const node = await helpers.startNode();

    const contract = await node.compileScript(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class StorageContract extends SmartContract {
        ${properties}

        public run(): string {
          return 'hi';
        }
      }
    `);

    const result = await node.client.publishAndDeploy(contract.contract, contract.contract.manifest, [], {
      maxSystemFee: new BigNumber(-1),
      maxNetworkFee: new BigNumber(-1),
    });

    console.log(result);
  });
});
