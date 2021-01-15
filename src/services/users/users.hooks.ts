import { hooks as localHooks } from '@feathersjs/authentication-local';
import { HooksObject } from '@feathersjs/feathers';
import { hasRole, reqRole } from 'feathers-auth-roles-hooks';
import { alterItems, discard, iff, iffElse, isProvider, unless } from 'feathers-hooks-common';
import _ from 'lodash';
import { HookContext } from '../../declarations';
import { authentication, withCurrentUser } from '../../hooks/authentication';
import { include } from '../../hooks/sequelize';
import { Profile } from '../../models/profiles.model';
import { computeUserRoles, User } from '../../models/users.model';
import Roles, { hooks as RolesHooks } from '../../util/enums/roles.enum';
import { ProfileServiceData } from '../profiles/profiles.class';

// Don't remove this comment. It's needed to format import lines nicely.

const { hashPassword, protect } = localHooks;

/** Will prepare roles in request to be valid string with correct separator */
const validateRoles = iffElse(
    hasRole(Roles.UserAssignRole),
    alterItems((data, context) => {
        const value: string | string[] | null | undefined = data.roles;
        data.roles = RolesHooks.validateRoleList(
            value,
            context.params.user !== undefined ? context.params.roles || [] : undefined
        );
    }),
    discard('roles')
);

const validateProfiles = iffElse(
    hasRole(Roles.UserAssignProfile),
    unless(
        isProvider('server'),
        alterItems(async (data, context: HookContext) => {
            const value: string | number[] | null | undefined = data.profiles;
            if (value !== undefined && value !== null) {
                const ids = typeof value === 'string' ? value.split(',').map((it: string) => +it) : value;
                const profiles = (await context.app.services.profiles.find({
                    query: {
                        id: {
                            $in: ids,
                        },
                    },
                    paginate: false,
                    authenticated: true,
                })) as ProfileServiceData[];

                data.profiles = profiles
                    // Remove profiles having more roles than us
                    .filter(
                        (profile) =>
                            _.difference(
                                // Profile role
                                Profile.prototype.getRoles.call(profile),
                                // - Our roles
                                context.params.roles || []
                            ).length === 0
                    )
                    .map((profile) => profile.id);
            }
        })
    ),
    discard('profiles')
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
            discard('id'),
        ],
        update: [
            hashPassword('password'),
            // Prevent from updating other
            unless(hasRole(Roles.UserUpdate), withCurrentUser('id')),
            // Validate role requiring parts
            validateRoles,
            validateProfiles,
            discard('id'),
        ],
        patch: [
            hashPassword('password'),
            // Prevent from updating other
            unless(hasRole(Roles.UserUpdate), withCurrentUser('id')),
            // Validate role requiring parts
            validateRoles,
            validateProfiles,
            discard('id'),
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
