import { HooksObject } from '@feathersjs/feathers';
import { reqRole } from 'feathers-auth-roles-hooks';
import { alterItems } from 'feathers-hooks-common';
import { authentication } from '../../hooks/authentication';
import { Profile } from '../../models/profiles.model';
import Roles, { hooks as RolesHooks } from '../../util/enums/roles.enum';

/** Will prepare roles in request to be valid string with correct separator */
const validateRoles = alterItems((data) => {
    data.roles = RolesHooks.validateRoleList(data.roles);
});

export default <HooksObject>{
    before: {
        all: [authentication],
        find: [reqRole(Roles.ProfileDisplay)],
        get: [reqRole(Roles.ProfileDisplay)],
        create: [reqRole(Roles.ProfileCreate), validateRoles],
        update: [reqRole(Roles.ProfileUpdate), validateRoles],
        patch: [reqRole(Roles.ProfileUpdate), validateRoles],
        remove: [reqRole(Roles.ProfileDelete)],
    },

    after: {
        all: [
            alterItems((rec) => {
                rec.roles = Profile.prototype.getRoles.call(rec);
            }),
        ],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },

    error: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],
        remove: [],
    },
};
