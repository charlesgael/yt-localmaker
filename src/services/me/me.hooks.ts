import { HooksObject } from '@feathersjs/feathers';
import { alterItems } from 'feathers-hooks-common';
import { authentication } from '../../hooks/authentication';

export default <HooksObject>{
    before: {
        all: [authentication],
    },

    after: {
        all: [
            alterItems((rec) => {
                delete rec.profiles;
                delete rec.password;
            }),
        ],
    },
    error: {},
};
