import { SequelizeServiceOptions, Service } from 'feathers-sequelize';
import { Application } from '../../declarations';
import { Profile } from '../../models/profiles.model';
import Roles from '../../util/enums/roles.enum';
import { ReplaceMulti, SequelizeServiceModel } from '../../utility';

export class Profiles extends Service<Profiles.Data> {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
        super(options);
    }
}

export namespace Profiles {
    export interface Data
        extends ReplaceMulti<
            SequelizeServiceModel<Profile>,
            {
                roles?: string | string[] | null;
            }
        > {}

    export interface Result
        extends ReplaceMulti<
            Data,
            {
                roles?: Roles[];
            }
        > {}
}
