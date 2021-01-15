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
    definerRoles?: string[],
    separator = /[,\|.-;:_\n]/
): string | null | undefined {
    if (maybeRoles === null || maybeRoles === undefined) return maybeRoles;

    const rolesValues = Object.values(Roles);
    const validRoles =
        // If roles is a string, we separate it to convert it to an array of roles
        (typeof maybeRoles === 'string' ? maybeRoles.split(separator) : maybeRoles)
            // Then we remove roles that doesn't exist or that definer doesn't have
            .filter(
                (it) =>
                    // The role exists
                    rolesValues.includes(it as Roles) &&
                    // Definer has the role if any
                    (!definerRoles || definerRoles.includes(it))
            ) as Roles[];
    if (validRoles.length) return validRoles.sort().join('\n');
    return null;
}

export const hooks = {
    validateRoleList,
};

export default Roles;
