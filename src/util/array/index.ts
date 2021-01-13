export function objOrArrayObj<T extends string | number | boolean | Record<string, any>>(
    o: T | T[] | undefined
): T[] | undefined {
    return o === undefined || Array.isArray(o) ? o : [o];
}
