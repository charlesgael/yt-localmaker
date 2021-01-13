export const internal = { authenticated: true };

export const asUser = (user: number | { id: number }) => ({
    authenticated: true,
    provider: 'rest',
    user: { id: typeof user === 'object' ? user.id : user },
});
