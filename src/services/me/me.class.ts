import { NotAuthenticated } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import UnimplementedService from '../../util/class/UnimplementedService';

export class Me extends UnimplementedService<any> {
    app: Application;

    constructor(app: Application) {
        super();
        this.app = app;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async find({ user }: Params & { user?: { id: number } } = {}) {
        if (user) return this.app.services.users.get(user.id);
        throw new NotAuthenticated(new Error('Not authenticated'));
    }
}
