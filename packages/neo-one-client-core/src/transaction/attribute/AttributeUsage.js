/* @flow */
import { CustomError } from '@neo-one/utils';

export const ATTRIBUTE_USAGE = {
  CONTRACT_HASH: 0x00,
  ECDH02: 0x02,
  ECDH03: 0x03,
  SCRIPT: 0x20,
  VOTE: 0x30,
  DESCRIPTION_URL: 0x81,
  DESCRIPTION: 0x90,
  HASH1: 0xa1,
  HASH2: 0xa2,
  HASH3: 0xa3,
  HASH4: 0xa4,
  HASH5: 0xa5,
  HASH6: 0xa6,
  HASH7: 0xa7,
  HASH8: 0xa8,
  HASH9: 0xa9,
  HASH10: 0xaa,
  HASH11: 0xab,
  HASH12: 0xac,
  HASH13: 0xad,
  HASH14: 0xae,
  HASH15: 0xaf,
  REMARK: 0xf0,
  REMARK1: 0xf1,
  REMARK2: 0xf2,
  REMARK3: 0xf3,
  REMARK4: 0xf4,
  REMARK5: 0xf5,
  REMARK6: 0xf6,
  REMARK7: 0xf7,
  REMARK8: 0xf8,
  REMARK9: 0xf9,
  REMARK10: 0xfa,
  REMARK11: 0xfb,
  REMARK12: 0xfc,
  REMARK13: 0xfd,
  REMARK14: 0xfe,
  REMARK15: 0xff,
};

export type AttributeUsage =
  | 0x00 // CONTRACT_HASH
  | 0x02 // ECDH02
  | 0x03 // ECDH03
  | 0x20 // SCRIPT
  | 0x30 // VOTE
  | 0x81 // DESCRIPTION_URL
  | 0x90 // DESCRIPTION
  | 0xa1 // HASH1
  | 0xa2 // HASH2
  | 0xa3 // HASH3
  | 0xa4 // HASH4
  | 0xa5 // HASH5
  | 0xa6 // HASH6
  | 0xa7 // HASH7
  | 0xa8 // HASH8
  | 0xa9 // HASH9
  | 0xaa // HASH10
  | 0xab // HASH11
  | 0xac // HASH12
  | 0xad // HASH13
  | 0xae // HASH14
  | 0xaf // HASH15
  | 0xf0 // REMARK
  | 0xf1 // REMARK1
  | 0xf2 // REMARK2
  | 0xf3 // REMARK3
  | 0xf4 // REMARK4
  | 0xf5 // REMARK5
  | 0xf6 // REMARK6
  | 0xf7 // REMARK7
  | 0xf8 // REMARK8
  | 0xf9 // REMARK9
  | 0xfa // REMARK10
  | 0xfb // REMARK11
  | 0xfc // REMARK12
  | 0xfd // REMARK13
  | 0xfe // REMARK14
  | 0xff;

export class InvalidAttributeUsageError extends CustomError {
  transactionAttributeUsage: number;
  code: string;

  constructor(transactionAttributeUsage: number) {
    super(
      `Expected transaction attribute usage, ` +
        `found: ${transactionAttributeUsage.toString(16)}`,
    );
    this.transactionAttributeUsage = transactionAttributeUsage;
    this.code = 'INVALID_ATTRIBUTE_USAGE';
  }
}

export const assertAttributeUsage = (value: number): AttributeUsage => {
  switch (value) {
    case 0x00: // ContractHash
      return 0x00;
    case 0x02: // ECDH02
      return 0x02;
    case 0x03: // ECDH03
      return 0x03;
    case 0x20: // Script
      return 0x20;
    case 0x30: // Vote
      return 0x30;
    case 0x81: // DescriptionUrl
      return 0x81;
    case 0x90: // Description
      return 0x90;
    case 0xa1: // Hash1
      return 0xa1;
    case 0xa2: // Hash2
      return 0xa2;
    case 0xa3: // Hash3
      return 0xa3;
    case 0xa4: // Hash4
      return 0xa4;
    case 0xa5: // Hash5
      return 0xa5;
    case 0xa6: // Hash6
      return 0xa6;
    case 0xa7: // Hash7
      return 0xa7;
    case 0xa8: // Hash8
      return 0xa8;
    case 0xa9: // Hash9
      return 0xa9;
    case 0xaa: // Hash10
      return 0xaa;
    case 0xab: // Hash11
      return 0xab;
    case 0xac: // Hash12
      return 0xac;
    case 0xad: // Hash13
      return 0xad;
    case 0xae: // Hash14
      return 0xae;
    case 0xaf: // Hash15
      return 0xaf;
    case 0xf0: // Remark
      return 0xf0;
    case 0xf1: // Remark1
      return 0xf1;
    case 0xf2: // Remark2
      return 0xf2;
    case 0xf3: // Remark3
      return 0xf3;
    case 0xf4: // Remark4
      return 0xf4;
    case 0xf5: // Remark5
      return 0xf5;
    case 0xf6: // Remark6
      return 0xf6;
    case 0xf7: // Remark7
      return 0xf7;
    case 0xf8: // Remark8
      return 0xf8;
    case 0xf9: // Remark9
      return 0xf9;
    case 0xfa: // Remark10
      return 0xfa;
    case 0xfb: // Remark11
      return 0xfb;
    case 0xfc: // Remark12
      return 0xfc;
    case 0xfd: // Remark13
      return 0xfd;
    case 0xfe: // Remark14
      return 0xfe;
    case 0xff: // Remark15
      return 0xff;
    default:
      throw new InvalidAttributeUsageError(value);
  }
};

export class InvalidAttributeUsageJSONError extends CustomError {
  code: string;
  transactionAttributeUsage: string;

  constructor(transactionAttributeUsage: string) {
    super(
      `Expected transaction attribute usage, ` +
        `found: ${transactionAttributeUsage}`,
    );
    this.code = 'INVALID_ATTRIBUTE_USAGE_JSON';
    this.transactionAttributeUsage = transactionAttributeUsage;
  }
}

export type AttributeUsageJSON =
  | 'DescriptionUrl' // Buffer
  | 'Description'
  | 'Remark'
  | 'Remark1'
  | 'Remark2'
  | 'Remark3'
  | 'Remark4'
  | 'Remark5'
  | 'Remark6'
  | 'Remark7'
  | 'Remark8'
  | 'Remark9'
  | 'Remark10'
  | 'Remark11'
  | 'Remark12'
  | 'Remark13'
  | 'Remark14'
  | 'Remark15'
  | 'ECDH02' // ECPoint
  | 'ECDH03' // ECPoint
  | 'Script' // UInt160
  | 'ContractHash' // UInt256
  | 'Vote'
  | 'Hash1'
  | 'Hash2'
  | 'Hash3'
  | 'Hash4'
  | 'Hash5'
  | 'Hash6'
  | 'Hash7'
  | 'Hash8'
  | 'Hash9'
  | 'Hash10'
  | 'Hash11'
  | 'Hash12'
  | 'Hash13'
  | 'Hash14'
  | 'Hash15';

export const toJSONAttributeUsage = (
  usage: AttributeUsage,
): AttributeUsageJSON => {
  switch (usage) {
    case 0x00:
      return 'ContractHash';
    case 0x02:
      return 'ECDH02';
    case 0x03:
      return 'ECDH03';
    case 0x20:
      return 'Script';
    case 0x30:
      return 'Vote';
    case 0x81:
      return 'DescriptionUrl';
    case 0x90:
      return 'Description';
    case 0xa1:
      return 'Hash1';
    case 0xa2:
      return 'Hash2';
    case 0xa3:
      return 'Hash3';
    case 0xa4:
      return 'Hash4';
    case 0xa5:
      return 'Hash5';
    case 0xa6:
      return 'Hash6';
    case 0xa7:
      return 'Hash7';
    case 0xa8:
      return 'Hash8';
    case 0xa9:
      return 'Hash9';
    case 0xaa:
      return 'Hash10';
    case 0xab:
      return 'Hash11';
    case 0xac:
      return 'Hash12';
    case 0xad:
      return 'Hash13';
    case 0xae:
      return 'Hash14';
    case 0xaf:
      return 'Hash15';
    case 0xf0:
      return 'Remark';
    case 0xf1:
      return 'Remark1';
    case 0xf2:
      return 'Remark2';
    case 0xf3:
      return 'Remark3';
    case 0xf4:
      return 'Remark4';
    case 0xf5:
      return 'Remark5';
    case 0xf6:
      return 'Remark6';
    case 0xf7:
      return 'Remark7';
    case 0xf8:
      return 'Remark8';
    case 0xf9:
      return 'Remark9';
    case 0xfa:
      return 'Remark10';
    case 0xfb:
      return 'Remark11';
    case 0xfc:
      return 'Remark12';
    case 0xfd:
      return 'Remark13';
    case 0xfe:
      return 'Remark14';
    case 0xff:
      return 'Remark15';
    default:
      // eslint-disable-next-line
      (usage: empty);
      throw new InvalidAttributeUsageError(usage);
  }
};

export const assertAttributeUsageJSON = (usage: string): AttributeUsageJSON => {
  switch (usage) {
    case 'DescriptionUrl':
      return 'DescriptionUrl';
    case 'Description':
      return 'Description';
    case 'Remark':
      return 'Remark';
    case 'Remark1':
      return 'Remark1';
    case 'Remark2':
      return 'Remark2';
    case 'Remark3':
      return 'Remark3';
    case 'Remark4':
      return 'Remark4';
    case 'Remark5':
      return 'Remark5';
    case 'Remark6':
      return 'Remark6';
    case 'Remark7':
      return 'Remark7';
    case 'Remark8':
      return 'Remark8';
    case 'Remark9':
      return 'Remark9';
    case 'Remark10':
      return 'Remark10';
    case 'Remark11':
      return 'Remark11';
    case 'Remark12':
      return 'Remark12';
    case 'Remark13':
      return 'Remark13';
    case 'Remark14':
      return 'Remark14';
    case 'Remark15':
      return 'Remark15';
    case 'ECDH02':
      return 'ECDH02';
    case 'ECDH03':
      return 'ECDH03';
    case 'Script':
      return 'Script';
    case 'ContractHash':
      return 'ContractHash';
    case 'Vote':
      return 'Vote';
    case 'Hash1':
      return 'Hash1';
    case 'Hash2':
      return 'Hash2';
    case 'Hash3':
      return 'Hash3';
    case 'Hash4':
      return 'Hash4';
    case 'Hash5':
      return 'Hash5';
    case 'Hash6':
      return 'Hash6';
    case 'Hash7':
      return 'Hash7';
    case 'Hash8':
      return 'Hash8';
    case 'Hash9':
      return 'Hash9';
    case 'Hash10':
      return 'Hash10';
    case 'Hash11':
      return 'Hash11';
    case 'Hash12':
      return 'Hash12';
    case 'Hash13':
      return 'Hash13';
    case 'Hash14':
      return 'Hash14';
    case 'Hash15':
      return 'Hash15';
    default:
      throw new InvalidAttributeUsageJSONError(usage);
  }
};

export const toAttributeUsage = (usage: AttributeUsageJSON): AttributeUsage => {
  switch (usage) {
    case 'DescriptionUrl':
      return 0x81;
    case 'Description':
      return 0x90;
    case 'Remark':
      return 0xf0;
    case 'Remark1':
      return 0xf1;
    case 'Remark2':
      return 0xf2;
    case 'Remark3':
      return 0xf3;
    case 'Remark4':
      return 0xf4;
    case 'Remark5':
      return 0xf5;
    case 'Remark6':
      return 0xf6;
    case 'Remark7':
      return 0xf7;
    case 'Remark8':
      return 0xf8;
    case 'Remark9':
      return 0xf9;
    case 'Remark10':
      return 0xfa;
    case 'Remark11':
      return 0xfb;
    case 'Remark12':
      return 0xfc;
    case 'Remark13':
      return 0xfd;
    case 'Remark14':
      return 0xfe;
    case 'Remark15':
      return 0xff;
    case 'ECDH02':
      return 0x02;
    case 'ECDH03':
      return 0x03;
    case 'Script':
      return 0x20;
    case 'ContractHash':
      return 0x00;
    case 'Vote':
      return 0x30;
    case 'Hash1':
      return 0xa1;
    case 'Hash2':
      return 0xa2;
    case 'Hash3':
      return 0xa3;
    case 'Hash4':
      return 0xa4;
    case 'Hash5':
      return 0xa5;
    case 'Hash6':
      return 0xa6;
    case 'Hash7':
      return 0xa7;
    case 'Hash8':
      return 0xa8;
    case 'Hash9':
      return 0xa9;
    case 'Hash10':
      return 0xaa;
    case 'Hash11':
      return 0xab;
    case 'Hash12':
      return 0xac;
    case 'Hash13':
      return 0xad;
    case 'Hash14':
      return 0xae;
    case 'Hash15':
      return 0xaf;
    default:
      throw new InvalidAttributeUsageJSONError(usage);
  }
};
