import { GeneralError } from '@feathersjs/errors';
import { hooks as sequelizeHooks } from 'feathers-sequelize';
import { Hook } from '../declarations';

const { dehydrate } = sequelizeHooks;

export const include = (...entries: any[]): Hook => (context) => {
    if (context.type === 'before') {
        if (!context.params.sequelize) context.params.sequelize = {};
        context.params.sequelize.raw = false;
        context.params.sequelize.include = entries;
    } else if (context.type === 'after') {
        dehydrate().call(context.service, context);
    } else {
        throw new GeneralError(new Error('Not supposed to use this hook as error hook'));
    }
};

export const noout: Hook = (context) => {
    context.params.$returning = false;
};
