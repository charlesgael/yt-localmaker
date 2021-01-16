import { HooksObject } from '@feathersjs/feathers';
import { authentication } from '../../hooks/authentication';

export default <HooksObject>{
    before: {
        all: [authentication],
    },

    after: {},
    error: {},
};
