import { hooks as localHooks } from '@feathersjs/authentication-local';
import { Forbidden } from '@feathersjs/errors';
import { HooksObject } from '@feathersjs/feathers';
import { hasRole, reqRole } from 'feathers-auth-roles-hooks';
import { alterItems, discard, iffElse, isProvider, unless } from 'feathers-hooks-common';
import { flatten, map, pipe } from 'remeda';
import { Hook, HookContext } from '../../declarations';
import { authentication, withCurrentUser } from '../../hooks/authentication';
import { preventData } from '../../hooks/preventData';
import { include } from '../../hooks/sequelize';
import { Profile } from '../../models/profiles.model';
import { computeUserRoles } from '../../models/users.model';
import Roles, { hooks as rolesHooks, util as rolesUtil } from '../../util/enums/roles.enum';
import { Profiles } from '../profiles/profiles.class';
import { Users } from './users.class';

// Don't remove this comment. It's needed to format import lines nicely.

const { hashPassword, protect } = localHooks;

const protectStrongerUser: Hook = async (context) => {
    if (context.params.provider && context.id && context.id !== context.params.user?.id) {
        const modifyeeRoles = ((await context.app.services.users.get(context.id, {
            authenticated: true,
        })) as Users.Result).roles;
        const editorRoles = context.params.roles || [];

        try {
            rolesUtil.rolesConsistency(modifyeeRoles, editorRoles);
        } catch (e) {
            throw new Forbidden(new Error('Cannot edit user with more roles than you. (s.users)'));
        }
    }
};

const validateProfiles = iffElse(
    hasRole(Roles.AssignProfile),
    unless(
        isProvider('server'),
        alterItems(async (data: Users.Data, context: HookContext) => {
            if (data.profiles !== undefined && data.profiles !== null) {
                // Input validation and get roles
                const ids =
                    typeof data.profiles === 'string'
                        ? data.profiles.split(',').map((it: string) => +it)
                        : data.profiles;
                const profiles = (await context.app.services.profiles.find({
                    query: {
                        id: {
                            $in: ids,
                        },
                    },
                    paginate: false,
                    authenticated: true,
                })) as Profiles.Result[];

                rolesUtil.rolesConsistency(
                    pipe(
                        profiles,
                        map((it) => it.roles),
                        flatten()
                    ),
                    context.params.roles || []
                );
            }
        })
    ),
    preventData(true, 'profiles')
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
            // Prevent from seeing other
            unless(hasRole(Roles.UserDisplay), withCurrentUser('id')),
        ],
        create: [
            hashPassword('password'),
            reqRole(Roles.UserCreate),
            // Validate role requiring parts
            rolesHooks.protectRoles,
            validateProfiles,
            discard('id'),
        ],
        update: [
            hashPassword('password'),
            // Prevent from updating other
            unless(hasRole(Roles.UserUpdate), withCurrentUser('id')),
            // Prevent from updating more granted
            protectStrongerUser,
            // Validate role requiring parts
            rolesHooks.protectRoles,
            validateProfiles,
            discard('id'),
        ],
        patch: [
            hashPassword('password'),
            // Prevent from updating other
            unless(hasRole(Roles.UserUpdate), withCurrentUser('id')),
            // Prevent from updating more granted
            protectStrongerUser,
            // Validate role requiring parts
            rolesHooks.protectRoles,
            validateProfiles,
            discard('id'),
        ],
        remove: [
            // Prevent from deleting other
            unless(hasRole(Roles.UserUpdate), withCurrentUser('id')),
            // Prevent from deleting more granted
            protectStrongerUser,
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
                alterItems((rec: Users.Result) =>
                    rec.profiles?.forEach((it) => {
                        it.roles = Profile.prototype.getRoles.call(it);
                    })
                ),
                protect('profiles')
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
