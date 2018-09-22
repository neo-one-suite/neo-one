import { ScriptBuilderParam } from '@neo-one/client-common';
import { clientUtils } from '../clientUtils';

describe('clientUtils', () => {
  const address = 'Aae5FtScNeBqahNBzrFXr9TcyxNFTQqqMM';
  const method = 'method';
  const params: ScriptBuilderParam[] = [];

  test('getInvokeMethodInvocationScript', () => {
    const result = clientUtils.getInvokeMethodInvocationScript({ method, params });

    expect(result).toMatchSnapshot();
  });

  test('getInvokeMethodScript', () => {
    const result = clientUtils.getInvokeMethodScript({ address, method, params });

    expect(result).toMatchSnapshot();
  });
});
