import { GeneralError } from '@feathersjs/errors';

import _ from 'lodash';
import { Hook } from '@feathersjs/feathers';
import { hooks as sequelizeHooks } from 'feathers-sequelize';

const { dehydrate } = sequelizeHooks;

export const include = (...entries: any[]): Hook => (context) => {
    if (context.type === 'before') {
        _.set(context.params, 'sequelize', {
            raw: false,
            include: entries,
        });
    } else if (context.type === 'after') {
        dehydrate().call(context.service, context);
    } else {
        throw new GeneralError(new Error('Not supposed to use this hook as error hook'));
    }
};

export const noout: Hook = (context) => {
    context.params.$returning = false;
};
