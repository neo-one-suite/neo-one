import { keys } from '../../__data__';
import { common } from '../../common';
import { CosignerAdd, CosignerModel } from '../../models/SignerModel';
import { toWitnessScope } from '../../models/WitnessScopeModel';

const testAccount = keys[0].scriptHash;
const testContract = keys[1].scriptHash;
const testGroup = keys[2].publicKey;

const optionsBuilder = ({
  account = testAccount,
  scopes = 'Global',
  allowedContracts = [],
  allowedGroups = [],
}: Partial<CosignerAdd> = {}): CosignerAdd => ({
  account,
  scopes,
  allowedContracts,
  allowedGroups,
});

// TODO: check and run this test
describe('Cosigner Model', () => {
  test('SerializeWire', () => {
    const cosigner = new CosignerModel(optionsBuilder());
    const serialized = cosigner.serializeWire();
    expect(serialized).toEqual(
      Buffer.concat([common.uInt160ToBuffer(testAccount), Buffer.from([toWitnessScope('Global')])]),
    );
  });

  test('SerializeWire - CustomContracts Scope', () => {
    const contractCosigner = new CosignerModel(
      optionsBuilder({
        scopes: 'CustomContracts',
        allowedContracts: [testContract],
      }),
    );

    expect(contractCosigner.serializeWire()).toEqual(
      Buffer.concat([
        common.uInt160ToBuffer(testAccount),
        Buffer.from([toWitnessScope('CustomContracts')]),
        Buffer.from([0x01]),
        common.uInt160ToBuffer(testContract),
      ]),
    );
  });

  test('SerializeWire - CustomGroups Scope', () => {
    const groupCosigner = new CosignerModel(
      optionsBuilder({
        scopes: 'CustomGroups',
        allowedGroups: [testGroup],
      }),
    );

    expect(groupCosigner.serializeWire()).toEqual(
      Buffer.concat([
        common.uInt160ToBuffer(testAccount),
        Buffer.from([toWitnessScope('CustomGroups')]),
        Buffer.from([0x01]),
        testGroup,
      ]),
    );
  });

  test('SerializeWire - CustomContractsAndCustomGroups Scope', () => {
    const bothCosigner = new CosignerModel(
      optionsBuilder({
        scopes: 'CustomContractsAndCustomGroups',
        allowedContracts: [testContract],
        allowedGroups: [testGroup],
      }),
    );

    expect(bothCosigner.serializeWire()).toEqual(
      Buffer.concat([
        common.uInt160ToBuffer(testAccount),
        Buffer.from([toWitnessScope('CustomContractsAndCustomGroups')]),
        Buffer.from([0x01]),
        common.uInt160ToBuffer(testContract),
        Buffer.from([0x01]),
        testGroup,
      ]),
    );
  });
});
