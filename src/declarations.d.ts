import { AuthenticationService } from '@feathersjs/authentication/lib';
import { Application as ExpressFeathers } from '@feathersjs/express';
import {
    Application as FApplication,
    HookContext as FHookContext,
    Params,
    ServiceAddons as FServiceAddons,
} from '@feathersjs/feathers';
import { Me } from './services/me/me.class';
import { Profiles, ProfileServiceData } from './services/profiles/profiles.class';
import { Users, UserServiceData } from './services/users/users.class';
import Roles from './util/enums/roles.enum';

interface ServiceAddons<T = any> extends FServiceAddons<T> {}

// A mapping of service names to types. Will be extended in service files.
interface ServiceTypes {
    authentication: AuthenticationService & ServiceAddons<any>;
    users: Users & ServiceAddons<UserServiceData>;
    profiles: Profiles & ServiceAddons<ProfileServiceData>;
    me: Me & ServiceAddons<any>;
}
// The application instance type that will be used everywhere else
interface Application extends ExpressFeathers<ServiceTypes> {}

interface MyApplication extends FApplication {
    services: ServiceTypes;
}

interface HookContext<T = any> extends FHookContext<T> {
    readonly app: MyApplication;
    params: Params & {
        roles?: Roles[];
    };
}
