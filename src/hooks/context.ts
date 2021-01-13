import { HookContext } from '@feathersjs/feathers';
import { checkContext, MethodName } from 'feathers-hooks-common';

export const hasContext = (methods?: MethodName | MethodName[] | null) => (
    context: HookContext
) => {
    try {
        checkContext(context, null, methods);
        return true;
    } catch (err) {
        return false;
    }
};
