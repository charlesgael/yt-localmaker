import { NotAuthenticated } from '@feathersjs/errors';
import { auth } from 'feathers-auth-roles-hooks';
import { setField } from 'feathers-authentication-hooks';
import { HookContext } from '../declarations';
import { computeUserRoles } from '../models/users.model';
import logger from '../util/logger';

export const authentication = auth(
    {
        rolesGetter: async (context) => {
            const userObj = context.params.user;
            if (!userObj.id) {
                logger.error('No user decoded from token');
                throw new NotAuthenticated(new Error('No user decoded from token'));
            }

            if (
                userObj.roles !== undefined &&
                (typeof userObj.roles === 'string' || Array.isArray(userObj.roles))
            ) {
                // cache is present
                const roles = computeUserRoles(userObj as { roles: string | string[] });
                return roles;
            }

            try {
                const freshUser = await context.app.services.users.find({
                    query: {
                        $limit: 1,
                        id: userObj.id,
                    },
                    authenticated: true,
                    paginate: false,
                });

                if (Array.isArray(freshUser) && freshUser.length) {
                    const roles = (freshUser[0].roles as any) as string[];
                    return roles;
                }
            } catch (e) {}

            throw new NotAuthenticated(new Error(`No user for id #${userObj.id}`));
        },
    },
    'jwt'
);

export const withCurrentUser = (as: string | string[]) => (context: HookContext) =>
    setField({
        from: 'params.user.id',
        as: `params.query.${as}`,
    }).call(context.service, context);
