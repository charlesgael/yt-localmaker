import app from '../../app';
import Roles from '../../util/enums/roles.enum';
import { asUser } from '../__util__/authentication';
import testDomain from '../__util__/testDomainCreator.class';

describe('services.me', () => {
    it('registered the service', () => {
        const service = app.service('me');
        expect(service).toBeTruthy();
    });

    describe('show user', () => {
        let user1: any, user2: any;

        beforeAll(async () => {
            const tdc = await testDomain(app);

            [user1, user2] = await tdc.mkUsers(
                {
                    roles: Roles.UserDisplay,
                },
                {}
            );
        });

        it('shows user1 when called by user1', async () => {
            const me = await app.services.me.find(asUser(user1));

            expect(me).toBeTruthy();
            expect(me.name).toBe(user1.name);
            expect(me.password).toBeFalsy();
            expect(me.roles).toStrictEqual([Roles.UserDisplay]);
        });

        it('shows user2 when called by user2', async () => {
            const me = await app.services.me.find(asUser(user2));

            expect(me).toBeTruthy();
            expect(me.name).toBe(user2.name);
            expect(me.password).toBeFalsy();
            expect(me.roles).toStrictEqual([]);
        });

        it('thows error when called by no user', async () => {
            try {
                await app.services.me.find({ authenticated: true });
                fail('Service could be called by no user');
            } catch (error) {}
            try {
                await app.services.me.find();
                fail('Service could be called unauthentified');
            } catch (error) {}
        });
    });

    describe('other methods', () => {
        it("doesn't answer on get", async () => {
            try {
                await app.services.me.get(1);
                fail('Service could be called with get');
            } catch (e) {}
        });
        it("doesn't answer on create", async () => {
            try {
                await app.services.me.create({});
                fail('Service could be called with create');
            } catch (e) {}
        });
        it("doesn't answer on update", async () => {
            try {
                await app.services.me.update(1, {});
                fail('Service could be called with update');
            } catch (e) {}
        });
        it("doesn't answer on patch", async () => {
            try {
                await app.services.me.patch(1, {});
                fail('Service could be called with patch');
            } catch (e) {}
        });
        it("doesn't answer on remove", async () => {
            try {
                await app.services.me.remove(1);
                fail('Service could be called with remove');
            } catch (e) {}
        });
    });
});
