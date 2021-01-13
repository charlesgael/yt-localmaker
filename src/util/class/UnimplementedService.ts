import { BadRequest } from '@feathersjs/errors';
import { Id, NullableId, ServiceMethods } from '@feathersjs/feathers';

export default abstract class UnimplementedService<T> implements ServiceMethods<T> {
    async find(): Promise<T> {
        throw new BadRequest(new Error('Bad request'));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async get(id: Id): Promise<T> {
        throw new BadRequest(new Error('Bad request'));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async create(data: Partial<T>): Promise<T> {
        throw new BadRequest(new Error('Bad request'));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async patch(id: NullableId, data: Partial<T>): Promise<T> {
        throw new BadRequest(new Error('Bad request'));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async update(id: NullableId, data: Partial<T>): Promise<T> {
        throw new BadRequest(new Error('Bad request'));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async remove(id: NullableId): Promise<T> {
        throw new BadRequest(new Error('Bad request'));
    }
}
