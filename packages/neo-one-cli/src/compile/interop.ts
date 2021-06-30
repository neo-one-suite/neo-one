import { ContractABIClient } from '@neo-one/client';
import { ContractManifestClient } from '@neo-one/client-common';
import { JSONObject } from '@neo-one/utils';

const getJmpMethodDefinition = (contractName: string) => ({
  name: `${contractName},@Jmp`,
  id: '0',
  range: `0-1`,
  params: ['operation,String', 'args,Array'],
  return: '',
  variables: [],
  'sequence-points': [],
});

const getJmpLMethodDefinition = (contractName: string) => ({
  name: `${contractName},@Jmp_L`,
  id: '0',
  range: `0-4`,
  params: ['operation,String', 'args,Array'],
  return: '',
  variables: [],
  'sequence-points': [],
});

const getDispatcherMethodDefinition = (contractName: string, jumpAddress: number, finalAddress: number) => ({
  name: `${contractName},@Dispatcher`,
  id: '1',
  range: `${jumpAddress}-${finalAddress}`,
  params: ['operation,String', 'args,Array'],
  return: '',
  variables: [],
  'sequence-points': [],
});

const convertManifest = (manifest: ContractManifestClient, extra: JSONObject) => ({
  name: manifest.name,
  groups: manifest.groups.map((g) => ({
    publickey: g.publicKey,
    signature: g.signature,
  })),
  supportedstandards: manifest.supportedStandards,
  abi: convertABI(manifest.abi),
  permissions: manifest.permissions.map((p) => ({
    contract:
      p.contract.group === undefined && p.contract.hash === undefined
        ? '*'
        : p.contract.group === undefined
        ? p.contract.hash
        : p.contract.group,
    methods: p.methods === '*' ? '*' : p.methods,
  })),
  trusts: manifest.trusts === '*' ? '*' : manifest.trusts.map((t) => ({ hash: t.hash, group: t.group })),
  extra,
});

const convertABI = (abi: ContractABIClient) => ({
  methods: abi.methods.map((m) => ({
    name: m.name,
    offset: m.offset,
    safe: m.safe,
    returntype: m.returnType.type,
    parameters: m.parameters?.map((p) => ({
      name: p.name,
      type: p.type,
    })),
  })),
  events: abi.events.map((e) => ({
    name: e.name,
    parameters: e.parameters.map((p) => ({
      name: p.name,
      type: p.type,
    })),
  })),
});

export { getJmpMethodDefinition, getJmpLMethodDefinition, getDispatcherMethodDefinition, convertManifest };
