enum Roles {
    ProfileCreate = 'ProfileCreate',
    ProfileDelete = 'ProfileDelete',
    ProfileDisplay = 'ProfileDisplay',
    ProfileUpdate = 'ProfileUpdate',
    UserAssignProfile = 'UserAssignProfile',
    UserAssignRole = 'UserAssignRole',
    UserCreate = 'UserCreate',
    UserDelete = 'UserDelete',
    UserDisplay = 'UserDisplay',
    UserUpdate = 'UserUpdate',
}

/** Reads validates and formats roles */
function validateRoleList(
    maybeRoles: string | string[] | null | undefined,
    separator = /[,\|.-;:_\n]/
): string | null | undefined {
    if (maybeRoles === null || maybeRoles === undefined) return maybeRoles;

    const rolesValues = Object.values(Roles);
    const validRoles = (typeof maybeRoles === 'string'
        ? maybeRoles.split(separator)
        : maybeRoles
    ).filter((it) => rolesValues.includes(it as Roles)) as Roles[];
    if (validRoles.length) return validRoles.sort().join('\n');
    return null;
}

export const hooks = {
    validateRoleList,
};

export default Roles;
