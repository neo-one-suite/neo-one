import { ABI } from '@neo-one/client-common';
import { genSmartContractTypes } from '../types';

const testABI = (abi: ABI, name: string) => {
  test(name, () => {
    expect({
      inputABI: abi,
      types: genSmartContractTypes(name, abi, false),
    }).toMatchSnapshot();
  });
};

export const testUtils = {
  testABI,
};
