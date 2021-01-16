import { Application } from '../../declarations';
import { Profiles } from '../../services/profiles/profiles.class';
import { Users } from '../../services/users/users.class';
import randomName from './names';
import { initSequelize } from './sequelize';

type Optional<Type extends { [K: string]: any }, MadeOptional extends string = ''> = Omit<
    Type,
    MadeOptional
> &
    Partial<Pick<Type, MadeOptional>>;

export class TestDomainCreator {
    app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    mkUser(pUser: Partial<Users.Data> = {}) {
        const user = <Users.Data>{
            ...pUser,
            name: pUser.name || randomName(),
            password: pUser.password || 'qwerty',
        };

        return (this.app.services.users.create(user, {
            authenticated: true,
        }) as any) as Promise<Users.Result>;
    }

    mkUsers(...pUsers: Partial<Users.Data>[]) {
        return Promise.all(pUsers.map((pUser) => this.mkUser(pUser)));
    }

    mkProfile(pProfile: Partial<Profiles.Data> = {}) {
        const profile: Optional<Profiles.Data, 'id'> = {
            ...pProfile,
            name: pProfile.name || randomName(),
        };

        return (this.app.services.profiles.create(profile, {
            authenticated: true,
        }) as any) as Promise<Profiles.Result>;
    }

    mkProfiles(...pProfiles: Partial<Profiles.Data>[]) {
        return Promise.all(pProfiles.map((pProfile) => this.mkProfile(pProfile)));
    }
}

export default async function testDomain(app: Application) {
    await initSequelize(app);
    return new TestDomainCreator(app);
}
