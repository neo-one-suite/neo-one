import { CreateCRUD, GetCLIAutocompleteOptions, GetCLIResourceOptions } from '@neo-one/server-plugin';
import { NEOTracker, NEOTrackerResourceOptions, NEOTrackerResourceType } from '../NEOTrackerResourceType';
import { common } from './common';

export class CreateNEOTrackerCRUD extends CreateCRUD<NEOTracker, NEOTrackerResourceOptions> {
  public constructor({ resourceType }: { readonly resourceType: NEOTrackerResourceType }) {
    super({
      resourceType,
      options: common.options,
      startOnCreate: true,
    });
  }

  public async getCLIAutocompleteResourceOptions({
    cli,
  }: GetCLIAutocompleteOptions): Promise<NEOTrackerResourceOptions> {
    return common.getCLIResourceOptions({ cli, args: {}, options: {} });
  }

  public async getCLIResourceOptions(options: GetCLIResourceOptions): Promise<NEOTrackerResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
