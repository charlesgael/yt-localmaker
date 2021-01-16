import app from '../../app';
import { Users } from '../../services/users/users.class';
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
        let profile1: any, profile2: any, profileAdmin: any;

        beforeAll(async () => {
            tdc = await testDomain(app);

            [admin, moderator, user] = await tdc.mkUsers(
                {
                    // Using array of strings
                    roles: allRoles,
                },
                {
                    roles: [
                        Roles.UserCreate,
                        Roles.UserUpdate,
                        Roles.UserDisplay,
                        Roles.AssignRole,
                        Roles.AssignProfile,
                    ]
                        // Using string with separator
                        .join('\n'),
                },
                {}
            );

            [profile1, profile2, profileAdmin] = await tdc.mkProfiles(
                {
                    roles: Roles.UserDisplay,
                },
                {
                    roles: Roles.UserUpdate,
                },
                {
                    roles: allRoles.join(','),
                }
            );
        });

        describe('find method', () => {
            it('shows the list of user to the user with UserDisplay role', async () => {
                const list = await service.find(asUser(admin));

                expect(list).toBeTruthy();
                if (Array.isArray(list)) return fail('Service response was not paginated'); // Paginated
                expect(list.total).toBeGreaterThanOrEqual(3);
            });

            it('hides the list from the user without UserDisplay role', async () => {
                try {
                    await service.find(asUser(user));
                    fail('Service could be called without UserDisplay role');
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
                    fail('Service could be called without UserDisplay role');
                } catch (e) {}
            });

            it('is able to login with cache (aka return from find)', async () => {
                const show1 = await service.get(admin.id, {
                    authenticated: true,
                    provider: 'rest',
                    user: {
                        ...admin,
                        roles: admin.roles.join('\n'),
                    },
                });

                expect(show1).toBeTruthy();

                const show2 = await service.get(admin.id, {
                    authenticated: true,
                    provider: 'rest',
                    user: admin,
                });

                expect(show2).toBeTruthy();

                try {
                    const show3 = await service.get(admin.id, {
                        authenticated: true,
                        provider: 'rest',
                        user: (null as any) as undefined,
                    });
                    fail('No user got through');
                } catch (e) {}

                try {
                    const show3 = await service.get(admin.id, {
                        authenticated: true,
                        provider: 'rest',
                        user: {},
                    });
                    fail('Fake user got through');
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
                    fail('Different user could be updated without UserUpdate role');
                } catch (error) {}

                await service.patch(moderator.id, { name: 'moderator' }, asUser(admin));
                moderator = await service.get(moderator.id, internal);
                expect(moderator).toBeTruthy();
                expect(moderator.name).not.toBe(oldModeratorName);
            });

            it('prevents updating a user with more roles than you', async () => {
                try {
                    await service.patch(admin.id, { name: 'moderator' }, asUser(moderator));
                    fail('More granted could be updated');
                } catch (e) {}

                const tmp = await tdc.mkUser({ roles: allRoles });

                try {
                    await service.remove(tmp.id, asUser(moderator));
                    fail('More granted could be removed');
                } catch (e) {}
            });
        });

        describe('changing roles', () => {
            const newRoles = [Roles.UserDisplay, Roles.AssignRole];
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

            it("prevents user from giving roles he doesn't have", async () => {
                try {
                    await service.patch(
                        tmpUser.id,
                        {
                            roles: allRoles,
                        },
                        asUser(moderator)
                    );
                    fail('Giving more roles');
                } catch (error) {}
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
                try {
                    await service.patch(
                        user.id,
                        {
                            roles: newRoles,
                        },
                        asUser(user)
                    );
                    fail('Giving roles without UserAssignRole');
                } catch (e) {}
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

            it('prevents the user from giving profiles with more roles than he has', async () => {
                await service.patch(
                    tmpUser.id,
                    {
                        profiles: [profile1.id],
                    },
                    asUser(moderator)
                );
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([Roles.UserDisplay]);
                expect(tmpUser.profiles.map((it: { id: any }) => it.id)).toStrictEqual([profile1.id]);

                await service.patch(
                    tmpUser.id,
                    {
                        profiles: [profile1.id, profile2.id],
                    },
                    asUser(moderator)
                );
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([Roles.UserDisplay, Roles.UserUpdate]);
                expect(tmpUser.profiles.map((it: { id: any }) => it.id)).toStrictEqual([
                    profile1.id,
                    profile2.id,
                ]);

                try {
                    await service.patch(
                        tmpUser.id,
                        {
                            profiles: [profileAdmin.id],
                        },
                        asUser(moderator)
                    );
                    fail('Could give profile with more roles');
                } catch (error) {}

                // test no changes
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([Roles.UserDisplay, Roles.UserUpdate]);
                expect(tmpUser.profiles.map((it: { id: any }) => it.id)).toStrictEqual([
                    profile1.id,
                    profile2.id,
                ]);

                try {
                    await service.patch(
                        tmpUser.id,
                        {
                            profiles: [profile1.id, profile2.id, profileAdmin.id],
                        },
                        asUser(moderator)
                    );
                } catch (error) {}

                // test no changes
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual([Roles.UserDisplay, Roles.UserUpdate]);
                expect(tmpUser.profiles.map((it: { id: any }) => it.id)).toStrictEqual([
                    profile1.id,
                    profile2.id,
                ]);
            });

            it('can do anything as internal', async () => {
                await service.patch(
                    tmpUser.id,
                    {
                        profiles: [profile1.id, profile2.id, profileAdmin.id].join(','),
                    },
                    internal
                );
                tmpUser = await service.get(tmpUser.id, internal);
                expect(tmpUser).toBeTruthy();
                expect(tmpUser.roles).toStrictEqual(allRoles.sort());
                expect(tmpUser.profiles.map((it: { id: any }) => it.id)).toStrictEqual([
                    profile1.id,
                    profile2.id,
                    profileAdmin.id,
                ]);
            });

            it('cannot affect profiles without designed role', async () => {
                try {
                    await service.patch(
                        user.id,
                        {
                            profiles: [profile1.id],
                        },
                        asUser(user)
                    );
                    fail('Could give profile at all');
                } catch (e) {}
            });
        });
    });
});
