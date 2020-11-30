import { Builtins } from '../Builtins';
import { add as addAccount } from './account';
import { add as addAddress } from './address';
import { add as addArrayStorage } from './arrayStorage';
import { add as addAttribute } from './attribute';
import { add as addAttributeUsage } from './attributeUsage';
import { add as addBlock } from './block';
import { add as addBlockchain } from './blockchain';
import { add as addContract } from './contract';
import { add as addCreateEventNotifier } from './createEventNotifier';
import { add as addCrypto } from './crypto';
import { add as addDeclareEvent } from './declareEvent';
import { add as addDeploy } from './deploy';
import { add as addForwardValue } from './forwardValue';
import { add as addHash160 } from './hash160';
import { add as addHash256 } from './hash256';
import { add as addHeader } from './header';
import { add as addLinkedSmartContract } from './linkedSmartContract';
import { add as addMapStorage } from './mapStorage';
import { add as addPublicKey } from './publicKey';
import { add as addSetStorage } from './setStorage';
import { add as addSmartContract } from './smartContract';
import { add as addTransaction } from './transaction';

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  addAccount(builtins);
  addAddress(builtins);
  addArrayStorage(builtins);
  addBlock(builtins);
  addBlockchain(builtins);
  addContract(builtins);
  addCreateEventNotifier(builtins);
  addCrypto(builtins);
  addDeclareEvent(builtins);
  addDeploy(builtins);
  addForwardValue(builtins);
  addHash256(builtins);
  addHash160(builtins);
  addHeader(builtins);
  addLinkedSmartContract(builtins);
  addMapStorage(builtins);
  addPublicKey(builtins);
  addSetStorage(builtins);
  addSmartContract(builtins);
  addTransaction(builtins);

  // void calls saved for later implementations
  addAttribute(builtins);
  addAttributeUsage(builtins);
};
