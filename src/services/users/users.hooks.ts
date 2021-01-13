import { hooks as localHooks } from '@feathersjs/authentication-local';
import { HooksObject } from '@feathersjs/feathers';
import { hasRole, reqRole } from 'feathers-auth-roles-hooks';
import { alterItems, iffElse, unless } from 'feathers-hooks-common';
import { authentication, withCurrentUser } from '../../hooks/authentication';
import { include } from '../../hooks/sequelize';
import { Profile } from '../../models/profiles.model';
import { computeUserRoles, User } from '../../models/users.model';
import Roles, { hooks as RolesHooks } from '../../util/enums/roles.enum';

// Don't remove this comment. It's needed to format import lines nicely.

const { hashPassword, protect } = localHooks;

/** Will prepare roles in request to be valid string with correct separator */
const validateRoles = iffElse(
    hasRole(Roles.UserAssignRole),
    alterItems((data) => {
        data.roles = RolesHooks.validateRoleList(data.roles);
    }),
    alterItems((data) => {
        delete data.roles;
    })
);

const validateProfiles = unless(
    hasRole(Roles.UserAssignProfile),
    alterItems((data) => {
        delete data.profiles;
    })
);

const associations = include('profiles');

export default <HooksObject>{
    before: {
        all: [associations, authentication],
        find: [
            // Prevent from seeing other
            reqRole(Roles.UserDisplay),
        ],
        get: [
            // associations,
            // Prevent from seeing other
            unless(hasRole(Roles.UserDisplay), withCurrentUser('id')),
        ],
        create: [
            hashPassword('password'),
            reqRole(Roles.UserCreate),
            // Validate role requiring parts
            validateRoles,
            validateProfiles,
        ],
        update: [
            hashPassword('password'),
            // Prevent from updating other
            unless(hasRole(Roles.UserUpdate), withCurrentUser('id')),
            // Validate role requiring parts
            validateRoles,
            validateProfiles,
        ],
        patch: [
            hashPassword('password'),
            // Prevent from updating other
            unless(hasRole(Roles.UserUpdate), withCurrentUser('id')),
            // Validate role requiring parts
            validateRoles,
            validateProfiles,
        ],
        remove: [
            // Prevent from deleting other
            unless(hasRole(Roles.UserUpdate), withCurrentUser('id')),
        ],
    },

    after: {
        all: [
            associations,
            // Compute roles from user and profiles
            alterItems((rec) => {
                rec.roles = computeUserRoles(rec);
            }),
            // Remove profiles if user can't see them (pretty print otherwise)
            iffElse(
                hasRole(Roles.ProfileDisplay),
                alterItems((rec: User) =>
                    rec.profiles?.forEach((it: any) => {
                        it.roles = Profile.prototype.getRoles.call(it);
                    })
                ),
                alterItems((rec) => delete rec.profiles)
            ),
            // Make sure the password field is never sent to the client
            // Always must be the last hook
            protect('password'),
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
