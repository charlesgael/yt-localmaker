import { Params } from '@feathersjs/feathers';
import logger from '../logger';
import { capitalize } from './SequelizeParamCRUDService';

export default abstract class DataReactorService<T> {
    _holdData(data: Partial<T> | Partial<T>[], method: 'create', held: string[]): Partial<T> | Partial<T>[];
    _holdData(data: T, method: 'update', held: string[]): T;
    _holdData(data: Partial<T>, method: 'patch', held: string[]): Partial<T>;
    _holdData(
        data: T | Partial<T> | Partial<T>[],
        method: 'create' | 'update' | 'patch',
        held: string[]
    ): T | Partial<T> | Partial<T>[] {
        if (Array.isArray(data)) {
            // if (method !== 'create') {
            //     logger.warn('Multiple data in non create method');
            //     return data;
            // }
            return data.map((it) => this._holdData(it, 'create', held) as Partial<T>);
        }

        const alteredData: typeof data = { ...data };

        const keys = Object.keys(data) as (keyof T)[];
        const self = this as any;

        keys.filter((key: any) => {
            return (
                typeof self[`on${capitalize(method)}With${capitalize(key)}`] === 'function' ||
                typeof self[`onDataWith${capitalize(key)}`] === 'function'
            );
        }).forEach((key) => {
            held.push(key as string);
            delete alteredData[key];
        });

        return alteredData;
    }

    _callHook(
        data: Partial<T>[],
        method: 'create',
        held: string[],
        results: T[],
        params: Params
    ): Promise<T[]>;
    _callHook(data: Partial<T>, method: 'create', held: string[], results: T, params: Params): Promise<T>;
    _callHook(data: T, method: 'update', held: string[], results: T, params: Params): Promise<T>;
    _callHook(
        data: Partial<T>,
        method: 'patch',
        held: string[],
        results: T | T[],
        params: Params
    ): Promise<T | T[]>;
    async _callHook(
        data: Partial<T> | Partial<T>[],
        method: 'create' | 'update' | 'patch',
        held: string[],
        results: T | T[],
        params: Params
    ): Promise<T | T[]> {
        if (Array.isArray(results)) {
            if (method === 'create') {
                // if (!Array.isArray(data) || results.length !== data.length) {
                //     logger.warn('Created more entries than asked for');
                //     return results;
                // }
                return await Promise.all(
                    results.map(
                        async (it, idx) => await this._callHook((data as T[])[idx], method, held, it, params)
                    )
                );
            } else if (method === 'patch') {
                // if (Array.isArray(data)) {
                //     logger.warn('Multiple data in patch mode');
                //     return results;
                // }
                return await Promise.all(
                    results.map(
                        async (it) => (await this._callHook(data as T, method, held, it, params)) as T
                    )
                );
            }
            logger.warn('Multiple results in update mode');
            return results;
        }
        // if (Array.isArray(data)) {
        //     logger.warn('Multiple data for single result');
        //     return results;
        // }

        const self = this as any;
        const updates = await Promise.all(
            held.map(async (key) => {
                try {
                    let value = (data as any)[key];
                    if (typeof self[`onDataWith${capitalize(key)}`] === 'function') {
                        value = await Promise.resolve(
                            self[`onDataWith${capitalize(key)}`](value, results, params)
                        );
                    }
                    if (typeof self[`on${capitalize(method)}With${capitalize(key)}`] === 'function') {
                        value = await Promise.resolve(
                            self[`on${capitalize(method)}With${capitalize(key)}`](value, results, params)
                        );
                    }
                    return { key, value };
                } catch (e) {
                    logger.error('Error when updating key', e);
                }
                return { key, value: undefined };
            })
        );

        updates.forEach((it) => {
            this._setInResult(results as T, it.key as keyof T, it.value);
        });

        return results;
    }

    abstract _setInResult(result: T, key: keyof T, value: any): void;
}
