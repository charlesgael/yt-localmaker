import Roles, { hooks as rolesHooks } from '../enums/roles.enum';
import Model from './Model';

/* eslint-disable @typescript-eslint/ban-types */
export default abstract class RoleModel<
    TModelAttributes extends {} = any,
    TCreationAttributes extends {} = TModelAttributes
> extends Model<TModelAttributes, TCreationAttributes> {
    static ROLES_SEPARATOR = '\n';

    roles?: string;

    getRoles(this: { roles?: string | string[] | null }): Roles[] {
        const roles = (typeof this.roles === 'string'
            ? this.roles.split(RoleModel.ROLES_SEPARATOR)
            : this.roles
        )?.sort();
        return (roles || []) as Roles[];
    }

    setRoles(newRoles: string | string[]): void {
        this.roles = rolesHooks.validateRoleList(newRoles) || undefined;
    }
}
