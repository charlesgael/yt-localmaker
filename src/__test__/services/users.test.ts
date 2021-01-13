import app from '../../app';
import Roles from '../../util/enums/roles.enum';
import { asUser, internal } from '../__util__/authentication';
import testDomain, { TestDomainCreator } from '../__util__/testDomainCreator.class';

const service = app.service('users');

const allRoles: string[] = Object.values(Roles);

describe('services.users', () => {
    it('registered the service', () => {
        expect(service).toBeTruthy();
    });

    describe('service testing', () => {
        let tdc: TestDomainCreator;
        let admin: any, moderator: any, user: any;
        let profile1: any, profile2: any;

        beforeAll(async () => {
            tdc = await testDomain(app);

            [admin, moderator, user] = await tdc.mkUsers(
                {
                    roles: allRoles,
                },
                {
                    roles: [Roles.UserCreate, Roles.UserUpdate, Roles.UserDisplay].join('\n'),
                },
                {}
            );

            [profile1, profile2] = await tdc.mkProfiles(
                {
                    roles: Roles.UserDisplay,
                },
                {
                    roles: Roles.UserUpdate,
                }
            );
        });

        describe('find method', () => {
            it('shows the list of user to the user with UserDisplay role', async () => {
                const list = await service.find(asUser(admin));

                expect(list).toBeTruthy();
                if (Array.isArray(list)) return fail(); // Paginated
                expect(list.total).toBe(3);
            });

            it('hides the list from the user without UserDisplay role', async () => {
                try {
                    await service.find(asUser(user));
                    fail();
                } catch (e) {}
            });
        });

        describe('get method', () => {
            it('shows whatever user to the user with UserDisplay role', async () => {
                const show1 = await service.get(admin.id, asUser(admin));
                const show2 = await service.get(user.id, asUser(admin));

                expect(show1).toBeTruthy();
                expect(show2).toBeTruthy();
            });

            it('hides other users from the user without UserDisplay role', async () => {
                const show2 = await service.get(user.id, asUser(user));

                expect(show2).toBeTruthy();

                try {
                    await service.get(admin.id, asUser(user));
                    fail();
                } catch (e) {}
            });
        });

        describe('create method', () => {
            it('creates a user if the user has the UserCreate role', async () => {
                const res = await service.create(
                    {
                        name: 'user2',
                        password: 'user2',
                    },
                    asUser(admin)
                );

                expect(res).toBeTruthy();
            });

            it('cannot create otherwise', async () => {
                try {
                    await service.create(
                        {
                            name: 'user2',
                            password: 'user2',
                        },
                        asUser(user)
                    );
                } catch (error) {}
            });
        });

        describe('update methods', () => {
            it('updates self without needing role', async () => {
                const oldAdminName = admin.name;
                await service.patch(admin.id, { name: 'admin' }, asUser(admin));
                admin = await service.get(admin.id, internal);
                expect(admin).toBeTruthy();
                expect(admin.name).not.toBe(oldAdminName);

                const oldUserName = user.name;
                await service.patch(user.id, { name: 'user' }, asUser(user));
                user = await service.get(user.id, internal);
                expect(user).toBeTruthy();
                expect(user.name).not.toBe(oldUserName);
            });

            it('updates any user if the user has the UserUpdate role', async () => {
                const oldModeratorName = moderator.name;
                try {
                    await service.patch(moderator.id, { name: 'moderator' }, asUser(user));
                    fail();
                } catch (error) {}

                await service.patch(moderator.id, { name: 'moderator' }, asUser(admin));
                moderator = await service.get(moderator.id, internal);
                expect(moderator).toBeTruthy();
                expect(moderator.name).not.toBe(oldModeratorName);
            });
        });

        describe('changing roles', () => {
            const newRoles = [Roles.UserDisplay, Roles.UserAssignRole];
            let tmpUser: any;

            beforeEach(async () => {
                tmpUser = await tdc.mkUser();
            });

            it('changes the roles if the user has the UserAssignRole role', async () => {
                await service.patch(
                    tmpUser.id,
                    {
                        roles: newRoles.join(','),
                    },
                    asUser(admin)
                );
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual(newRoles.sort());
            });

            it('changes the roles if the user gives all invalid roles', async () => {
                await service.patch(
                    tmpUser.id,
                    {
                        roles: ['this', 'role', 'does', 'not', 'exist'],
                    },
                    asUser(admin)
                );
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([]);
            });

            it('fails otherwise', async () => {
                await service.patch(
                    tmpUser.id,
                    {
                        roles: newRoles,
                    },
                    asUser(moderator)
                );
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([]);
            });
        });

        describe('creating with profiles', () => {
            it('creates a user with said profiles id the user has the UserAssignProfile role', async () => {
                await service.create(
                    {
                        name: 'testCreateWithProfile1',
                        password: 'test',
                        profiles: [profile1.id, profile2.id].join(','),
                    },
                    asUser(admin)
                );
            });
        });

        describe('changing profiles', () => {
            let tmpUser: any;

            beforeEach(async () => {
                tmpUser = await tdc.mkUser();
            });

            it('changes the profiles if the user has the UserAssignProfile role', async () => {
                await service.patch(tmpUser.id, { profiles: [profile1.id] }, asUser(admin));
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([Roles.UserDisplay]);

                await service.patch(tmpUser.id, { profiles: [profile1.id, profile2.id] }, asUser(admin));
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([Roles.UserDisplay, Roles.UserUpdate]);
                expect(tmpUser.profiles.map((it: any) => it.id as number)).toStrictEqual([
                    profile1.id,
                    profile2.id,
                ]);

                await service.patch(tmpUser.id, { profiles: null }, asUser(admin));
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([]);
                expect(tmpUser.profiles.map((it: any) => it.id as number)).toStrictEqual([]);

                await service.update(
                    tmpUser.id,
                    {
                        id: tmpUser.id,
                        name: 'testUpdate',
                        password: 'pw',
                        profiles: [profile1.id],
                    },
                    asUser(admin)
                );
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([Roles.UserDisplay]);
                expect(tmpUser.profiles.map((it: any) => it.id as number)).toStrictEqual([profile1.id]);
            });
        });
    });
});
