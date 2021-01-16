import { Model as SModel } from 'sequelize';

/* eslint-disable @typescript-eslint/ban-types */
export default abstract class Model<
    TModelAttributes extends {} = any,
    TCreationAttributes extends {} = TModelAttributes
> extends SModel<TModelAttributes, TCreationAttributes> {
    readonly createdAt!: Date;
    readonly updatedAt!: Date;
}
