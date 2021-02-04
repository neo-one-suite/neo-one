import {
  ContractEventDescriptorClient,
  ContractGroup,
  ContractMethodDescriptorClient,
  ContractPermission,
  UInt160Hex,
  WildcardContainer,
} from '@neo-one/client-common';
import { tsUtils } from '@neo-one/ts-utils';
import { OmitStrict, utils } from '@neo-one/utils';
import ts from 'typescript';
import { DEFAULT_CONTRACT_PROPERTIES } from '../constants';
import { Context } from '../Context';
import {
  ContractInfo,
  DebugInfo,
  getAllPropInfos,
  getContractInfo,
  getContractProperties,
  getDebugInfo,
} from '../contract';
import { getManifest } from '../contract/getManifest';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';
import {
  BuiltinInstanceMemberAccessor,
  BuiltinInstanceMemberCallableProperty,
  BuiltinInstanceMemberMethod,
  BuiltinInstanceMemberStorageProperty,
  BuiltinInstanceMemberStructuredStorageProperty,
} from './builtins';

const getSmartContract = (context: Context, sourceFile: ts.SourceFile) => {
  const classDecls = tsUtils.statement
    .getStatements(sourceFile)
    .filter(ts.isClassDeclaration)
    .filter((decl) => tsUtils.modifier.isNamedExport(decl))
    .filter((decl) => context.analysis.isSmartContract(decl));

  if (classDecls.length === 0) {
    return undefined;
  }

  if (classDecls.length === 1) {
    return classDecls[0];
  }

  context.reportError(classDecls[1], DiagnosticCode.InvalidContract, DiagnosticMessage.InvalidContractMultipleInFile);

  return classDecls[0];
};

const addOverrideSymbol = (context: Context, contractInfo: ContractInfo, overrideSymbol?: ts.Symbol) => {
  const superSymbol = context.analysis.getSymbol(contractInfo.smartContract);
  if (superSymbol === undefined) {
    /* istanbul ignore next */
    return;
  }

  if (overrideSymbol !== undefined) {
    context.builtins.addOverride(superSymbol, overrideSymbol);
  }

  const superSmartContract = contractInfo.superSmartContract;
  if (superSmartContract !== undefined) {
    addOverrideSymbol(context, superSmartContract, superSymbol);
  }
};

const addContractInfo = (context: Context, contractInfo: ContractInfo) => {
  const propertyNameToOverride = new Map<string, ts.Symbol>();
  getAllPropInfos(contractInfo).forEach((propInfo) => {
    const symbol = context.analysis.getSymbol(propInfo.classDecl);
    if (symbol !== undefined && propInfo.type !== 'deploy' && propInfo.type !== 'upgrade') {
      const memberSymbol = propInfo.symbol;
      switch (propInfo.type) {
        case 'function':
          if (ts.isPropertyDeclaration(propInfo.decl)) {
            context.builtins.addMember(symbol, memberSymbol, new BuiltinInstanceMemberCallableProperty(propInfo.decl));
          } else {
            context.builtins.addMember(symbol, memberSymbol, new BuiltinInstanceMemberMethod(propInfo.decl));
          }
          break;
        case 'accessor':
          context.builtins.addMember(
            symbol,
            memberSymbol,
            new BuiltinInstanceMemberAccessor(
              propInfo.getter === undefined ? undefined : propInfo.getter.decl,
              propInfo.setter === undefined ? undefined : propInfo.setter.decl,
            ),
          );
          break;
        case 'property':
          if (propInfo.structuredStorageType === undefined) {
            context.builtins.addMember(symbol, memberSymbol, new BuiltinInstanceMemberStorageProperty(propInfo.name));
          } else {
            context.builtins.addMember(
              symbol,
              memberSymbol,
              new BuiltinInstanceMemberStructuredStorageProperty(propInfo.structuredStorageType, propInfo.name),
            );
          }
          break;
        default:
          /* istanbul ignore next */
          utils.assertNever(propInfo);
          /* istanbul ignore next */
          throw new Error('For TS');
      }

      const memberName = tsUtils.symbol.getName(memberSymbol);
      const overrideSymbol = propertyNameToOverride.get(memberName);
      if (overrideSymbol === undefined) {
        propertyNameToOverride.set(memberName, memberSymbol);
      } else {
        context.builtins.addOverride(memberSymbol, overrideSymbol);
      }
    }
  });

  addOverrideSymbol(context, contractInfo);
};

export type SmartContractInfoMethodDescriptor = OmitStrict<ContractMethodDescriptorClient, 'offset'>;

export interface SmartContractInfoABI {
  readonly methods: readonly SmartContractInfoMethodDescriptor[];
  readonly events: readonly ContractEventDescriptorClient[];
}

export interface SmartContractInfoManifest {
  readonly groups: readonly ContractGroup[];
  readonly supportedStandards: readonly string[];
  readonly abi: SmartContractInfoABI;
  readonly permissions: readonly ContractPermission[];
  readonly trusts: WildcardContainer<UInt160Hex>;
}

export interface SmartContractInfo {
  readonly name: string;
  readonly contractInfo: ContractInfo | undefined;
  readonly debugInfo: DebugInfo;
  readonly manifest: SmartContractInfoManifest;
}

// TODO: should name be in SmartContractInfoManifest?
export const getSmartContractInfo = (context: Context, sourceFile: ts.SourceFile): SmartContractInfo => {
  const smartContract = getSmartContract(context, sourceFile);
  const contractInfo = smartContract === undefined ? undefined : getContractInfo(context, smartContract);
  const properties =
    smartContract === undefined ? DEFAULT_CONTRACT_PROPERTIES : getContractProperties(context, smartContract);
  if (contractInfo !== undefined) {
    addContractInfo(context, contractInfo);

    return {
      name: properties.name,
      contractInfo,
      manifest: getManifest(context, contractInfo, properties),
      debugInfo: getDebugInfo(context, contractInfo),
    };
  }

  return {
    name: properties.name,
    contractInfo,
    manifest: {
      groups: [],
      supportedStandards: [],
      abi: {
        methods: [],
        events: [],
      },
      permissions: [],
      trusts: '*',
    },
    debugInfo: {
      entrypoint: '',
      documents: [],
      methods: [],
      events: [],
    },
  };
};
