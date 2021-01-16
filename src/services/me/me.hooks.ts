import { hooks as localHooks } from '@feathersjs/authentication-local';
import { HooksObject } from '@feathersjs/feathers';
import { authentication } from '../../hooks/authentication';

const { protect } = localHooks;

export default <HooksObject>{
    before: {
        all: [authentication],
    },

    after: {},
    error: {},
};
