import { DeserializeWireContext } from '@neo-one/client-core';
import { Storage } from '@neo-one/node-core';
import { LevelUp } from 'levelup';

export default function levelUpStorage(options: { db: LevelUp; context: DeserializeWireContext }): Storage;
