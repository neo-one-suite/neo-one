import ts from 'typescript';
import { Context } from '../Context';
import { ContractInfoProcessor } from './ContractInfoProcessor';

export const getContractInfo = (context: Context, smartContract: ts.ClassDeclaration) =>
  new ContractInfoProcessor(context, smartContract).process();
