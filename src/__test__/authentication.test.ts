import app from '../app';
import { asUser } from './__util__/authentication';
import testDomain, { TestDomainCreator } from './__util__/testDomainCreator.class';

describe('services.authentication', () => {
    let tdc: TestDomainCreator;
    beforeAll(async () => {
        tdc = await testDomain(app);
    });

    it('registered the service', () => {
        const service = app.service('authentication');
        expect(service).toBeTruthy();
    });

    describe('local strategy', () => {
        beforeAll(async () => {
            await tdc.mkUser({
                name: 'admin',
                password: 'admin',
            });
        });

        it('authenticates user and creates accessToken', async () => {
            const { user, accessToken } = await app.services.authentication.create(
                {
                    strategy: 'local',
                    name: 'admin',
                    password: 'admin',
                },
                {}
            );

            expect(user).toBeTruthy();
            expect(accessToken).toBeTruthy();

            // Try to see if we have access to a loggedIn service with token
            const me = await app.services.me.find({
                authentication: {
                    strategy: 'jwt',
                    accessToken,
                },
                provider: 'rest',
            });

            expect(me).toBeTruthy();
            expect(me.name).toBe('admin');
            expect(me.password).toBeFalsy();
        });
    });

    describe('authentication utility', () => {
        let user: any;

        beforeAll(async () => {
            user = await tdc.mkUser();
        });

        it('authenticates user properly', async () => {
            const me = await app.services.me.find(asUser(user));

            expect(me).toBeTruthy();
        });

        it("doesn't let pass unknown users", async () => {
            try {
                await app.services.me.find(asUser(999));
                fail();
            } catch (e) {}
        });
    });
});
