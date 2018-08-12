import { ABI } from '@neo-one/client-core';
import { genEvent } from './genEvent';
import { genReadSmartContract } from './genReadSmartContract';
import { genSmartContract } from './genSmartContract';
import { getEventName } from './getEventName';
import { getSingleEventName } from './getSingleEventName';

const getImportClauses = (text: string) => {
  const mutableClauses: string[] = [];

  if (text.includes('SignatureString')) {
    mutableClauses.push('SignatureString');
  }

  if (text.includes('Hash160String')) {
    mutableClauses.push('Hash160String');
  }

  if (text.includes('Hash256String')) {
    mutableClauses.push('Hash256String');
  }

  if (text.includes('PublicKeyString')) {
    mutableClauses.push('PublicKeyString');
  }

  if (text.includes('TransactionResult')) {
    mutableClauses.push('TransactionResult');
  }

  if (text.includes('InvokeReceipt')) {
    mutableClauses.push('InvokeReceipt');
  }

  if (text.includes('Event<')) {
    mutableClauses.push('Event');
  }

  return mutableClauses;
};

export const genSmartContractTypes = (name: string, abi: ABI): string => {
  const events = abi.events === undefined ? [] : abi.events;
  const text = `
${events.map((event) => genEvent(name, event)).join('\n')}
${genSmartContract(name, abi)}${genReadSmartContract(name, abi)}`;

  const importClauses = getImportClauses(text).concat(['SmartContract', 'ReadSmartContract']);
  // tslint:disable-next-line no-array-mutation
  importClauses.sort();

  const importDecl = `import { ${importClauses.join(', ')} } from '@neo-one/client';`;
  const eventType = `export type ${getEventName(name)} = ${
    events.length === 0 ? '{}' : events.map((event) => getSingleEventName(name, event.name)).join(' | ')
  }`;

  return `${importDecl}

${eventType}
${text}`;
};
