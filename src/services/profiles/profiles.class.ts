import { Service, SequelizeServiceOptions } from 'feathers-sequelize';
import { Application } from '../../declarations';
import { Profile } from '../../models/profiles.model';
import { ReplaceMulti, SequelizeServiceModel } from '../../utility';

export interface ProfileServiceData
    extends ReplaceMulti<
        SequelizeServiceModel<Profile>,
        {
            roles?: string | string[] | null;
        }
    > {}
export class Profiles extends Service<ProfileServiceData> {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
        super(options);
    }
}
