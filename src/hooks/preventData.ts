import { BadRequest } from '@feathersjs/errors';
import { Hook } from '@feathersjs/feathers';
import dot from 'dot-prop';
import { checkContext } from 'feathers-hooks-common';

export const preventData = (ifThrow: boolean, ...fieldNames: string[]): Hook => (context) => {
    checkContext(context, 'before', ['create', 'patch', 'update'], 'preventData');
    const data = context.data;

    if (context.data) {
        fieldNames.forEach((name) => {
            // data.a.b.c.d
            if (dot.has(context.data, name)) {
                if (ifThrow) {
                    throw new BadRequest(`Field ${name} may not be sent. (preventData)`);
                }
                dot.delete(context.data, name);
            }
            // data['a.b.c.d']
            if (context.data[name]) {
                if (ifThrow) {
                    throw new BadRequest(`Field ${name} may not be sent. (preventData)`);
                }
                delete data[name];
            }
        });
    }
};
