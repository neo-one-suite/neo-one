import {
  assertWitnessScope,
  assertWitnessScopeJSON,
  toJSONWitnessScope,
  toWitnessScope,
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
