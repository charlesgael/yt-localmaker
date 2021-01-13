import { NotAuthenticated } from '@feathersjs/errors';
import { auth } from 'feathers-auth-roles-hooks';
import { setField } from 'feathers-authentication-hooks';
import { HookContext } from '../declarations';
import { computeUserRoles } from '../models/users.model';

export const authentication = auth(
    {
        rolesGetter: async (context: HookContext, userId) => {
            const cacheUser = context.params.user;
            if (
                cacheUser?.roles !== undefined &&
                (typeof cacheUser.roles === 'string' || Array.isArray(cacheUser.roles))
            ) {
                // cache is present
                const roles = computeUserRoles(cacheUser as { roles: string | string[] });
                return roles;
            }

            try {
                const freshUser = await context.app.services.users.find({
                    query: {
                        $limit: 1,
                        id: userId,
                    },
                    authenticated: true,
                    paginate: false,
                });

                if (Array.isArray(freshUser) && freshUser.length) {
                    const roles = (freshUser[0].roles as any) as string[];
                    return roles;
                }
            } catch (e) {}

            throw new NotAuthenticated(new Error(`No user for id #${userId}`));
        },
    },
    'jwt'
);

export const withCurrentUser = (as: string | string[]) => (context: HookContext) =>
    setField({
        from: 'params.user.id',
        as: `params.query.${as}`,
    }).call(context.service, context);
