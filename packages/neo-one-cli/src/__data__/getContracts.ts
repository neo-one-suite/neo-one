import { Client, Contract } from '@neo-one/client-full';

export const getContracts = async (client: Client, networkName: string): Promise<readonly Contract[]> => {
  const readClient = client.read(networkName);
  const currentIndex = await readClient.getBlockCount();

  const mutableContracts: Contract[] = [];
  // tslint:disable-next-line no-loop-statement
  for await (const block of readClient.iterBlocks({ indexStart: 0, indexStop: currentIndex })) {
    // tslint:disable-next-line no-loop-statement
    for (const transaction of block.transactions) {
      if (transaction.type === 'InvocationTransaction' && transaction.invocationData.contracts.length > 0) {
        mutableContracts.push(...transaction.invocationData.contracts);
      }
    }
  }

  return mutableContracts;
};
