import {
  common,
  ContractEventDescriptor,
  ContractGroup,
  ContractMethodDescriptor,
  ContractParameterDefinition,
  ContractPermission,
  MethodTokenModel,
  NefFileModel,
  toContractParameterType,
} from '@neo-one/client-common';
import { helpers } from '../../../../__data__';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Contract', () => {
  test('properties', async () => {
    const node = await helpers.startNode();

    const contract = await node.addContract(`
      assertEqual(1, 1);
    `);
    const { compiler, checksum: checkSum, script, tokens: tokensOut } = contract.contract.nef;
    const { name, groups, supportedStandards, abi, permissions, trusts, extra } = contract.contract.manifest;
    const { methods, events } = abi;

    const checkGroup = (idx: number, group: ContractGroup) => `
      group = groups[${idx}];

      assertEqual(group instanceof ContractGroup, true);
      assertEqual(group.publicKey, ${helpers.getBufferHash(group.publicKey)});
      assertEqual(group.signature, ${helpers.getBufferHash(group.signature)});
    `;

    const checkStandard = (idx: number, standard: string) => `
      standard = standards[${idx}];

      assertEqual(standard, '${standard}');
    `;

    const checkMethod = (idx: number, method: string) => `
      method = methods[${idx}];

      assertEqual(method, '${method}');
    `;

    const checkPermission = (idx: number, permission: ContractPermission) => `
      permission = permissions[${idx}];

      assertEqual(permission instanceof ContractPermission, true);

      const methods = permission.methods;
      ${typeof permission.methods === 'string' ? 'assertEqual(methods, undefined);' : ''}
      assertEqual(methods?.length ?? 0, ${permission.methods.length});
      ${typeof permission.methods === 'string' ? '' : 'let method: string;'}
      ${
        typeof permission.methods === 'string'
          ? ''
          : permission.methods.map((method, idxIn) => checkMethod(idxIn, method)).join('')
      }

      ${
        permission.contract.group === undefined && permission.contract.hash === undefined
          ? 'assertEqual(permission.contract, undefined);'
          : ''
      }
      ${
        permission.contract.group !== undefined
          ? `assertEqual(permission.contract, PublicKey.from('${permission.contract.group}'));`
          : ''
      }
      ${
        permission.contract.hash !== undefined
          ? `assertEqual(permission.contract, Address.from('${permission.contract.hash}'));`
          : ''
      }


    `;

    const checkParam = (idx: number, param: ContractParameterDefinition, nameIn: string) => `
      abiMethodParam${nameIn} = abiMethod.parameters[${idx}];

      assertEqual(abiMethodParam${nameIn} instanceof ContractParameterDefinition, true);
      assertEqual(abiMethodParam${nameIn}.name, '${param.name}');
      assertEqual(abiMethodParam${nameIn}.type, ${param.type});
    `;

    const checkContractMethod = (idx: number, method: ContractMethodDescriptor) => `
      abiMethod = abiMethods[${idx}];

      assertEqual(abiMethod instanceof ContractMethodDescriptor, true);
      assertEqual(abiMethod.name, '${method.name}');
      ${method.parameters ? `assertEqual(abiMethod.parameters.length, ${method.parameters?.length});` : ''}
      ${
        method.parameters !== undefined && method.parameters.length > 0
          ? `let abiMethodParams${method.name}: ContractMethodDescriptor;`
          : ''
      }
      ${method.parameters?.map((param, idxIn) => checkParam(idxIn, param, method.name)).join('') ?? ''};

      assertEqual(abiMethod.returnType, ${toContractParameterType(method.returnType)});
      assertEqual(abiMethod.offset, ${method.offset});
      assertEqual(abiMethod.safe, ${method.safe});
    `;

    const checkContractEvent = (idx: number, event: ContractEventDescriptor) => `
      abiEvent = abiEvents[${idx}];

      assertEqual(abiEvent instanceof ContractEventDescriptor, true);
      assertEqual(abiEvent.name, '${event.name}');
      assertEqual(abiEvent.parameters.length, ${event.parameters.length});
      let abiEventParams${event.name}: ContractEventDescriptor;
      ${event.parameters.map((param, idxIn) => checkParam(idxIn, param, event.name)).join('')}
    `;

    const checkTrust = (idx: number, trust: string) => `
      trust = trusts[${idx}];

      assertEqual(trust, Address.from('${trust}'));
    `;

    const nefBuffer = new NefFileModel({
      compiler,
      checkSum,
      tokens: tokensOut.map(
        (token) =>
          new MethodTokenModel({
            hash: common.stringToUInt160(token.hash),
            method: token.method,
            paramCount: token.paramCount,
            hasReturnValue: token.hasReturnValue,
            callFlags: token.callFlags,
          }),
      ),
      script: Buffer.from(script, 'base64'),
    })
      .serializeWire()
      .toString('base64');

    await node.executeString(`
      import {
        Contract,
        Address,
        ContractManifest,
        ${permissions.some((perm) => perm.contract.group !== undefined) ? 'PublicKey,' : ''}
        ${groups.length > 0 ? 'ContractGroup,' : ''}
        ${permissions.length > 0 ? 'ContractPermission,' : ''}
        ${methods.length > 0 ? 'ContractMethodDescriptor,' : ''}
        ${events.length > 0 ? 'ContractEventDescriptor,' : ''}
        ${
          methods.some((method) => method.parameters !== undefined && method.parameters.length > 0) ||
          events.some((event) => event.parameters.length > 0)
            ? 'ContractParameterDefinition,'
            : ''
        }
        ContractABI,
      } from '@neo-one/smart-contract';

      const contract = Contract.for(Address.from('${contract.address}'));

      if (contract === undefined) {
        assertEqual(contract !== undefined, true);
        throw new Error('For TS');
      }

      assertEqual(contract instanceof Contract, true);
      assertEqual(contract.hash, Address.from('${contract.contract.hash}'));
      assertEqual(contract.id, 1);
      assertEqual(contract.updateCounter, 0);
      assertEqual(contract.nef, ${helpers.getBufferHash(nefBuffer, 'base64')});

      const manifest = contract.manifest;
      assertEqual(manifest instanceof ContractManifest, true);
      assertEqual(manifest.name, '${name}');

      const groups = manifest.groups;
      assertEqual(groups.length, ${groups.length});
      ${groups.length > 0 ? 'let group: ContractGroup;' : ''}
      ${groups.map((group, idx) => checkGroup(idx, group)).join('')}

      const supportedStandards = manifest.supportedStandards;
      assertEqual(supportedStandards.length, ${supportedStandards.length});
      ${supportedStandards.length > 0 ? 'let standard: string;' : ''}
      ${supportedStandards.map((std, idx) => checkStandard(idx, std)).join('')}

      const permissions = manifest.permissions;
      assertEqual(permissions.length, ${permissions.length});
      ${permissions.length > 0 ? 'let permission: ContractPermission;' : ''}
      ${permissions.map((perm, idx) => checkPermission(idx, perm)).join('')}

      const abi = manifest.abi;
      assertEqual(abi instanceof ContractABI, true);

      const abiMethods = abi.methods;
      assertEqual(abiMethods.length, ${methods.length});
      ${methods.length > 0 ? 'let abiMethod: ContractMethodDescriptor;' : ''}
      ${methods.map((method, idx) => checkContractMethod(idx, method)).join('')}

      const abiEvents = abi.events;
      assertEqual(abiEvents.length, ${events.length});
      ${events.length > 0 ? 'let abiEvent: ContractEventDescriptor;' : ''}
      ${events.map((event, idx) => checkContractEvent(idx, event)).join('')}

      ${trusts !== '*' ? 'let trust: Address;' : ''}
      ${
        trusts === '*'
          ? `assertEqual(manifest.trusts, ${trusts === '*' ? 'undefined' : ''});`
          : trusts.map((trust, idx) => checkTrust(idx, trust)).join('')
      }
      assertEqual(manifest.extra, '${JSON.stringify(extra)}');
    `);
  });

  test('contract is undefined', async () => {
    const node = await helpers.startNode();
    const emptyAddress = 'NdmRd7kTFVE3imhTFhJC4BVwi6ESRSmtYS';

    await node.executeString(`
      import { Contract, Address } from '@neo-one/smart-contract';

      const contract = Contract.for(Address.from('${emptyAddress}'));
      assertEqual(contract === undefined, true);
    `);
  });

  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      class MyContract implements Contract {
      }
    `,
      { type: 'error' },
    );
  });

  test('invalid reference', async () => {
    await helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      const for = Contract.for;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid "reference"', async () => {
    await helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      const for = Contract['for'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('invalid reference - object', async () => {
    await helpers.compileString(
      `
      import { Contract } from '@neo-one/smart-contract';

      const { for } = Contract;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });
});
