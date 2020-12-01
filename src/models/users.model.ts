// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.

import { DataTypes, Model, Sequelize } from 'sequelize';
import { Application } from '../declarations';
import appGet from '../util/appGet';

// import { Sequelize, DataTypes, Model } from 'sequelize';
// import { Application } from '../declarations';
// import { HookReturn } from 'sequelize/types/lib/hooks';

// export default function (app: Application): typeof Model {
//     const sequelizeClient: Sequelize = app.get('sequelizeClient');
//     const users = sequelizeClient.define(
//         'users',
//         {
//             email: {
//                 type: DataTypes.STRING,
//                 allowNull: false,
//                 unique: true,
//             },
//             password: {
//                 type: DataTypes.STRING,
//                 allowNull: false,
//             },
//         },
//         {
//             hooks: {
//                 beforeCount(options: any): HookReturn {
//                     options.raw = true;
//                 },
//             },
//         }
//     );

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     (users as any).associate = function (models: any): void {
//         // Define associations here
//         // See http://docs.sequelizejs.com/en/latest/docs/associations/
//     };

//     return users;
// }

export class User extends Model {
    public id!: number;
    public name!: string;
    public password!: string;

    public email?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export default function (app: Application) {
    const ag = appGet(app);
    User.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
        },
        ag.sequelizeConfig('users')
    );

    return User;
}
