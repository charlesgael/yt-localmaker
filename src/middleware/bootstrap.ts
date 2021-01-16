import { Application } from '../declarations';
import { Profile } from '../models/profiles.model';
import { Users } from '../services/users/users.class';
import Roles from '../util/enums/roles.enum';
import logger from '../util/logger';

async function execute(app: Application): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;

    const adminProfile = (await app.services.profiles.create(
        {
            name: 'admin',
            roles: Object.values(Roles).join(','),
        },
        { authenticated: true }
    )) as Profile;
    logger.info('Created profile', adminProfile);

    // try {
    const admin = (await app.services.users.create(
        {
            name: 'admin',
            password: 'admin',
            profiles: [adminProfile.id],
        },
        { authenticated: true }
    )) as Users.Result;
    logger.info('Created admin', admin);

    //     logger.info('admin', admin);
    // } catch (e) {}

    // if (admin.id) {
    //     admin.setProfiles([adminProfile.id]);

    //     logger.info('Created admin', admin);
    // } else {
    //     UsersProfiles.create({
    //         UserId: 1,
    //         ProfileId: adminProfile.id,
    //     });
    // }
}

export default function bootstrap(app: Application): void {
    const oldSetup = app.setup;

    app.setup = function (...args): Application {
        const result = oldSetup.apply(this, args);

        app.get('sequelizeSync')
            .then(() => {
                logger.info('<<< Bootstrap');
            })
            .then(() => {
                execute(app).then(() => {
                    logger.info('>>> Bootstrap');
                });
                // .catch((e: any) => {
                //     logger.error('Bt error', e);
                // });
            });

        return result;
    };
}
