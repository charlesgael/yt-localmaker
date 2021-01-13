import { HasOneGetAssociationMixin, Model } from 'sequelize';
import { Application } from '../declarations';
import appGet from '../util/appGet';
import { Profile } from './profiles.model';
import { User } from './users.model';

export class UsersProfiles extends Model {
    UserId!: number;
    ProfileId!: number;

    getUser!: HasOneGetAssociationMixin<User>;
    getProfile!: HasOneGetAssociationMixin<Profile>;
}

export default function (app: Application) {
    const ag = appGet(app);
    UsersProfiles.init({}, ag.sequelizeConfig('users_profiles', { timestamps: false }));
    return UsersProfiles;
}
