import Roles from '../../util/enums/roles.enum';

export const internal = { authenticated: true };

export const asUser = (user: number | { id: number }) => ({
    authenticated: true,
    provider: 'rest',
    user: { id: typeof user === 'object' ? user.id : user },
});

export const withRoles = (...roles: Roles[]) => ({
    authenticated: true,
    provider: 'rest',
    user: { id: 1, roles: roles },
});
