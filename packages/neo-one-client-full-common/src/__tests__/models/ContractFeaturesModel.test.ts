import { assertContractFeature, getContractProperties, HasPayable, HasStorage } from '../../models';

describe('ContractFeaturesModel', () => {
  test('isContractFeatures', () => {
    expect(assertContractFeature(0)).toEqual(0);
    expect(assertContractFeature(1)).toEqual(1);
    expect(assertContractFeature(4)).toEqual(4);
    expect(assertContractFeature(5)).toEqual(5);

    const assertThrowNeg1 = () => assertContractFeature(-1);
    expect(assertThrowNeg1).toThrowErrorMatchingSnapshot();
    const assertThrow2 = () => assertContractFeature(2);
    expect(assertThrow2).toThrowErrorMatchingSnapshot();
    const assertThrow3 = () => assertContractFeature(3);
    expect(assertThrow3).toThrowErrorMatchingSnapshot();
    const assertThrow6 = () => assertContractFeature(6);
    expect(assertThrow6).toThrowErrorMatchingSnapshot();
  });

  test('getContractProperties', () => {
    expect(getContractProperties({ hasStorage: false, payable: false })).toEqual(0);
    expect(getContractProperties({ hasStorage: false, payable: true })).toEqual(4);
    expect(getContractProperties({ hasStorage: true, payable: false })).toEqual(1);
    expect(getContractProperties({ hasStorage: true, payable: true })).toEqual(5);
  });

  test('HasStorage', () => {
    expect(HasStorage.has(0)).toEqual(false);
    expect(HasStorage.has(1)).toEqual(true);
    expect(HasStorage.has(2)).toEqual(false);
    expect(HasStorage.has(3)).toEqual(false);
    expect(HasStorage.has(4)).toEqual(false);
    expect(HasStorage.has(5)).toEqual(true);
    expect(HasStorage.has(6)).toEqual(false);
  });

  test('HasPayable', () => {
    expect(HasPayable.has(0)).toEqual(false);
    expect(HasPayable.has(1)).toEqual(false);
    expect(HasPayable.has(2)).toEqual(false);
    expect(HasPayable.has(3)).toEqual(false);
    expect(HasPayable.has(4)).toEqual(true);
    expect(HasPayable.has(5)).toEqual(true);
    expect(HasPayable.has(6)).toEqual(false);
  });
});
