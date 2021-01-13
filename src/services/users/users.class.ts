import { SequelizeServiceOptions } from 'feathers-sequelize';
import { Op } from 'sequelize';
import { Application } from '../../declarations';
import { Profile } from '../../models/profiles.model';
import { User } from '../../models/users.model';
import { UsersProfiles } from '../../models/users_profiles.link';
import SequelizeParamCRUDService from '../../util/class/SequelizeParamCRUDService';
import { ReplaceMulti, SequelizeServiceModel } from '../../util/utilityTypes';

export type UserServiceData = ReplaceMulti<
    SequelizeServiceModel<User>,
    {
        profiles?: number[] | string | null;
        roles?: string | string[] | null;
    }
>;

export class Users extends SequelizeParamCRUDService<UserServiceData> {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
        super(options);
    }

    async onDataWithProfiles(value: UserServiceData['profiles'], data: UserServiceData) {
        const unsafeIds = typeof value === 'string' ? value.split(',').map((it) => +it) : value || [];

        const profiles = await Profile.findAll({
            where: {
                id: {
                    [Op.in]: unsafeIds,
                },
            },
        });
        const ids = profiles.map((it) => it.id);

        const existing = (
            await UsersProfiles.findAll({
                where: {
                    UserId: data.id,
                },
            })
        ).map((it) => it.ProfileId);

        await Promise.all([
            // To remove
            UsersProfiles.destroy({
                where: {
                    UserId: data.id,
                    ProfileId: {
                        [Op.notIn]: ids,
                    },
                },
            }),

            // To create
            UsersProfiles.bulkCreate(
                ids
                    .filter((id) => !existing.includes(id))
                    .map((ProfileId) => ({ UserId: data.id, ProfileId }))
            ),
        ]);

        // Raw model
        return profiles.map((it: any) => it.dataValues as unknown);
    }

    // async onProfilesUpdate(item: Data, value: Data['profiles']) {
    // }
}
