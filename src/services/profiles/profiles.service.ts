// Initializes the `profils` service on path `/profils`
import { Profiles } from './profiles.class';
import createModel from '../../models/profiles.model';
import hooks from './profiles.hooks';
import { Application } from '../../declarations';

export default function (app: Application): void {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    app.use('/profiles', new Profiles(options, app));

    // Get our initialized service so that we can register hooks
    const service = app.services.profiles;

    service.hooks(hooks);
}
