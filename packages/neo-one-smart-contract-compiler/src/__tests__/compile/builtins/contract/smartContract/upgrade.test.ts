import { common, crypto } from '@neo-one/client-common';
import { contractRegisterToContractModel } from '@neo-one/client-full-core';
import { helpers } from '../../../../../__data__';

describe('SmartContract#upgrade', () => {
  test('upgrade and destroy', async () => {
    const node = await helpers.startNode();

    const { contract: contractOut } = await node.compileScript(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class Contract extends SmartContract {
        private readonly x!: number;
        private readonly y!: number;

        public test(): number {
          return this.x * this.y;
        }

        public doDestroy(): boolean {
          this.destroy();

          return true;
        }
      }
    `);
    const newContractHash = common.uInt160ToString(crypto.toScriptHash(Buffer.from(contractOut.script, 'hex')));

    const contract = await node.addContract(`
      import { SmartContract } from '@neo-one/smart-contract';

      export class Contract extends SmartContract {
        private readonly x = 2;
        private readonly y = 5;

        public test(): number {
          return this.x * this.y;
        }

        protected approveUpgrade(): boolean {
          return true;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';
      interface Contract {
        deploy: () => boolean;
        test: () => number;
        upgrade: (
          script: Buffer,
          parameterList: Buffer,
          returnType: number,
          properties: number,
          contractName: string,
          codeVersion: string,
          author: string,
          email: string,
          description: string,
        ) => boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));
      assertEqual(contract.deploy(), true);
      assertEqual(contract.test(), 10);
      const result = contract.upgrade(
        ${helpers.getBufferHash(contractOut.script)},
        ${helpers.getBufferHash(contractRegisterToContractModel(contractOut).serializeWire().toString('hex'))}
      );
      assertEqual(result, true);

      interface NewContract {
        deploy: () => boolean;
        test: () => number;
        doDestroy: () => boolean;
      }
      const newContract = SmartContract.for<NewContract>(Address.from('${newContractHash}'));
      assertEqual(newContract.deploy(), false);
      assertEqual(newContract.test(), 10);
      assertEqual(newContract.doDestroy(), true);
    `);

    await expect(node.readClient.getContract(contract.address)).rejects.toBeDefined();
    await expect(node.readClient.getContract(newContractHash)).rejects.toBeDefined();
  });
});
