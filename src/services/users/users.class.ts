import { SequelizeServiceOptions } from 'feathers-sequelize';
import _ from 'lodash';
import { Op } from 'sequelize';
import { Application } from '../../declarations';
import { Profile } from '../../models/profiles.model';
import { User } from '../../models/users.model';
import { UsersProfiles } from '../../models/users_profiles.link';
import SequelizeParamCRUDService from '../../util/class/SequelizeParamCRUDService';
import { ReplaceMulti, SequelizeServiceModel } from '../../utility';

export interface UserServiceData
    extends ReplaceMulti<
        SequelizeServiceModel<User>,
        {
            profiles?: number[] | string | null;
            roles?: string | string[] | null;
        }
    > {}

export class Users extends SequelizeParamCRUDService<UserServiceData>() {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
        super(options);
    }

    async onDataWithProfiles(value: UserServiceData['profiles'], data: UserServiceData) {
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

        const validProfileIds = _.map(validProfiles, 'id');
        const myProfileIds = _.map(myProfiles, 'ProfileId');

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
                // Only select non existing entries
                _.difference(validProfileIds, myProfileIds)
                    // into data for UserProfiles
                    .map((ProfileId) => ({
                        UserId: data.id,
                        ProfileId,
                    }))
            ),
        ]);

        // Raw model
        return validProfiles.map((it) => it.toJSON());
    }
}
