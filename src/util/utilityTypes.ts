import { Model } from 'sequelize';

export type Replace<Type, Key extends keyof any, By> = Omit<Type, Key> & Record<Key, By>;
export type ReplaceMulti<Type, Replacement extends Record<string, any>> = Omit<Type, keyof Replacement> &
    Replacement;

export type SequelizeServiceModel<Type extends Model> = Type['_attributes'];
