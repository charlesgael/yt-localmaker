import { Forbidden } from '@feathersjs/errors';
import { HooksObject } from '@feathersjs/feathers';
import { reqRole } from 'feathers-auth-roles-hooks';
import { alterItems } from 'feathers-hooks-common';
import { Hook } from '../../declarations';
import { authentication } from '../../hooks/authentication';
import { Profile } from '../../models/profiles.model';
import Roles, { hooks as rolesHooks, util as rolesUtil } from '../../util/enums/roles.enum';
import { Profiles } from './profiles.class';

const protectStrongerProfiles: Hook = async (context) => {
    if (context.params.provider && context.id && context.id !== context.params.user?.id) {
        const modifyeeRoles =
            // Get info of profile
            ((await context.app.services.profiles.get(context.id)) as Profiles.Result).roles;
        const editorRoles = context.params.roles || [];

        try {
            // Compare our roles to the profile's ones
            rolesUtil.rolesConsistency(modifyeeRoles || [], editorRoles);
        } catch (e) {
            throw new Forbidden(new Error('Cannot edit profile with more roles than you.'));
        }
    }
};

export default <HooksObject>{
    before: {
        all: [authentication],
        find: [reqRole(Roles.ProfileDisplay)],
        get: [reqRole(Roles.ProfileDisplay)],
        create: [
            reqRole(Roles.ProfileCreate),
            // Validate list and user roles
            rolesHooks.protectRoles,
        ],
        update: [
            reqRole(Roles.ProfileUpdate),
            // Prevent from updating more granted
            protectStrongerProfiles,
            // Validate list and user roles
            rolesHooks.protectRoles,
        ],
        patch: [
            reqRole(Roles.ProfileUpdate),
            // Prevent from updating more granted
            protectStrongerProfiles,
            // Validate list and user roles
            rolesHooks.protectRoles,
        ],
        remove: [
            reqRole(Roles.ProfileDelete),
            // Prevent from updating more granted
            protectStrongerProfiles,
        ],
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
