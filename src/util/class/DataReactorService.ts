import { Params } from '@feathersjs/feathers';
import { omit } from 'remeda';
import logger from '../logger';

type Hook<T> = <V>(value: V, result: T, params: Params) => V;

interface PropHook<T> {
    all?: Hook<T>;
    create?: Hook<T>;
    update?: Hook<T>;
    patch?: Hook<T>;
    keepProperty: boolean;
}

interface ReactorHook<T> {
    [param: string]: PropHook<T>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor<T = {}> = new (...args: any[]) => T;

// eslint-disable-next-line @typescript-eslint/ban-types
export default function DataReactorMixin<T extends {} = {}>() {
    return function <TBase extends Constructor>(Base: TBase) {
        abstract class Reactor extends Base {
            private reactors: ReactorHook<T> = {};

            constructor(...args: any[]) {
                super(...args);

                const self = (this as any).__proto__;
                if (!self) return;

                const filterReg = /^on(?<type>Create|Update|Patch|Data)With(?<name>[A-Z_$][a-zA-Z0-9_$]*)$/;
                Object.getOwnPropertyNames(self).forEach((key) => {
                    const val = self[key];
                    const match = filterReg.exec(key);
                    if (match && typeof val === 'function') {
                        const {
                            groups: { type, name } = {},
                        }: {
                            groups?: { type?: 'Create' | 'Update' | 'Patch' | 'Data'; name?: string };
                        } = match;

                        if (type && name) {
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            if (!this.reactors[name.toLowerCase()])
                                this.reactors[name.toLowerCase()] = {
                                    keepProperty: !!self[`keepData${name}`],
                                };

                            const prop = type === 'Data' ? 'all' : (type.toLowerCase() as keyof PropHook<T>);
                            this.reactors[name.toLowerCase()][prop] = val;
                        }
                    }
                });
            }

            _holdCreateData(data: Partial<T> | Partial<T>[]): Partial<T> | Partial<T>[] {
                if (Array.isArray(data)) {
                    return data.map((it) => this._holdCreateData(it)) as Partial<T>[];
                }

                return this._holdData(data, 'create');
            }

            _holdUpdateData(data: T): T {
                return this._holdData(data, 'update');
            }

            _holdPatchData(data: Partial<T>): Partial<T> {
                return this._holdData(data, 'patch');
            }

            private _holdData(data: Partial<T>, method: 'create' | 'patch'): Partial<T>;
            private _holdData(data: T, method: 'update'): T;
            private _holdData(data: T | Partial<T>, method: 'create' | 'update' | 'patch'): T | Partial<T> {
                return omit(
                    data,
                    Object.keys(this.reactors).filter(
                        (key) =>
                            // At least one reactor (non specific)
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            this.reactors[key] &&
                            // There is no order to keep the property
                            !this.reactors[key].keepProperty &&
                            // Reactor is for this method or global one
                            (this.reactors[key].all || this.reactors[key][method])
                    ) as []
                ) as T;
            }

            async _callCreateHook(
                data: Partial<T> | Partial<T>[],
                results: T | T[],
                params: Params
            ): Promise<T | T[]> {
                if (Array.isArray(results)) {
                    if (!Array.isArray(data) || results.length !== data.length) {
                        logger.warn('DataReactorService._callCreateHook different amount created for asked');
                        return results;
                    }

                    return await Promise.all(
                        results.map(
                            async (it, idx) => (await this._callCreateHook(data[idx], it, params)) as T
                        )
                    );
                }
                if (Array.isArray(data)) {
                    logger.warn('DataReactorService._callCreateHook asked multiple created one');
                    return results;
                }

                return await this._callHook(data, results, params, 'create');
            }

            async _callUpdateHook(data: T, result: T, params: Params): Promise<T> {
                return await this._callHook(data, result, params, 'update');
            }

            async _callPatchHook(data: Partial<T>, results: T | T[], params: Params): Promise<T | T[]> {
                if (Array.isArray(results)) {
                    return await Promise.all(
                        results.map(async (it) => (await this._callPatchHook(data, it, params)) as T)
                    );
                }

                return await this._callHook(data, results, params, 'update');
            }

            private async _callHook(
                data: Partial<T>,
                result: T,
                params: Params,
                method: 'create' | 'update' | 'patch'
            ): Promise<T> {
                await Promise.all(
                    Object.keys(data)
                        // Has a reactor for this method
                        .filter(
                            (key) =>
                                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                this.reactors[key] && (this.reactors[key].all || this.reactors[key][method])
                        )
                        // Get corresponding tuple key / reactor / value
                        .map((key) => ({
                            key,
                            all: this.reactors[key].all,
                            method: this.reactors[key][method],
                            value: (data as any)[key],
                        }))
                        // Exec reactor on value
                        .map(async ({ key, all, method, value }) => {
                            try {
                                let alteredValue = value;
                                if (all !== undefined) {
                                    alteredValue = await all.call(this, alteredValue, result, params);
                                }
                                if (method !== undefined) {
                                    alteredValue = await method.call(this, alteredValue, result, params);
                                }
                                this._setInResult(result, key as keyof T, alteredValue);
                            } catch (e) {
                                logger.error('Error when updating key', e);
                            }
                        })
                );

                return result;
            }

            abstract _setInResult(result: T, key: keyof T, value: any): void;
        }

        return Reactor;
    };
}
