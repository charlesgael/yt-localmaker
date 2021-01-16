export function asArray<T extends any>(o: T | T[] | undefined): T[] {
    if (o) return Array.prototype.concat(o);
    return [];
}

export function defaultSort<T>(o: T[]): T[] {
    return o.sort();
}
