import { helpers, keys } from '../../../../../__data__';

const properties = `
public readonly properties = {
  codeVersion: '1.0',
  author: 'dicarlo2',
  email: 'alex.dicarlo@neotracker.io',
  description: 'The TestSmartContract',
};
`;

describe('ForwardValue', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { ForwardValue } from '@neo-one/smart-contract';

      class MyForwardValue implements ForwardValue {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    helpers.compileString(
      `
      import { ForwardValue } from '@neo-one/smart-contract';

      class MyForwardValue extends ForwardValue {
      }
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      import { ForwardValue } from '@neo-one/smart-contract';

      const x: [typeof ForwardValue] = [ForwardValue];

      const foo = (value: [typeof ForwardValue]) => {
        // do nothing
      };

      foo(x);
    `);
  });

  test('can be instanceof', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { ForwardValue, SmartContract } from '@neo-one/smart-contract';

      export class Forward extends SmartContract {
        ${properties}

        public test(value: ForwardValue): boolean {
          assertEqual(value instanceof ForwardValue, true);

          return true;
        }
      }
    `);

    await node.executeString(`
      import { Address, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        test: (value: number) => boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.test(10), true);
    `);
  });

  test.skip('can be as<type>', async () => {
    const node = await helpers.startNode();
    const contract = await node.addContract(`
      import { Address, ForwardValue, Hash256, PublicKey, SmartContract } from '@neo-one/smart-contract';

      export class Forward extends SmartContract {
        ${properties}

        public test(
          str: ForwardValue,
          strNullable: ForwardValue,
          num: ForwardValue,
          numNullable: ForwardValue,
          bool: ForwardValue,
          buff: ForwardValue,
          buffNullable: ForwardValue,
          addr: ForwardValue,
          addrNullable: ForwardValue,
          hash256: ForwardValue,
          hash256Nullable: ForwardValue,
          publicKey: ForwardValue,
          publicKeyNullable: ForwardValue,
          array: ForwardValue,
          arrayNullable: ForwardValue,
          map: ForwardValue,
          mapNullable: ForwardValue,
        ): boolean {
          assertEqual(str.asString(), 'foo');
          assertEqual(strNullable.asStringNullable(), 'foo');
          assertEqual(num.asNumber(), 10);
          assertEqual(numNullable.asNumberNullable(), undefined);
          assertEqual(bool.asBoolean(), true);
          assertEqual(buff.asBuffer(), Buffer.from('10', 'hex'));
          assertEqual(buffNullable.asBufferNullable(), undefined);
          assertEqual(addr.asAddress(), Address.from('${keys[0].address}'));
          assertEqual(addrNullable.asAddressNullable(), undefined);
          assertEqual(hash256.asHash256(), Hash256.NEO);
          assertEqual(hash256Nullable.asHash256Nullable(), undefined);
          assertEqual(publicKey.asPublicKey(), PublicKey.from('${keys[0].publicKeyString}'));
          assertEqual(publicKeyNullable.asPublicKeyNullable(), undefined);
          assertEqual(array.asArray().length, 2);
          assertEqual(array.asArray()[0] instanceof ForwardValue, true);
          assertEqual(arrayNullable.asArrayNullable(), undefined);
          assertEqual(map.asMap().size, 2);
          map.asMap().forEach((value, key) => {
            assertEqual(map.asMap().get(key) instanceof ForwardValue, true);
          })
          assertEqual(mapNullable.asMapNullable(), undefined);

          return true;
        }
      }
    `);

    await node.executeString(`
      import { Address, Hash256, PublicKey, SmartContract } from '@neo-one/smart-contract';

      interface Contract {
        deploy(): boolean;
        test: (
          str: string,
          strNullable: string | undefined,
          num: number,
          numNullable: number | undefined,
          bool: boolean,
          buff: Buffer,
          buffNullable: Buffer | undefined,
          addr: Address,
          addrNullable: Address | undefined,
          hash256: Hash256,
          hash256Nullable: Hash256 | undefined,
          publicKey: PublicKey,
          publicKeyNullable: PublicKey | undefined,
          array: Array<number>,
          arrayNullable: Array<number> | undefined,
          map: Map<string, number>,
          mapNullable: Map<string, number> | undefined,
        ) => boolean;
      }
      const contract = SmartContract.for<Contract>(Address.from('${contract.address}'));

      assertEqual(contract.deploy(), true);
      assertEqual(contract.test(
        'foo',
        'foo',
        10,
        undefined,
        true,
        Buffer.from('10', 'hex'),
        undefined,
        Address.from('${keys[0].address}'),
        undefined,
        Hash256.NEO,
        undefined,
        PublicKey.from('${keys[0].publicKeyString}'),
        undefined,
        [1, 2],
        undefined,
        new Map<string, number>().set('foo', 1).set('bar', 2),
        undefined,
      ), true);
    `);
  });
});
