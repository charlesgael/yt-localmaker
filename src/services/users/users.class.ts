import { SequelizeServiceOptions } from 'feathers-sequelize';

import { pipe, difference, map } from 'remeda';
import { Op } from 'sequelize';
import { Application } from '../../declarations';
import { Profile } from '../../models/profiles.model';
import { User } from '../../models/users.model';
import { UsersProfiles } from '../../models/users_profiles.link';
import SequelizeParamCRUDService from '../../util/class/SequelizeParamCRUDService';
import Roles from '../../util/enums/roles.enum';
import { ReplaceMulti, SequelizeServiceModel } from '../../utility';
import { Profiles } from '../profiles/profiles.class';

export class Users extends SequelizeParamCRUDService<Users.Data>() {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
        super(options);
    }

    async onDataWithProfiles(value: Users.Data['profiles'], data: Users.Data) {
        const unsafeIds = typeof value === 'string' ? value.split(',').map((it) => +it) : value || [];

        const [validProfiles, myProfiles] = await Promise.all([
            Profile.findAll({
                where: {
                    id: {
                        [Op.in]: unsafeIds,
                    },
                },
            }),
            UsersProfiles.findAll({
                where: {
                    UserId: data.id,
                },
            }),
        ]);

        const validProfileIds = validProfiles.map((it) => it.id);
        const myProfileIds = myProfiles.map((it) => it.ProfileId);

        await Promise.all([
            // To remove
            UsersProfiles.destroy({
                where: {
                    UserId: data.id,
                    ProfileId: {
                        [Op.notIn]: validProfileIds,
                    },
                },
            }),

            // To create
            UsersProfiles.bulkCreate(
                pipe(
                    validProfileIds,
                    // Only select non existing entries
                    difference(myProfileIds),
                    // into data for UserProfiles
                    map((ProfileId) => ({
                        UserId: data.id,
                        ProfileId,
                    }))
                )
            ),
        ]);

        // Raw model
        return validProfiles.map((it) => it.toJSON());
    }
}

export namespace Users {
    export interface Data
        extends ReplaceMulti<
            SequelizeServiceModel<User>,
            {
                profiles?: number[] | string | null;
                roles?: string | string[] | null;
            }
        > {}

    export interface Result
        extends ReplaceMulti<
            Data,
            {
                profiles?: Profiles.Result[];
                roles: Roles[];
            }
        > {}
}
