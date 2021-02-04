import fs from 'fs-extra';
import path from 'path';
import { compileContract } from '../compile/compileContract';

const folder = '/Users/spencercorwin/Desktop/compiler-tests';
const scPath = path.join(folder, 'test.ts');

const writeFile = async (source: string) => {
  await fs.writeFile(scPath, source, 'utf-8');
};

const compileContractLocal = async () => compileContract(scPath, 'test', {}, {});

// TODO: move or udpate or delete these tests
describe('example compiles', () => {
  beforeEach(async () => {
    await fs.emptyDir(folder);
  });

  test.only('basic contract', async () => {
    const source = `
    import { SmartContract } from '@neo-one/smart-contract';

    export class Token extends SmartContract {
      public readonly properties = {
        groups: [],
        permissions: [{ methods: ['himethod'], contract: { hash: '0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc', group: '0248be3c070df745a60f3b8b494efcc6caf90244d803a9a72fe95d9bae2120ec70' } }],
        trusts: ['0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc'],
      };
      public readonly name = 'One';
      public readonly symbol = 'ONE';
      public readonly decimals = 8;
    }
    `;

    await writeFile(source);
    const result = await compileContractLocal();

    console.log(result.contract.contract.manifest);
    result.contract.contract.manifest.abi.methods.forEach((method) => {
      console.log(method);
    });
    // expect(result).toBeDefined();
  });

  test('contract with getter', async () => {
    const source = `
    import { SmartContract } from '@neo-one/smart-contract';

    export class Token extends SmartContract {
      public readonly properties = {
        codeVersion: '1.0',
        author: 'dicarlo2',
        email: 'alex.dicarlo@neotracker.io',
        description: 'NEO•ONE Token',
      };
      public readonly name = 'One';
      public readonly symbol = 'ONE';
      public readonly decimals = 8;
      private mutableSupply: Fixed<8> = 0;

      @constant
      public get totalSupply(): Fixed<8> {
        return this.mutableSupply;
      }
    }
    `;

    await writeFile(source);
  });
});
