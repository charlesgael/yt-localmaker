import app from '../../app';

describe('services.profiles', () => {
    it('registered the service', () => {
        const service = app.service('profiles');
        expect(service).toBeTruthy();
    });
});
