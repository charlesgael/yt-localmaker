import { AuthenticationService } from '@feathersjs/authentication/lib';
import {
    Application as FApplication,
    HookContext as FHookContext,
    ServiceAddons as FServiceAddons,
} from '@feathersjs/feathers';
import { Application as ExpressFeathers } from '@feathersjs/express';
import { Profile } from './models/profiles.model';
import { User } from './models/users.model';
import { Me } from './services/me/me.class';
import { Profiles } from './services/profiles/profiles.class';
import { Users } from './services/users/users.class';

interface ServiceAddons<T = any> extends FServiceAddons<T> {}

// A mapping of service names to types. Will be extended in service files.
interface ServiceTypes {
    authentication: AuthenticationService & ServiceAddons<any>;
    users: Users & ServiceAddons<User>;
    profiles: Profiles & ServiceAddons<Profile>;
    me: Me & ServiceAddons<any>;
}
// The application instance type that will be used everywhere else
interface Application extends ExpressFeathers<ServiceTypes> {}

interface MyApplication extends FApplication {
    services: ServiceTypes;
}

interface HookContext<T = any> extends FHookContext<T> {
    readonly app: MyApplication;
}
