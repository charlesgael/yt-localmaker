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
    async find(params: Params & { user?: { id?: number } } = {}) {
        if (params.user && params.user.id) return this.app.services.users.get(params.user.id, params);
        throw new NotAuthenticated(new Error('Not authenticated'));
    }
}
