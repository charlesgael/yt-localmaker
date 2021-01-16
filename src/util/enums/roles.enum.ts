import { Forbidden } from '@feathersjs/errors';
import { hasRole } from 'feathers-auth-roles-hooks';
import { alterItems, iffElse } from 'feathers-hooks-common';
import { HookContext } from '../../declarations';
import { preventData } from '../../hooks/preventData';

enum Roles {
    AssignProfile = 'AssignProfile',
    AssignRole = 'AssignRole',
    ProfileCreate = 'ProfileCreate',
    ProfileDelete = 'ProfileDelete',
    ProfileDisplay = 'ProfileDisplay',
    ProfileUpdate = 'ProfileUpdate',
    UserCreate = 'UserCreate',
    UserDelete = 'UserDelete',
    UserDisplay = 'UserDisplay',
    UserUpdate = 'UserUpdate',
}

/** Reads validates and formats roles */
function validateRoleList(
    maybeRoles: string | string[] | null | undefined,
    separator = /[,\|.-;:_\n]/
): Roles[] | null | undefined {
    if (maybeRoles === null || maybeRoles === undefined) return maybeRoles;

    const rolesValues = Object.values(Roles);
    const validRoles =
        // If roles is a string, we separate it to convert it to an array of roles
        (typeof maybeRoles === 'string' ? maybeRoles.split(separator) : maybeRoles)
            // Then we remove roles that doesn't exist
            .filter((it) =>
                // The role exists
                rolesValues.includes(it as Roles)
            ) as Roles[];
    if (validRoles.length) return validRoles.sort();
    return null;
}

/** Check we don't give more roles than we have */
function rolesConsistency(givenRoles: Roles[], userRoles: Roles[]) {
    if (!givenRoles.every((role) => userRoles.includes(role))) {
        throw new Forbidden(new Error('Roles consistency. (u.roles)'));
    }
}

export const util = {
    validateRoleList,
    rolesConsistency,
};

/** Will prepare roles in request to be valid string with correct separator */
const protectRoles = iffElse(
    hasRole(Roles.AssignRole),
    alterItems((data, context: HookContext) => {
        const value: string | string[] | null | undefined = data.roles;

        const roles = validateRoleList(value);

        if (context.params.provider !== undefined && roles)
            rolesConsistency(roles, context.params.roles || []);

        if (roles === null) data.roles = null;
        else data.roles = roles?.join('\n');
    }),
    preventData(true, 'roles')
);

export const hooks = {
    protectRoles,
};

export default Roles;
