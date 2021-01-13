// Initializes the `me` service on path `/me`
import { Application } from '../../declarations';
import { Me } from './me.class';
import hooks from './me.hooks';

export default function (app: Application): void {
    // Initialize our service with any options it requires
    app.use('/me', new Me(app));

    // Get our initialized service so that we can register hooks
    const service = app.services.me;

    service.hooks(hooks);
}
