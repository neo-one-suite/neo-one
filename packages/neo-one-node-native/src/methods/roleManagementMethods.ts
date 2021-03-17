import { ContractMethodJSON } from './contractMethodFromJSON';

export const roleManagementMethods: ReadonlyArray<ContractMethodJSON> = [
  {
    name: 'designateAsRole',
    parameters: [
      {
        name: 'role',
        type: 'Integer',
      },
      {
        name: 'nodes',
        type: 'Array',
      },
    ],
    returntype: 'Void',
    offset: 0,
    safe: false,
  },
  {
    name: 'getDesignatedByRole',
    parameters: [
      {
        name: 'role',
        type: 'Integer',
      },
      {
        name: 'index',
        type: 'Integer',
      },
    ],
    returntype: 'Array',
    offset: 0,
    safe: true,
  },
];
