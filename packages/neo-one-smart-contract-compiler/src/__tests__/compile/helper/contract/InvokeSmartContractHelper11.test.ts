import { Hash256 } from '@neo-one/client-full';
import BigNumber from 'bignumber.js';
import { helpers, keys } from '../../../../__data__';

describe('InvokeSmartContractHelper', () => {
  test('argument and return types', async () => {
    const node = await helpers.startNode();
    const { definition } = await node.addContractWithDefinition(`
      import { Address, Hash256, PublicKey, SmartContract, constant } from '@neo-one/smart-contract';

      interface Bar {
        readonly array: Array<number>;
      }

      interface Foo {
        readonly num: number;
        readonly bar: Bar;
      }

      export class Contract extends SmartContract {

        public params(
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
          foo: Foo,
          fooNullable: Foo | undefined,
        ): boolean {
          assertEqual(str, 'foo');
          assertEqual(strNullable, 'foo');
          assertEqual(num, 10);
          assertEqual(numNullable, undefined);
          assertEqual(bool, true);
          assertEqual(buff, Buffer.from('10', 'hex'));
          assertEqual(buffNullable, undefined);
          assertEqual(addr, Address.from('${keys[0].address}'));
          assertEqual(addrNullable, undefined);
          assertEqual(hash256, Hash256.NEO);
          assertEqual(hash256Nullable, undefined);
          assertEqual(publicKey, PublicKey.from('${keys[0].publicKeyString}'));
          assertEqual(publicKeyNullable, undefined);
          assertEqual(array.length, 2);
          assertEqual(array[0], 1);
          assertEqual(array[1], 2);
          assertEqual(arrayNullable, undefined);
          assertEqual(map.size, 2);
          assertEqual(map.get('foo'), 1);
          assertEqual(map.get('bar'), 2);
          assertEqual(mapNullable, undefined);
          assertEqual(foo.num, 10);
          assertEqual(foo.bar.array.length, 2);
          assertEqual(foo.bar.array[0], 1);
          assertEqual(foo.bar.array[1], 2);

          return true;
        }

        @constant
        public str(): string {
          return 'foo';
        }

        @constant
        public strNullable(): string | undefined {
          return 'foo';
        }

        @constant
        public num(): number {
          return 10;
        }

        @constant
        public numNullable(): number | undefined {
          return undefined;
        }

        @constant
        public bool(): boolean {
          return true;
        }

        @constant
        public buff(): Buffer {
          return Buffer.from('10', 'hex');
        }

        @constant
        public buffNullable(): Buffer | undefined {
          return undefined;
        }

        @constant
        public addr(): Address {
          return Address.from('${keys[0].address}');
        }

        @constant
        public addrNullable(): Address | undefined {
          return undefined;
        }

        @constant
        public hash256(): Hash256 {
          return Hash256.NEO
        }

        @constant
        public hash256Nullable(): Hash256 | undefined {
          return undefined;
        }

        @constant
        public publicKey(): PublicKey {
          return PublicKey.from('${keys[0].publicKeyString}');
        }

        @constant
        public publicKeyNullable(): PublicKey | undefined {
          return undefined;
        }

        @constant
        public array(): Array<number> {
          return [1, 2]
        }

        @constant
        public arrayNullable(): Array<number> | undefined {
          return undefined;
        }

        @constant
        public map(): Map<string, number> {
          return new Map().set('foo', 1).set('bar', 2);
        }

        @constant
        public mapNullable(): Map<string, number> | undefined {
          return undefined;
        }

        @constant
        public foo(): Foo {
          return {
            bar: {
              array: [1, 2],
            },
            num: 10,
          }
        }

        @constant
        public fooNullable(): Foo | undefined {
          return undefined;
        }
      }
    `);

    const smartContract = node.client.smartContract(definition);
    await smartContract.deploy.confirmed();
    const receipt = await smartContract.params.confirmed(
      'foo',
      'foo',
      new BigNumber(10),
      undefined,
      true,
      '10',
      undefined,
      keys[0].address,
      undefined,
      Hash256.NEO,
      undefined,
      keys[0].publicKeyString,
      undefined,
      [new BigNumber(1), new BigNumber(2)],
      undefined,
      new Map<string, BigNumber>().set('foo', new BigNumber(1)).set('bar', new BigNumber(2)),
      undefined,
      {
        bar: {
          array: [new BigNumber(1), new BigNumber(2)],
        },
        num: new BigNumber(10),
      },
      undefined,
    );
    expect(receipt.result.state).toEqual('HALT');
    const [
      str,
      strNullable,
      num,
      numNullable,
      bool,
      buff,
      buffNullable,
      addr,
      addrNullable,
      hash256,
      hash256Nullable,
      publicKey,
      publicKeyNullable,
      array,
      arrayNullable,
      map,
      mapNullable,
      foo,
      fooNullable,
    ] = await Promise.all([
      smartContract.str(),
      smartContract.strNullable(),
      smartContract.num(),
      smartContract.numNullable(),
      smartContract.bool(),
      smartContract.buff(),
      smartContract.buffNullable(),
      smartContract.addr(),
      smartContract.addrNullable(),
      smartContract.hash256(),
      smartContract.hash256Nullable(),
      smartContract.publicKey(),
      smartContract.publicKeyNullable(),
      smartContract.array(),
      smartContract.arrayNullable(),
      smartContract.map(),
      smartContract.mapNullable(),
      smartContract.foo(),
      smartContract.fooNullable(),
    ]);

    expect(str).toEqual('foo');
    expect(strNullable).toEqual('foo');
    expect(num.toString()).toEqual('10');
    expect(numNullable).toEqual(undefined);
    expect(bool).toEqual(true);
    expect(buff).toEqual('10');
    expect(buffNullable).toEqual(undefined);
    expect(addr).toEqual(keys[0].address);
    expect(addrNullable).toEqual(undefined);
    expect(hash256).toEqual(Hash256.NEO);
    expect(hash256Nullable).toEqual(undefined);
    expect(publicKey).toEqual(keys[0].publicKeyString);
    expect(publicKeyNullable).toEqual(undefined);
    expect(array.length).toEqual(2);
    expect(array[0].toString()).toEqual('1');
    expect(array[1].toString()).toEqual('2');
    expect(arrayNullable).toEqual(undefined);
    expect(map.size).toEqual(2);
    expect(map.get('foo').toString()).toEqual('1');
    expect(map.get('bar').toString()).toEqual('2');
    expect(mapNullable).toEqual(undefined);
    expect(foo.bar.array.length).toEqual(2);
    expect(foo.bar.array[0].toString()).toEqual('1');
    expect(foo.bar.array[1].toString()).toEqual('2');
    expect(foo.num.toString()).toEqual('10');
    expect(fooNullable).toEqual(undefined);
  });
});
