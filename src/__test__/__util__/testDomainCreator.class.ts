import { Application } from '../../declarations';
import { ProfileServiceData } from '../../services/profiles/profiles.class';
import { UserServiceData } from '../../services/users/users.class';
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

    mkUser(pUser: Partial<UserServiceData> = {}) {
        const user = <UserServiceData>{
            ...pUser,
            name: pUser.name || randomName(),
            password: pUser.password || 'qwerty',
        };

        return this.app.services.users.create(user, { authenticated: true }) as Promise<UserServiceData>;
    }

    mkUsers(...pUsers: Partial<UserServiceData>[]) {
        return Promise.all(pUsers.map((pUser) => this.mkUser(pUser)));
    }

    mkProfile(pProfile: Partial<ProfileServiceData> = {}) {
        const profile: Optional<ProfileServiceData, 'id'> = {
            ...pProfile,
            name: randomName(),
        };

        return this.app.services.profiles.create(profile, {
            authenticated: true,
        }) as Promise<ProfileServiceData>;
    }

    mkProfiles(...pProfiles: Partial<ProfileServiceData>[]) {
        return Promise.all(pProfiles.map((pProfile) => this.mkProfile(pProfile)));
    }
}

export default async function testDomain(app: Application) {
    await initSequelize(app);
    return new TestDomainCreator(app);
}
