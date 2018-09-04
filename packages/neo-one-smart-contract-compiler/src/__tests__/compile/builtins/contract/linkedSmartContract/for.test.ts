import * as appRootDir from 'app-root-dir';
import * as path from 'path';
import { helpers } from '../../../../../__data__';
import { normalizePath, pathResolve } from '../../../../../utils';

describe('LinkedSmartContract.for', () => {
  test('linked call', async () => {
    const node = await helpers.startNode();
    const fooPath = normalizePath(path.join('linked', 'Foo.ts'));
    const fooFullPath = pathResolve(
      appRootDir.get(),
      'packages',
      'neo-one-smart-contract-compiler',
      'src',
      '__data__',
      'snippets',
      fooPath,
    );
    const fooContract = await node.addContractFromSnippet(normalizePath(path.join('linked', 'Foo.ts')));

    const barContract = await node.addContractFromSnippet(normalizePath(path.join('linked', 'Bar.ts')), {
      [fooFullPath]: {
        Foo: fooContract.address,
      },
    });

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        getFoo(address: Address): string;
      }
      const expected = Address.from('${fooContract.address}');
      const contract = SmartContract.for<Contract>(Address.from('${barContract.address}'));
      assertEqual(contract.getFoo(expected), 'foo');
    `);
  });
});
