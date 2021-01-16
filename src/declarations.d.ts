import { AuthenticationService } from '@feathersjs/authentication/lib';
import { Application as ExpressFeathers } from '@feathersjs/express';
import {
    Application as FApplication,
    HookContext as FHookContext,
    Params,
    Service,
    ServiceAddons as FServiceAddons,
} from '@feathersjs/feathers';
import { Association, FindOrCreateOptions, IncludeOptions, Model, QueryOptions } from 'sequelize';
import { Me } from './services/me/me.class';
import { Profiles } from './services/profiles/profiles.class';
import { Users } from './services/users/users.class';
import Roles from './util/enums/roles.enum';

interface ServiceAddons<T = any> extends FServiceAddons<T> {}

// A mapping of service names to types. Will be extended in service files.
interface ServiceTypes {
    authentication: AuthenticationService & ServiceAddons<any>;
    users: Users & ServiceAddons<Users.Data>;
    profiles: Profiles & ServiceAddons<Users.Data>;
    me: Me & ServiceAddons<any>;
}
// The application instance type that will be used everywhere else
interface Application extends ExpressFeathers<ServiceTypes> {}

interface MyApplication extends FApplication {
    services: ServiceTypes;
}

interface HookContext<T = any, S = Service<T>> extends FHookContext<T, S> {
    readonly app: MyApplication;
    params: Params & {
        roles?: Roles[];
        sequelize?: FindOrCreateOptions;
    };
}

type Hook<T = any, S = Service<T>> = (
    context: HookContext<T, S>
) => Promise<HookContext<T, S> | void> | HookContext<T, S> | void;

type Includeable =
    | (typeof Model & { _attributes: any; _creationAttributes: any })
    | Association
    | IncludeOptions
    | { all: true; nested?: true }
    | string;
