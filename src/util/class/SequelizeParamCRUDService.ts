import { Id, NullableId, Params } from '@feathersjs/feathers';
import { Service } from 'feathers-sequelize';
import { Model } from 'sequelize';
import DataReactorService from './DataReactorService';

export const capitalize = (s: string): string => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
};

// This can live anywhere in your codebase:
function applyMixins(derivedCtor: any, constructors: any[]) {
    constructors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
            );
        });
    });
}

abstract class SequelizeDataReactorService<T> extends Service<T> {
    _setInResult(result: T, key: keyof T, value: any) {
        if (result instanceof Model) {
            result.set(key, value);
        } else {
            result[key] = value;
        }
    }

    async create(data: Partial<T> | Partial<T>[], params: Params = {}): Promise<T | T[]> {
        // Put aside special cases
        const held: string[] = [];
        const alteredData = this._holdData(data as any, 'create', held) as Partial<T> | Partial<T>[];

        // Real call
        const res = await super.create(alteredData, params);

        // Perform further actions with extracted data
        const alteredRes = (await this._callHook(data as any, 'create', held, res as any, params)) as T | T[];

        return alteredRes;
    }

    async update(id: Id, data: T, { $returning, ...params }: Params = {}): Promise<T> {
        // Put aside special cases
        const held: string[] = [];
        const alteredData = this._holdData(data, 'update', held);

        // Real call
        const res = await super.update(id, alteredData, params);

        // Perform further actions with extracted data
        const alteredRes = await this._callHook(data, 'update', held, res, params);

        if ($returning !== false) return alteredRes;

        // I know what i am doing (same thing as sequelize)
        return (undefined as any) as T;
    }

    async patch(id: NullableId, data: Partial<T>, { $returning, ...params }: Params = {}): Promise<T | T[]> {
        // Put aside special cases
        const held: string[] = [];
        const alteredData = this._holdData(data, 'patch', held);

        // Real call
        const res = await super.patch(id, alteredData, params);

        // Perform further actions with extracted data
        const alteredRes = await this._callHook(data, 'patch', held, res, params);

        return $returning !== false ? alteredRes : [];
    }
}
interface SequelizeDataReactorService<T> extends DataReactorService<T> {}
applyMixins(SequelizeDataReactorService, [DataReactorService]);

export default SequelizeDataReactorService;
