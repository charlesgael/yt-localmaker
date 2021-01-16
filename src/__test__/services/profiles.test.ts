import app from '../../app';
import { Profiles } from '../../services/profiles/profiles.class';
import Roles from '../../util/enums/roles.enum';
import { internal, withRoles } from '../__util__/authentication';
import randomName from '../__util__/names';
import testDomain, { TestDomainCreator } from '../__util__/testDomainCreator.class';

const allRoles = Object.values(Roles);

describe('services.profiles', () => {
    const service = app.service('profiles');

    it('registered the service', () => {
        expect(service).toBeTruthy();
    });

    describe('profile service testing', () => {
        let tdc: TestDomainCreator;

        beforeAll(async () => {
            tdc = await testDomain(app);
        });

        describe('profiles find method', () => {
            it("find: doesn't work without roles", async () => {
                try {
                    await service.find(withRoles());
                    fail('Could find without role');
                } catch (e) {
                    expect(e.message).toBe('Access forbidden');
                }
            });

            it('find: shows with the role', async () => {
                await service.find(withRoles(Roles.ProfileDisplay));
            });
        });

        describe('profiles get method', () => {
            let profile: any;
            beforeAll(async () => {
                profile = await tdc.mkProfile();
            });

            it("get: doesn't work without roles", async () => {
                try {
                    await service.get(profile.id, withRoles());
                    fail('Could get without role');
                } catch (e) {
                    expect(e.message).toBe('Access forbidden');
                }
            });

            it('get: shows with the role', async () => {
                await service.get(profile.id, withRoles(Roles.ProfileDisplay));
            });
        });

        describe('profiles create method', () => {
            it("create: doesn't work without roles", async () => {
                try {
                    await service.create({
                        name: 'test',
                    });
                    fail('Could create without roles');
                } catch (e) {
                    expect(e.message).toBe('Access forbidden');
                }
            });

            it('create: creates profile with ProfileCreate role', async () => {
                const p = (await service.create(
                    {
                        name: randomName(),
                    },
                    withRoles(Roles.ProfileCreate)
                )) as Profiles.Result;

                expect(p).toBeTruthy();
                expect(p.name).toBeTruthy();
                expect(p.roles).toStrictEqual([]);
            });

            it('create: prevents from creating profile setting roles without AssignRole role', async () => {
                try {
                    await service.create(
                        {
                            name: randomName(),
                            roles: [Roles.UserDisplay],
                        },
                        withRoles(Roles.ProfileCreate)
                    );
                    fail('Could create profile setting roles without AssignRole');
                } catch (e) {
                    expect(e.message).toBe('Field roles may not be sent. (preventData)');
                }
            });

            it('create: creates profile setting roles with AssignRole role', async () => {
                const p = (await service.create(
                    {
                        name: randomName(),
                        roles: [Roles.ProfileCreate],
                    },
                    withRoles(Roles.ProfileCreate, Roles.AssignRole)
                )) as Profiles.Result;

                expect(p).toBeTruthy();
                expect(p.name).toBeTruthy();
                expect(p.roles).toStrictEqual([Roles.ProfileCreate]);
            });

            it('create: prevent creating stronger profile', async () => {
                try {
                    await service.create(
                        {
                            name: randomName(),
                            roles: [Roles.UserDisplay],
                        },
                        withRoles(Roles.ProfileCreate, Roles.AssignRole)
                    );
                } catch (e) {
                    expect(e.message).toBe('Roles consistency. (u.roles)');
                }
            });

            it('create: creates profile without unknown roles', async () => {
                const p = (await service.create(
                    {
                        name: randomName(),
                        roles: 'list,of,unknown,roles',
                    },
                    withRoles(Roles.ProfileCreate, Roles.AssignRole)
                )) as Profiles.Result;

                expect(p).toBeTruthy();
                expect(p.name).toBeTruthy();
                expect(p.roles).toStrictEqual([]);
            });
        });

        describe('profile patch method', () => {
            let profile: Profiles.Result, strong: Profiles.Result;
            beforeEach(async () => {
                [profile, strong] = await tdc.mkProfiles(
                    {},
                    {
                        roles: [
                            Roles.ProfileCreate,
                            Roles.ProfileDisplay,
                            Roles.ProfileUpdate,
                            Roles.ProfileDelete,
                        ],
                    }
                );
            });

            it('patch: reqRole(Roles.ProfileUpdate) fail', async () => {
                try {
                    await service.patch(
                        profile.id,
                        {
                            name: randomName(),
                        },
                        withRoles()
                    );
                } catch (e) {
                    expect(e.message).toBe('Access forbidden');
                }
            });

            it('patch: reqRole(Roles.ProfileUpdate) success', async () => {
                profile = (await service.patch(
                    profile.id,
                    {
                        name: 'patch: reqRole(Roles.ProfileUpdate) success',
                    },
                    withRoles(Roles.ProfileUpdate)
                )) as Profiles.Result;

                expect(profile).toBeTruthy();
                expect(profile.name).toBe('patch: reqRole(Roles.ProfileUpdate) success');
            });

            it('patch: protectStrongerProfiles internal (success)', async () => {
                strong = (await service.patch(
                    strong.id,
                    {
                        roles: allRoles,
                    },
                    internal
                )) as Profiles.Result;

                expect(strong).toBeTruthy();
                expect(strong.roles).toStrictEqual(allRoles);
            });

            it('patch: protectStrongerProfiles external consistency fail', async () => {
                try {
                    await service.patch(
                        strong.id,
                        {
                            name: randomName(),
                        },
                        withRoles(Roles.ProfileUpdate)
                    );
                } catch (e) {
                    expect(e.message).toBe('Cannot edit profile with more roles than you. (s.profiles)');
                }
            });

            it('patch: protectStrongerProfiles external consistency success', async () => {
                strong = (await service.patch(
                    strong.id,
                    {
                        name: 'patch: protectStrongerProfiles external consistency success',
                    },
                    withRoles(...allRoles)
                )) as Profiles.Result;

                expect(strong).toBeTruthy();
                expect(strong.name).toBe('patch: protectStrongerProfiles external consistency success');
            });
        });
    });
});
