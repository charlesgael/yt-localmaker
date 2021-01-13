// Initializes the `users` service on path `/users`
import { SequelizeServiceOptions } from 'feathers-sequelize/types';
import { Application } from '../../declarations';
import createModel from '../../models/users.model';
import { Users } from './users.class';
import hooks from './users.hooks';

export default function (app: Application): void {
    const options = <Partial<SequelizeServiceOptions>>{
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    app.use('/users', new Users(options, app));

    // Get our initialized service so that we can register hooks
    const service = app.services.users;

    service.hooks(hooks);

    // Me route to get user
    // app.use('/me', {
    //     find({ user }: { user?: { id: number } }) {
    //         if (user) return app.services.users.get(user.id);
    //         throw new NotAuthenticated(new Error('Not authenticated'));
    //     },
    // });

    // app.services.me.hooks(<HooksObject>{
    //     before: authentication,
    //     after: alterItems((rec) => {
    //         delete rec.dataValues.profiles;
    //         delete rec.dataValues.password;
    //     }),
    // });
}
