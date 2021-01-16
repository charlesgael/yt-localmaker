import { Application } from '../../declarations';
import { setupRelations } from '../../app/sequelize';
import appGet from '../../util/appGet';

export const initSequelize = async (app: Application) => {
    setupRelations(app);
    await appGet(app).sequelize.sync({
        force: true,
    });
};
