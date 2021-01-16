import { Id, NullableId, Params } from '@feathersjs/feathers';
import { Service } from 'feathers-sequelize';
import { Model } from 'sequelize';
import DataReactorMixin from './DataReactorService';

export default function SequelizeParamCRUDService<T>() {
    return class Impl extends DataReactorMixin<T>()(Service)<T> {
        _setInResult(result: T, key: keyof T, value: any) {
            if (result instanceof Model) {
                result.set(key, value);
            } else {
                result[key] = value;
            }
        }

        async create(data: Partial<T> | Partial<T>[], params: Params = {}): Promise<T | T[]> {
            // Put aside special cases
            // const alteredData = this._holdData(data as any, 'create') as Partial<T> | Partial<T>[];
            const alteredData = this._holdCreateData(data);

            // Real call
            const res = await super.create(alteredData, params);

            // Perform further actions with extracted data
            // const alteredRes = (await this._callHook(data as any, 'create', res as any, params)) as T | T[];
            const alteredRes = await this._callCreateHook(data, res, params);

            return alteredRes;
        }

        async update(id: Id, data: T, { $returning, ...params }: Params = {}): Promise<T> {
            // Put aside special cases
            // const alteredData = this._holdData(data, 'update');
            const alteredData = this._holdUpdateData(data);

            // Real call
            const res = await super.update(id, alteredData, params);

            // Perform further actions with extracted data
            // const alteredRes = await this._callHook(data, 'update', res, params);
            const alteredRes = await this._callUpdateHook(data, res, params);

            if ($returning !== false) return alteredRes;

            // I know what i am doing (same thing as sequelize)
            return (undefined as any) as T;
        }

        async patch(
            id: NullableId,
            data: Partial<T>,
            { $returning, ...params }: Params = {}
        ): Promise<T | T[]> {
            // Put aside special cases
            // const alteredData = this._holdData(data, 'patch');
            const alteredData = this._holdPatchData(data);

            // Real call
            const res = await super.patch(id, alteredData, params);

            // Perform further actions with extracted data
            const alteredRes = await this._callPatchHook(data, res, params);

            return $returning !== false ? alteredRes : [];
        }
    };
}
