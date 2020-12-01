import { Sequelize } from 'sequelize';
import { Application } from './declarations';

export default function (app: Application): void {
    const sequelize = new Sequelize({
        dialect: 'mysql',
        logging: false,
        define: {
            freezeTableName: true,
        },
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? +process.env.DB_PORT : 3306,
        database: process.env.DB_BASE,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
    });
    const oldSetup = app.setup;

    app.set('sequelizeClient', sequelize);

    app.setup = function (...args): Application {
        const result = oldSetup.apply(this, args);

        // Set up data relationships
        const models = sequelize.models;
        Object.keys(models).forEach((name) => {
            if ('associate' in models[name]) {
                (models[name] as any).associate(models);
            }
        });

        // Sync to the database
        app.set('sequelizeSync', sequelize.sync());

        return result;
    };
}
