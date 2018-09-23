import { nep5 } from '../../__data__';
import { genSmartContractTypes } from '../../types';

describe('genSmartContractTypes', () => {
  test('NEP5', () => {
    expect(genSmartContractTypes('Token', nep5.abi(4))).toMatchSnapshot();
  });

  test('Object', () => {
    expect(
      genSmartContractTypes('Token', {
        functions: [
          {
            name: 'foo',
            parameters: [
              {
                type: 'Object',
                name: 'bar',
                properties: {
                  baz: {
                    type: 'Object',
                    properties: {
                      qux: { type: 'String' },
                    },
                  },
                },
              },
            ],
            returnType: { type: 'Void' },
          },
        ],
      }),
    ).toMatchSnapshot();
  });
});
