import { DataTypes } from 'sequelize';
import { Application } from '../declarations';
import appGet from '../util/appGet';
import RoleModel from '../util/class/RoleModel';

interface ProfileAttributes {
    id: number;
    name: string;

    roles?: string;
}

export interface ProfileCreationAttributes extends Omit<ProfileAttributes, 'id'> {}

export class Profile
    extends RoleModel<ProfileAttributes, ProfileCreationAttributes>
    implements ProfileAttributes {
    static ROLES_SEPARATOR = '\n';

    id!: number;
    name!: string;
}

export default function (app: Application) {
    const ag = appGet(app);
    Profile.init(
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
            roles: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        ag.sequelizeConfig('profiles')
    );

    return Profile;
}
