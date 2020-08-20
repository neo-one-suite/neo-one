import {
  assertWitnessScope,
  assertWitnessScopeJSON,
  toJSONWitnessScope,
  toWitnessScope,
  witnessScopeHasFlag,
  WitnessScopeModel,
} from '../../models/WitnessScopeModel';

describe('Witness Scope - Functions', () => {
  const goodScope = WitnessScopeModel.Global;
  const goodString = 'Global';

  test('To Witness Scope', () => {
    const witnessScope = toWitnessScope(goodString);
    expect(witnessScope).toEqual(goodScope);
  });
  test('To JSON Witness Scope', () => {
    const JSONWitnessScope = toJSONWitnessScope(goodScope);
    expect(JSONWitnessScope).toEqual(goodString);
  });
  test('Has Flags - Should Pass', () => {
    expect(witnessScopeHasFlag('CalledByEntryAndCustomContracts', 'CalledByEntry')).toEqual(true);
    expect(witnessScopeHasFlag('CalledByEntryAndCustomContracts', 'CustomContracts')).toEqual(true);
  });
  test('Has Flags - Should Fail', () => {
    expect(witnessScopeHasFlag('CalledByEntryAndCustomContracts', 'Global')).toEqual(false);
    expect(witnessScopeHasFlag('CalledByEntryAndCustomContracts', 'CustomGroups')).toEqual(false);
  });
});

describe('Witness Scope - Errors', () => {
  const badNum = 20;
  const badString = '20';

  test('Errors', () => {
    const contractParameterThrow = () => assertWitnessScope(badNum);
    expect(contractParameterThrow).toThrowError(`Expected witness scope, found: ${badNum.toString(16)}`);
  });
  test('assertWitnessScopeJSON - badString', () => {
    const contractParameterJSONThrow = () => assertWitnessScopeJSON(badString);
    expect(contractParameterJSONThrow).toThrowError(`Invalid WitnessScope: ${badString}`);
  });
});
