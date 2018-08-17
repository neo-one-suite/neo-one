import { ScriptBuilderParam } from '@neo-one/client-core';
import * as utils from '../utils';

describe('utils', () => {
  const address = 'Aae5FtScNeBqahNBzrFXr9TcyxNFTQqqMM';
  const method = 'method';
  const params: ScriptBuilderParam[] = [];

  test('getInvokeMethodInvocationScript', () => {
    const result = utils.getInvokeMethodInvocationScript({ method, params });

    expect(result).toMatchSnapshot();
  });

  test('getInvokeMethodScript', () => {
    const result = utils.getInvokeMethodScript({ address, method, params });

    expect(result).toMatchSnapshot();
  });
});
