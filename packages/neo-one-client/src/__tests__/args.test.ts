import BigNumber from 'bignumber.js';
import { keys } from '../__data__';
import * as assertArgs from '../args';
import { InvalidArgumentError, InvalidNamedArgumentError } from '../errors';
import { converters } from '../user/converters';

describe('arg assertions', () => {
  const name = 'name';
  const dummyString = 'dummy';
  const dummyInt = 10;
  const bigNum = new BigNumber('10');

  const workingTestCases = [
    {
      method: 'assertString',
      args: [name, dummyString],
    },

    {
      method: 'assertAddress',
      args: [keys[0].address],
    },

    {
      method: 'assertNullableString',
      args: [name, undefined],
    },

    {
      method: 'assertNullableString',
      args: [name, dummyString],
    },

    {
      method: 'assertHash160',
      args: ['0x3775292229eccdf904f16fff8e83e7cffdc0f0ce'],
    },

    {
      method: 'assertHash256',
      args: ['0x798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca'],
    },

    {
      method: 'assertBuffer',
      args: ['cef0c0fdcfe7838eff6ff104f9cdec2922297537'],
    },

    {
      method: 'assertPublicKey',
      args: ['02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef'],
    },

    {
      method: 'assertBigNumber',
      args: [bigNum],
    },

    {
      method: 'assertNullableBigNumber',
      args: [undefined],
    },

    {
      method: 'assertNullableBigNumber',
      args: [bigNum],
    },

    {
      method: 'assertBoolean',
      args: [true],
    },

    {
      method: 'assertNumber',
      args: [dummyInt],
    },

    {
      method: 'assertNullableNumber',
      args: [dummyInt],
    },

    {
      method: 'assertNullableNumber',
      args: [undefined],
    },

    {
      method: 'assertArray',
      args: [[]],
    },

    {
      method: 'assertBlockFilter',
      args: [undefined],
    },

    {
      method: 'assertBlockFilter',
      args: [{ indexStart: dummyInt, indexStop: dummyInt + 1 }],
    },

    {
      method: 'assertBlockFilter',
      args: [{}],
    },

    {
      method: 'assertGetOptions',
      args: [undefined],
    },

    {
      method: 'assertGetOptions',
      args: [{ timeout: dummyInt }],
    },

    {
      method: 'assertGetOptions',
      args: [{}],
    },

    {
      method: 'assertABIReturn',
      args: [{ type: 'Void' }],
    },

    {
      method: 'assertABIParameter',
      args: [{ name, type: 'Void' }],
    },

    {
      method: 'assertABIFunction',
      args: [
        {
          name,
          constant: true,
          parameters: [{ name, type: 'Void' }],
          returnType: { type: 'Void' },
        },
      ],
    },

    {
      method: 'assertABIFunction',
      args: [
        {
          name,
          returnType: { type: 'Void' },
        },
      ],
    },

    {
      method: 'assertABIEvent',
      args: [
        {
          name,
          parameters: [{ name, type: 'Void' }],
        },
      ],
    },

    {
      method: 'assertABI',
      args: [
        {
          functions: [
            {
              name,
              returnType: { type: 'Void' },
            },
          ],
        },
      ],
    },

    {
      method: 'assertABI',
      args: [
        {
          functions: [
            {
              name,
              returnType: { type: 'Void' },
            },
          ],

          events: [
            {
              name,
              parameters: [{ name, type: 'Void' }],
            },
          ],
        },
      ],
    },

    {
      method: 'assertTransactionOptions',
      args: [undefined],
    },

    {
      method: 'assertTransactionOptions',
      args: [{ networkFee: undefined }],
    },

    {
      method: 'assertAssetRegister',
      args: [
        {
          assetType: 'CreditFlag',
          name: 'asset',
          amount: new BigNumber(10),
          precision: 20,
          owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
    },
    {
      method: 'assertContractRegister',
      args: [
        {
          script: '02028a99826e',
          parameters: ['Signature'],
          returnType: 'Signature',
          name: 'contract',
          codeVersion: 'codeVersion',
          author: 'author',
          email: 'email',
          description: 'description',
          properties: {
            storage: true,
            dynamicInvoke: true,
            payable: true,
          },
        },
      ],
    },
    {
      method: 'assertTransactionReceipt',
      args: [
        {
          blockIndex: 10,
          blockHash: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          transactionIndex: 5,
        },
      ],
    },
    {
      method: 'assertTransfer',
      args: [
        {
          amount: new BigNumber(10),
          asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
    },
    {
      method: 'assertTransfers',
      args: [
        [
          new BigNumber(10),
          '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          undefined,
        ],
      ],
    },
    {
      method: 'assertTransfers',
      args: [
        [
          [
            {
              amount: new BigNumber(10),
              asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
              to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
            },
          ],
          undefined,
        ],
      ],
    },
    {
      method: 'assertUpdateAccountNameOptions',
      args: [
        {
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
        },
      ],
    },
    {
      method: 'assertUserAccount',
      args: [
        {
          type: 'MEGA BIG USER MAN',
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
          scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
          publicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          configurableName: true,
          deletable: true,
        },
      ],
    },
    {
      method: 'assertUserAccountID',
      args: [
        {
          network: 'test',
          address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
    },
    {
      method: 'assertNetworkType',
      args: ['test'],
    },
  ] as any;

  for (const testCase of workingTestCases) {
    const { method, args } = testCase;
    test(method, async () => {
      const result = (assertArgs as any)[method](...args);

      expect(result).toEqual(args[args.length - 1]);
    });
  }

  test('assertAttributeArg', () => {
    converters.attribute = jest.fn(() => {
      // do nothing
    });

    const result = assertArgs.assertAttributeArg({});
    expect(result).toEqual({});
  });

  const errorTestCases = [
    {
      method: 'assertString',
      message: 'assertString throws error on non-string',
      args: [name, dummyInt],
      error: new InvalidArgumentError(`Expected string for name, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertString',
      message: 'assertString throws error on missing param',
      args: [name],
      error: new InvalidArgumentError(`Expected string for name, found: undefined`),
    },

    {
      method: 'assertAddress',
      message: 'assertAddress throws error on non-string',
      args: [dummyInt],
      error: new InvalidArgumentError(`Address argument was not a string: ${String(dummyInt)}`),
    },

    {
      method: 'assertAddress',
      message: 'assertAddress throws error on missing/undefined param',
      args: [undefined],
      error: new InvalidArgumentError(`Address argument was not a string: ${String(undefined)}`),
    },

    {
      method: 'assertAddress',
      message: 'assertAddress throws error on malformed address',
      args: [dummyString],
      error: new InvalidArgumentError(`Invalid address: ${String(dummyString)}`),
    },

    {
      method: 'assertHash160',
      message: 'assertHash160 throws error on non string',
      args: [dummyInt],
      error: new InvalidArgumentError(`Expected string for Hash160, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertHash160',
      message: 'assertHash160 throws error on missing 0x prefix',
      args: [dummyString],
      error: new InvalidArgumentError(`Hash160 must start with '0x', found: ${String(dummyString)}`),
    },

    {
      method: 'assertHash160',
      message: 'assertHash160 throws error on malformed hash160',
      args: [`0x${dummyString}`],
      error: new InvalidArgumentError(`Invalid Hash160 param, found: 0x${String(dummyString)}`),
    },

    {
      method: 'assertHash256',
      message: 'assertHash256 throws error on non string',
      args: [dummyInt],
      error: new InvalidArgumentError(`Expected string for Hash256, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertHash256',
      message: 'assertHash256 throws error on missing 0x prefix',
      args: [dummyString],
      error: new InvalidArgumentError(`Hash256 must start with '0x', found: ${String(dummyString)}`),
    },

    {
      method: 'assertHash256',
      message: 'assertHash256 throws error on malformed hash256',
      args: [`0x${dummyString}`],
      error: new InvalidArgumentError(`Invalid Hash256 param, found: 0x${String(dummyString)}`),
    },

    {
      method: 'assertBuffer',
      message: 'assertBuffer throws error on non hex string',
      args: [dummyString],
      error: new InvalidArgumentError(`Expected hex string, found: ${String(dummyString)}`),
    },

    {
      method: 'assertBuffer',
      message: 'assertBuffer throws error on non string',
      args: [dummyInt],
      error: new InvalidArgumentError(`Expected string for Buffer, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertPublicKey',
      message: 'assertPublicKey throws error on unbufferable param',
      args: [dummyString],
      error: new InvalidArgumentError(`Expected hex string, found: ${String(dummyString)}`),
    },

    {
      method: 'assertPublicKey',
      message: 'assertPublicKey throws error on malformed key',
      args: ['ffff'],
      error: new InvalidArgumentError(`Expected PublicKey, found: ffff`),
    },

    {
      method: 'assertBigNumber',
      message: 'assertBigNumber throws error on non bignumber',
      args: [dummyInt],
      error: new InvalidArgumentError(`Expected BigNumber, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertBigNumber',
      message: 'assertBigNumber throws error on non bignumber string',
      args: ['10'],
      error: new InvalidArgumentError(`Expected BigNumber, found: 10`),
    },

    {
      method: 'assertBoolean',
      message: 'assertBoolean throws error on undefined',
      args: [undefined],
      error: new InvalidArgumentError(`Expected boolean, found: ${String(undefined)}`),
    },

    {
      method: 'assertBoolean',
      message: 'assertBoolean throws error on non bool',
      args: [dummyInt],
      error: new InvalidArgumentError(`Expected boolean, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertNumber',
      message: 'assertNumber throws error on undefined',
      args: [undefined],
      error: new InvalidArgumentError(`Expected number, found: ${String(undefined)}`),
    },

    {
      method: 'assertNumber',
      message: 'assertNumber throws error on non number',
      args: [dummyString],
      error: new InvalidArgumentError(`Expected number, found: ${dummyString}`),
    },

    {
      method: 'assertNullableNumber',
      message: 'assertNullableNumber throws error on non undefined or number',
      args: [dummyString],
      error: new InvalidArgumentError(`Expected number, found: ${dummyString}`),
    },

    {
      method: 'assertArray',
      message: 'assertArray throws error on non array',
      args: [dummyString],
      error: new InvalidArgumentError(`Expected Array, found: ${dummyString}`),
    },

    {
      method: 'assertBlockFilter',
      message: 'assertBlockFilter throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(`Invalid BlockFilter param, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertBlockFilter',
      message: 'assertBlockFilter throws error on indexStart non number',
      args: [{ indexStart: dummyString, indexStop: dummyInt }],
      error: new InvalidArgumentError(
        `Invalid BlockFilter param, found: ${String({
          indexStart: dummyString,
          indexStop: dummyInt,
        })}`,
      ),
    },

    {
      method: 'assertBlockFilter',
      message: 'assertBlockFilter throws error on indexStop non number',
      args: [{ indexStart: dummyInt, indexStop: dummyString }],
      error: new InvalidArgumentError(
        `Invalid BlockFilter param, found: ${String({
          indexStart: dummyInt,
          indexStop: dummyString,
        })}`,
      ),
    },

    {
      method: 'assertBlockFilter',
      message: 'assertBlockFilter throws error on indexStop<=indexStart',
      args: [{ indexStart: dummyInt + 1, indexStop: dummyInt - 1 }],
      error: new InvalidArgumentError(
        `Invalid BlockFilter param, found: ${String({
          indexStart: dummyInt + 1,
          indexStop: dummyInt - 1,
        })}`,
      ),
    },

    {
      method: 'assertGetOptions',
      message: 'assertGetOptions throws error on invalid timeout field',
      args: [{ timeout: dummyString }],
      error: new InvalidArgumentError(`Invalid GetOptions param, found: ${String({ timeout: dummyString })}`),
    },

    {
      method: 'assertGetOptions',
      message: 'assertGetOptions throws error on non object',
      args: [dummyString],
      error: new InvalidArgumentError(`Invalid GetOptions param, found: ${dummyString}`),
    },

    {
      method: 'assertABIReturn',
      message: 'assertABIReturn throws error on undefined',
      args: [undefined],
      error: new InvalidArgumentError(`Invalid ABI return, found: ${String(undefined)}`),
    },

    {
      method: 'assertABIReturn',
      message: 'assertABIReturn throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(`Invalid ABI return, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIReturn',
      message: 'assertABIReturn throws error on non number type for Integer',
      args: [{ type: 'Array', value: { type: 'Integer', decimals: dummyString } }],

      error: new InvalidArgumentError(`Expected number, found: ${String(dummyString)}`),
    },

    {
      method: 'assertABIReturn',
      message: 'assertABIReturn throws error on invalid ABI type',
      args: [{ type: 'INVALID' }],
      error: new InvalidArgumentError(`Invalid ABI return, found: ${String({ type: 'INVALID' })}`),
    },

    {
      method: 'assertABIParameter',
      message: 'assertABIParameter throws error on non string name',
      args: [{ name: dummyInt }],
      error: new InvalidArgumentError(`Expected string for name, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIParameter',
      message: 'assertABIParameter throws error on non ABIReturn',
      args: [{ name, type: 'INVALID' }],
      error: new InvalidArgumentError(`Invalid ABI return, found: ${String({ type: 'INVALID' })}`),
    },

    {
      method: 'assertABIParameter',
      message: 'assertABIParameter throws error on undefined',
      args: [undefined],
      error: new InvalidArgumentError(`Invalid ABI parameter, found: ${String(undefined)}`),
    },

    {
      method: 'assertABIParameter',
      message: 'assertABIParameter throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(`Invalid ABI parameter, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non string name',
      args: [{ name: dummyInt }],
      error: new InvalidArgumentError(`Expected string for name, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non bool constant',
      args: [{ name, constant: dummyInt }],
      error: new InvalidArgumentError(`Expected boolean, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on undefined',
      args: [undefined],
      error: new InvalidArgumentError(`Invalid ABI function, found: ${String(undefined)}`),
    },

    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(`Invalid ABI function, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non ABIParameter parameters',
      args: [{ name, parameters: [undefined] }],
      error: new InvalidArgumentError(`Invalid ABI parameter, found: ${String(undefined)}`),
    },

    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on non Array parameters',
      args: [{ name, parameters: dummyInt }],
      error: new InvalidArgumentError(`Expected Array, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIFunction',
      message: 'assertABIFunction throws error on invalid returnType',
      args: [{ name, returnType: dummyInt }],
      error: new InvalidArgumentError(`Invalid ABI return, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on undefined',
      args: [undefined],
      error: new InvalidArgumentError(`Invalid ABI event, found: ${String(undefined)}`),
    },

    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(`Invalid ABI event, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on non string name',
      args: [{ name: dummyInt }],
      error: new InvalidArgumentError(`Expected string for name, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on non array parameters',
      args: [{ name, parameters: dummyInt }],
      error: new InvalidArgumentError(`Expected Array, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABIEvent',
      message: 'assertABIEvent throws error on non ABIParameter parameters',
      args: [{ name, parameters: [dummyInt] }],
      error: new InvalidArgumentError(`Invalid ABI parameter, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABI',
      message: 'assertABI throws error on undefined',
      args: [undefined],
      error: new InvalidArgumentError(`Invalid ABI param, found: ${String(undefined)}`),
    },

    {
      method: 'assertABI',
      message: 'assertABI throws error on non object',
      args: [dummyInt],
      error: new InvalidArgumentError(`Invalid ABI param, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABI',
      message: 'assertABI throws non array functions',
      args: [
        {
          functions: dummyInt,
        },
      ],

      error: new InvalidArgumentError(`Expected Array, found: ${dummyInt}`),
    },

    {
      method: 'assertABI',
      message: 'assertABI throws non ABIFunction functions',
      args: [
        {
          hash: '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce',
          functions: [dummyInt],
        },
      ],

      error: new InvalidArgumentError(`Invalid ABI function, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertABI',
      message: 'assertABI throws non non array events',
      args: [
        {
          functions: [{ name, returnType: { type: 'Void' } }],
          events: dummyInt,
        },
      ],

      error: new InvalidArgumentError(`Expected Array, found: ${dummyInt}`),
    },

    {
      method: 'assertABI',
      message: 'assertABI throws non non ABI Event events',
      args: [
        {
          functions: [{ name, returnType: { type: 'Void' } }],
          events: [dummyInt],
        },
      ],

      error: new InvalidArgumentError(`Invalid ABI event, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertTransactionOptions',
      message: 'assertTransactionOptions throws error on non object',
      args: [dummyInt],
      error: new InvalidNamedArgumentError('TransactionOptions', dummyInt),
    },

    {
      method: 'assertTransactionOptions',
      message: 'assertTransactionOptions throws error on non attribute array',
      args: [{ attributes: dummyInt }],
      error: new InvalidNamedArgumentError('TransactionOptions', {
        attributes: dummyInt,
      }),
    },

    {
      method: 'assertTransactionOptions',
      message: 'assertTransactionOptions throws error on non BigNumber networkFee',
      args: [{ attributes: [], networkFee: dummyInt }],
      error: new InvalidArgumentError(`Expected BigNumber, found: ${String(dummyInt)}`),
    },

    {
      method: 'assertAssetRegister',
      message: 'assertAssetRegister throws error on invalid assetType',
      args: [
        {
          assetType: dummyString,
          name: 'asset',
          amount: new BigNumber('10'),
          precision: 5,
          owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`AssetRegister`, `Error: Expected asset type, found: ${dummyString}`),
    },
    {
      method: 'assertAssetRegister',
      message: 'assertAssetRegister throws error on invalid name',
      args: [
        {
          assetType: 'CreditFlag',
          name: dummyInt,
          amount: new BigNumber('10'),
          precision: 5,
          owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`AssetRegister`, `Error: Expected string, found: ${dummyInt}`),
    },
    {
      method: 'assertAssetRegister',
      message: 'assertAssetRegister throws error on invalid amount',
      args: [
        {
          assetType: 'CreditFlag',
          name: 'asset',
          amount: dummyInt,
          precision: 5,
          owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`AssetRegister`, `Error: Expected BigNumber, found: ${dummyInt}`),
    },
    {
      method: 'assertAssetRegister',
      message: 'assertAssetRegister throws error on invalid precision',
      args: [
        {
          assetType: 'CreditFlag',
          name: 'asset',
          amount: new BigNumber('10'),
          precision: bigNum,
          owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`AssetRegister`, `Error: Expected number, found: ${bigNum}`),
    },
    {
      method: 'assertAssetRegister',
      message: 'assertAssetRegister throws error on invalid Public Key',
      args: [
        {
          assetType: 'CreditFlag',
          name: 'asset',
          amount: new BigNumber('10'),
          precision: 5,
          owner: dummyString,
          admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`AssetRegister`, `Error: Expected hex string, found: ${dummyString}`),
    },
    {
      method: 'assertAssetRegister',
      message: 'assertAssetRegister throws error on invalid admin Address',
      args: [
        {
          assetType: 'CreditFlag',
          name: 'asset',
          amount: new BigNumber('10'),
          precision: 10,
          owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          admin: dummyString,
          issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`AssetRegister`, `Error: Invalid address: ${dummyString}`),
    },
    {
      method: 'assertAssetRegister',
      message: 'assertAssetRegister throws error on invalid issuer Address',
      args: [
        {
          assetType: 'CreditFlag',
          name: 'asset',
          amount: new BigNumber('10'),
          precision: 10,
          owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          issuer: dummyString,
        },
      ],
      error: new InvalidArgumentError(`Invalid argument for AssetRegister: Error: Invalid address: ${dummyString}`),
    },
    {
      method: 'assertContractRegister',
      message: 'assertContractRegister throws error on invalid Buffer',
      args: [
        {
          script: dummyString,
          parameters: ['Signature'],
          returnType: 'Signature',
          name: 'contract',
          codeVersion: 'codeVersion',
          author: 'author',
          email: 'email',
          description: 'description',
          properties: {
            storage: true,
            dynamicInvoke: true,
            payable: true,
          },
        },
      ],
      error: new InvalidNamedArgumentError(`ContractRegister`, `Error: Expected hex string, found: ${dummyString}`),
    },
    {
      method: 'assertContractRegister',
      message: 'assertContractRegister throws error on invalid Parameter type',
      args: [
        {
          script: '02028a99826e',
          parameters: [dummyString],
          returnType: 'Signature',
          name: 'contract',
          codeVersion: 'codeVersion',
          author: 'author',
          email: 'email',
          description: 'description',
          properties: {
            storage: true,
            dynamicInvoke: true,
            payable: true,
          },
        },
      ],
      error: new InvalidNamedArgumentError(
        `ContractRegister`,
        `Error: Expected contract parameter type, found: ${dummyString}`,
      ),
    },
    {
      method: 'assertContractRegister',
      message: 'assertContractRegister throws error on invalid Parameter type',
      args: [
        {
          script: '02028a99826e',
          parameters: ['Signature'],
          returnType: dummyString,
          name: 'contract',
          codeVersion: 'codeVersion',
          author: 'author',
          email: 'email',
          description: 'description',
          properties: {
            storage: true,
            dynamicInvoke: true,
            payable: true,
          },
        },
      ],
      error: new InvalidNamedArgumentError(
        `ContractRegister`,
        `Error: Expected contract parameter type, found: ${dummyString}`,
      ),
    },
    {
      method: 'assertContractRegister',
      message: 'assertContractRegister throws error on invalid String type',
      args: [
        {
          script: '02028a99826e',
          parameters: ['Signature'],
          returnType: 'Signature',
          name: 'contract',
          codeVersion: bigNum,
          author: 'author',
          email: 'email',
          description: 'description',
          properties: {
            storage: true,
            dynamicInvoke: true,
            payable: true,
          },
        },
      ],
      error: new InvalidNamedArgumentError(`ContractRegister`, `Error: Expected string, found: ${bigNum}`),
    },
    {
      method: 'assertContractRegister',
      message: 'assertContractRegister throws error on invalid Parameter type',
      args: [
        {
          script: '02028a99826e',
          parameters: ['Signature'],
          returnType: 'Signature',
          name: 'contract',
          codeVersion: 'codeVersion',
          author: 'author',
          email: 'email',
          description: 'description',
          properties: {
            storage: bigNum,
            dynamicInvoke: true,
            payable: true,
          },
        },
      ],
      error: new InvalidNamedArgumentError(`ContractRegister`, `Error: Expected boolean, found: ${bigNum}`),
    },
    {
      method: 'assertTransactionReceipt',
      message: 'assertTransactionReceipt throws error on invalid blockIndex',
      args: [
        {
          blockIndex: bigNum,
          blockHash: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          transactionIndex: 5,
        },
      ],
      error: new InvalidNamedArgumentError(`TransactionReceipt`, `Error: Expected number, found: ${bigNum}`),
    },
    {
      method: 'assertTransactionReceipt',
      message: 'assertTransactionReceipt throws error on invalid blockHash',
      args: [
        {
          blockIndex: 10,
          blockHash: dummyString,
          transactionIndex: 5,
        },
      ],
      error: new InvalidNamedArgumentError(
        `TransactionReceipt`,
        `Error: Hash256 must start with '0x', found: ${dummyString}`,
      ),
    },
    {
      method: 'assertTransactionReceipt',
      message: 'assertTransactionReceipt throws error on invalid transactionIndex',
      args: [
        {
          blockIndex: 10,
          blockHash: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          transactionIndex: bigNum,
        },
      ],
      error: new InvalidNamedArgumentError(`TransactionReceipt`, `Error: Expected number, found: ${bigNum}`),
    },
    {
      method: 'assertTransfer',
      message: 'assertTransfer throws error on invalid amount',
      args: [
        {
          amount: dummyInt,
          asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`Transfer`, `Error: Expected BigNumber, found: ${dummyInt}`),
    },
    {
      method: 'assertTransfer',
      message: 'assertTransfer throws error on invalid asset',
      args: [
        {
          amount: new BigNumber(10),
          asset: dummyString,
          to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`Transfer`, `Error: Hash256 must start with '0x', found: ${dummyString}`),
    },
    {
      method: 'assertTransfer',
      message: 'assertTransfer throws error on invalid to address',
      args: [
        {
          amount: new BigNumber(10),
          asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          to: dummyString,
        },
      ],
      error: new InvalidNamedArgumentError(`Transfer`, `Error: Invalid address: ${dummyString}`),
    },
    {
      method: 'assertTransfers',
      message: 'assertTransfers (type 1) throws error on invalid amount',
      args: [
        [
          dummyInt,
          '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          undefined,
        ],
      ],
      error: new InvalidNamedArgumentError(`Transfers`, `Error: Expected BigNumber, found: ${dummyInt}`),
    },
    {
      method: 'assertTransfers',
      message: 'assertTransfers (type 1) throws error on invalid asset',
      args: [[new BigNumber(10), dummyString, 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR', undefined]],
      error: new InvalidNamedArgumentError(`Transfers`, `Error: Hash256 must start with '0x', found: ${dummyString}`),
    },
    {
      method: 'assertTransfers',
      message: 'assertTransfers (type 1) throws error on invalid address',
      args: [
        [
          new BigNumber(10),
          '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          dummyString,
          undefined,
        ],
      ],
      error: new InvalidNamedArgumentError(`Transfers`, `Error: Invalid address: ${dummyString}`),
    },
    {
      method: 'assertTransfers',
      message: 'assertTransfers (type 1) throws error on invalid transaction options',
      args: [
        [
          new BigNumber(10),
          '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
          'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          dummyString,
        ],
      ],
      error: new InvalidNamedArgumentError(
        `Transfers`,
        `Error: Invalid argument for TransactionOptions: ${dummyString}`,
      ),
    },
    {
      method: 'assertTransfers',
      message: 'assertTransfers (type 2) throws error on invalid transfer',
      args: [
        [
          [
            {
              amount: dummyInt,
              asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
              to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
            },
          ],
          undefined,
        ],
      ],
      error: new InvalidArgumentError(
        `Invalid argument for Transfers: Error: Invalid argument for Transfer: Error: Expected BigNumber, found: ${dummyInt}`,
      ),
    },
    {
      method: 'assertTransfers',
      message: 'assertTransfers (type 2) throws error on invalid transactionOptions',
      args: [
        [
          [
            {
              amount: new BigNumber(10),
              asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
              to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
            },
          ],
          dummyString,
        ],
      ],
      error: new InvalidNamedArgumentError(
        `Transfers`,
        `Error: Invalid argument for TransactionOptions: ${dummyString}`,
      ),
    },
    {
      method: 'assertUpdateAccountNameOptions',
      message: 'assertUpdatedAccountNameOptions throws error on invalid id network',
      args: [
        {
          id: { network: dummyInt, address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
        },
      ],
      error: new InvalidArgumentError(
        `Invalid argument for UpdateAccountNameOptions: Error: Invalid argument for UserAccountID: Error: Expected network string, found: ${dummyInt}`,
      ),
    },
    {
      method: 'assertUpdateAccountNameOptions',
      message: 'assertUpdatedAccountNameOptions throws error on invalid id address',
      args: [
        {
          id: { network: 'test', address: dummyString },
          name: 'options',
        },
      ],
      error: new InvalidArgumentError(
        `Invalid argument for UpdateAccountNameOptions: Error: Invalid argument for UserAccountID: Error: Invalid address: ${dummyString}`,
      ),
    },
    {
      method: 'assertUpdateAccountNameOptions',
      message: 'assertUpdatedAccountNameOptions throws error on invalid name',
      args: [
        {
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: dummyInt,
        },
      ],
      error: new InvalidNamedArgumentError(`UpdateAccountNameOptions`, `Error: Expected string, found: ${dummyInt}`),
    },
    {
      method: 'assertUserAccount',
      message: 'assertUserAccount throws error on invalid type',
      args: [
        {
          type: dummyInt,
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
          scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
          publicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          configurableName: true,
          deletable: true,
        },
      ],
      error: new InvalidNamedArgumentError(`UserAccount`, `Error: Expected string, found: ${dummyInt}`),
    },
    {
      method: 'assertUserAccount',
      message: 'assertUserAccount throws error on invalid id network',
      args: [
        {
          type: 'MEGA BIG USER MAN',
          id: { network: dummyInt, address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
          scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
          publicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          configurableName: true,
          deletable: true,
        },
      ],
      error: new InvalidArgumentError(
        `Invalid argument for UserAccount: Error: Invalid argument for UserAccountID: Error: Expected network string, found: ${dummyInt}`,
      ),
    },
    {
      method: 'assertUserAccount',
      message: 'assertUserAccount throws error on invalid id address',
      args: [
        {
          type: 'MEGA BIG USER MAN',
          id: { network: 'test', address: dummyString },
          name: 'options',
          scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
          publicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          configurableName: true,
          deletable: true,
        },
      ],
      error: new InvalidArgumentError(
        `Invalid argument for UserAccount: Error: Invalid argument for UserAccountID: Error: Invalid address: ${dummyString}`,
      ),
    },
    {
      method: 'assertUserAccount',
      message: 'assertUserAccount throws error on invalid name',
      args: [
        {
          type: 'MEGA BIG USER MAN',
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: dummyInt,
          scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
          publicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          configurableName: true,
          deletable: true,
        },
      ],
      error: new InvalidNamedArgumentError(`UserAccount`, `Error: Expected string, found: ${dummyInt}`),
    },
    {
      method: 'assertUserAccount',
      message: 'assertUserAccount throws error on invalid scriptHash',
      args: [
        {
          type: 'MEGA BIG USER MAN',
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
          scriptHash: dummyString,
          publicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          configurableName: true,
          deletable: true,
        },
      ],
      error: new InvalidNamedArgumentError(`UserAccount`, `Error: Hash160 must start with '0x', found: ${dummyString}`),
    },
    {
      method: 'assertUserAccount',
      message: 'assertUserAccount throws error on invalid publicKey',
      args: [
        {
          type: 'MEGA BIG USER MAN',
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
          scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
          publicKey: dummyString,
          configurableName: true,
          deletable: true,
        },
      ],
      error: new InvalidNamedArgumentError(`UserAccount`, `Error: Expected hex string, found: ${dummyString}`),
    },
    {
      method: 'assertUserAccount',
      message: 'assertUserAccount throws error on invalid configurableName value',
      args: [
        {
          type: 'MEGA BIG USER MAN',
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
          scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
          publicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          configurableName: dummyInt,
          deletable: true,
        },
      ],
      error: new InvalidNamedArgumentError(`UserAccount`, `Error: Expected boolean, found: ${dummyInt}`),
    },
    {
      method: 'assertUserAccount',
      message: 'assertUserAccount throws error on invalid deletable value',
      args: [
        {
          type: 'MEGA BIG USER MAN',
          id: { network: 'test', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' },
          name: 'options',
          scriptHash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
          publicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          configurableName: true,
          deletable: dummyInt,
        },
      ],
      error: new InvalidNamedArgumentError(`UserAccount`, `Error: Expected boolean, found: ${dummyInt}`),
    },
    {
      method: 'assertUserAccountID',
      message: 'assertUserAccountID throws error on invalid network string',
      args: [
        {
          network: dummyInt,
          address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
      error: new InvalidNamedArgumentError(`UserAccountID`, `Error: Expected network string, found: ${dummyInt}`),
    },
    {
      method: 'assertUserAccountID',
      message: 'assertUserAccountID throws error on invalid address',
      args: [
        {
          network: 'test',
          address: dummyString,
        },
      ],
      error: new InvalidNamedArgumentError(`UserAccountID`, `Error: Invalid address: ${dummyString}`),
    },
    {
      method: 'assertNetworkType',
      message: 'assertNetworkType throws error on invalid network string',
      args: [dummyInt],
      error: new InvalidArgumentError(`Expected network string, found: ${dummyInt}`),
    },
  ] as any;

  for (const testCase of errorTestCases) {
    const { method, message, args, error } = testCase;
    test(message, async () => {
      function testError() {
        (assertArgs as any)[method](...args);
      }
      expect(testError).toThrow(error);
    });
  }

  test('assertAttributeArg throws error through assertTransactionOptions', () => {
    const arg = { attributes: [dummyInt] };
    converters.attribute = jest.fn(() => {
      throw new Error();
    });
    function testError() {
      assertArgs.assertTransactionOptions(arg);
    }
    expect(testError).toThrow(new InvalidNamedArgumentError('AttributeArg', dummyInt) as any);
  });
});
