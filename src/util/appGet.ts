import { Sequelize } from 'sequelize';
import app from '../app';
import { Application } from '../declarations';

interface IMapping {
    sequelize: string;
}

interface IMappingTypes {
    sequelize: Sequelize;
}

const mapping: IMapping = {
    sequelize: 'sequelizeClient',
};

class Doers {
    app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    sequelizeConfig(tableName: string) {
        return {
            sequelize: appGet(this.app).sequelize,
            tableName,
        };
    }
}

type IDoers = Omit<Doers, 'app' | 'constructor'>;

const appGet = (app: Application): IMappingTypes & IDoers =>
    (new Proxy<{ app: Application }>(
        {
            app,
        },
        {
            get(target, name: string) {
                if (Object.keys(mapping).includes(name)) {
                    return target.app.get(mapping[name as keyof IMapping]);
                } else if (Doers.prototype[name as keyof IDoers]) {
                    const doers = new Doers(target.app);
                    return doers[name as keyof IDoers].bind(doers);
                } else {
                    return undefined;
                }
            },
        }
    ) as any) as IMappingTypes & IDoers;

export default appGet;
