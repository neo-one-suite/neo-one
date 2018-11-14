import { helpers, keys } from '../../../../../__data__';

const properties = `
public readonly properties = {
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'The TestSmartContract',
};
`;

describe('Address.isCaller', () => {
  test('isCaller', async () => {
    const node = await helpers.startNode();
    const isCallerContract = await node.addContract(`
      import { SmartContract, Address } from '@neo-one/smart-contract';

      export class IsCaller extends SmartContract {
        ${properties}

        public isCaller(from: Address): boolean {
          return Address.isCaller(from);
        }
      }
    `);

    const otherContract = await node.addContract(`
    `);

    const checkCaller = await node.addContract(`
      import { SmartContract, Address } from '@neo-one/smart-contract';

      interface IsCaller {
        isCaller(from: Address): boolean;
      }

      export class CheckCaller extends SmartContract {
        ${properties}

        public runNotCallerAddressSigned(): void {
          const contract = SmartContract.for<IsCaller>(Address.from('${isCallerContract.address}'));
          assertEqual(contract.isCaller(Address.from('${node.masterWallet.userAccount.id.address}')), false);
        }

        public runNotCallerAddressUnigned(): void {
          const contract = SmartContract.for<IsCaller>(Address.from('${isCallerContract.address}'));
          assertEqual(contract.isCaller(Address.from('${keys[0].address}')), false);
        }

        public runNotCallerContract(): void {
          const contract = SmartContract.for<IsCaller>(Address.from('${isCallerContract.address}'));
          assertEqual(contract.isCaller(Address.from('${otherContract.address}')), false);
        }

        public runCaller(): void {
          const contract = SmartContract.for<IsCaller>(Address.from('${isCallerContract.address}'));
          assertEqual(contract.isCaller(this.address), true);
        }
      }
    `);

    await node.executeString(
      `
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface CheckCaller {
        runNotCallerAddressSigned(): void;
        runNotCallerAddressUnigned(): void;
        runNotCallerContract(): void;
        runCaller(): void;
      }

      interface IsCaller {
        isCaller(from: Address): boolean;
      }

      const contract = SmartContract.for<CheckCaller>(Address.from('${checkCaller.address}'));
      contract.runNotCallerAddressSigned();
      contract.runNotCallerAddressUnigned();
      contract.runNotCallerContract();
      contract.runCaller();

      const isCallerContract = SmartContract.for<IsCaller>(Address.from('${isCallerContract.address}'));
      assertEqual(isCallerContract.isCaller(Address.from('${node.masterWallet.userAccount.id.address}')), true);
    `,
      { from: node.masterWallet.userAccount.id },
    );
  });
});
