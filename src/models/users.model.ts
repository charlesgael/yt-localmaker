import { concat, flatten, map, pipe, uniq } from 'remeda';
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// And https://sequelize.org/master/manual/typescript.html
// for more of what you can do here.
import {
    Association,
    BelongsToManyAddAssociationMixin,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyHasAssociationMixin,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManySetAssociationsMixin,
    DataTypes,
} from 'sequelize';
import { Application } from '../declarations';
import appGet from '../util/appGet';
import { asArray, defaultSort } from '../util/array';
import RoleModel from '../util/class/RoleModel';
import Roles from '../util/enums/roles.enum';
import { Profile } from './profiles.model';
import users_profiles, { UsersProfiles } from './users_profiles.link';

interface UserAttributes {
    id: number;
    name: string;
    password: string;

    email?: string;
}

interface UserCreationAttributes extends Omit<UserAttributes, 'id'> {}

export class User extends RoleModel<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id!: number;
    name!: string;
    password!: string;

    email?: string;

    getProfiles!: BelongsToManyGetAssociationsMixin<Profile>;
    hasProfile!: BelongsToManyHasAssociationMixin<Profile, number>;
    addProfile!: BelongsToManyAddAssociationMixin<Profile, number>;
    removeProfile!: BelongsToManyRemoveAssociationMixin<Profile, number>;
    setProfiles!: BelongsToManySetAssociationsMixin<Profile, number>;

    profiles?: Profile[];

    static associations: {
        profiles: Association<User, Profile>;
    };

    static associate(app: Application) {
        users_profiles(app);
        User.belongsToMany(Profile, { through: UsersProfiles, as: 'profiles' });
        Profile.belongsToMany(User, { through: UsersProfiles, as: 'users' });
    }
}

export default function (app: Application) {
    const ag = appGet(app);
    User.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(128),
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            roles: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        ag.sequelizeConfig('users')
    );

    return User;
}

type UnsureRole = string | string[] | undefined;

/**
 * Given a User, it uses its custom roles and the linked Profiles' roles to compute
 * a complete list of roles.
 */
export const computeUserRoles = (
    user: {
        roles: UnsureRole;
        profiles?: { roles: UnsureRole } | { roles: UnsureRole }[];
    }
    // profilesOverride?: { roles: string | Roles[] | undefined }[]
): Roles[] => {
    const thisRoles = User.prototype.getRoles.call(user);
    return pipe(
        user.profiles,
        asArray,
        map((it) => Profile.prototype.getRoles.call(it)),
        flatten(),
        concat(thisRoles),
        uniq(),
        defaultSort
    );
};
