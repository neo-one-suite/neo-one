import { Types } from '../../helper/types/Types';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { ValueFor } from './ValueFor';
import { ValueInstanceOf } from './ValueInstanceOf';

class HeaderInterface extends BuiltinInterface {}
class HeaderConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Header', new HeaderInterface());
  builtins.addContractValue('Header', new ValueInstanceOf((sb) => sb.helpers.isHeader));
  builtins.addContractMember(
    'Header',
    'hash',
    new SysCallInstanceMemberPrimitive('Neo.Header.GetHash', Types.Header, Types.Buffer),
  );
  builtins.addContractMember(
    'Header',
    'version',
    new SysCallInstanceMemberPrimitive('Neo.Header.GetVersion', Types.Header, Types.Number),
  );
  builtins.addContractMember(
    'Header',
    'previousHash',
    new SysCallInstanceMemberPrimitive('Neo.Header.GetPrevHash', Types.Header, Types.Buffer),
  );
  builtins.addContractMember(
    'Header',
    'index',
    new SysCallInstanceMemberPrimitive('Neo.Header.GetIndex', Types.Header, Types.Number),
  );
  builtins.addContractMember(
    'Header',
    'merkleRoot',
    new SysCallInstanceMemberPrimitive('Neo.Header.GetMerkleRoot', Types.Header, Types.Buffer),
  );
  builtins.addContractMember(
    'Header',
    'time',
    new SysCallInstanceMemberPrimitive('Neo.Header.GetTimestamp', Types.Header, Types.Number),
  );
  builtins.addContractMember(
    'Header',
    'nextConsensus',
    new SysCallInstanceMemberPrimitive('Neo.Header.GetNextConsensus', Types.Header, Types.Buffer),
  );

  builtins.addContractInterface('HeaderConstructor', new HeaderConstructorInterface());
  builtins.addContractMember(
    'HeaderConstructor',
    'for',
    new ValueFor('Neo.Blockchain.GetHeader', (sb) => sb.helpers.wrapHeader),
  );
};
