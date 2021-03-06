import { Sequelize } from 'sequelize';
import { Application } from '../declarations';
import appGet from '../util/appGet';

const databaseConfig = ():
    | { dialect: 'sqlite'; storage: string }
    | {
          dialect: 'mysql';
          host: string;
          port: number;
          database: string;
          username: string;
          password?: string;
      } => {
    if (process.env.NODE_ENV === 'test')
        return {
            dialect: 'sqlite',
            storage: ':memory:',
        };
    return {
        dialect: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? +process.env.DB_PORT : 3306,
        database: process.env.DB_SCHEMA || 'db',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS,
    };
};

export function setupRelations(app: Application) {
    const models = appGet(app).sequelize.models;
    Object.keys(models).forEach((name) => {
        if ('associate' in models[name]) {
            (models[name] as any).associate(app);
        }
    });
    return models;
}

export default function (app: Application): void {
    const sequelize = new Sequelize({
        logging: false,
        define: {
            freezeTableName: true,
        },
        sync: {
            force: process.env.NODE_ENV === 'development',
        },
        ...databaseConfig(),
    });

    const oldSetup = app.setup;

    app.set('sequelizeClient', sequelize);

    app.setup = function (...args): Application {
        const result = oldSetup.apply(this, args);

        // Set up data relationships
        setupRelations(app);

        // Sync to the database
        app.set(
            'sequelizeSync',
            sequelize.sync({
                force: process.env.NODE_ENV === 'development',
            })
        );

        return result;
    };
}
