type Catalog = typeof import('../../messages/en.json');
export type MessageKey = { [Namespace in keyof Catalog]: `${Namespace & string}.${keyof Catalog[Namespace] & string}` }[keyof Catalog];

// Public application messages retain their keys and values until display time.
// This keeps existing errors and transaction records readable after a locale change.
export interface MessageDescriptor {
    key: MessageKey;
    values?: Record<string, MessageValue>;
}
export type MessageValue = string | number | boolean | null | undefined | MessageDescriptor;
export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

export function message(key: MessageKey, values?: MessageDescriptor['values']): MessageDescriptor {
    return values ? { key, values } : { key };
}
export class AppError extends Error {
    constructor(public readonly descriptor: MessageDescriptor) {
        super(descriptor.key);
        this.name = 'AppError';
    }
}
export function describeError(error: unknown): MessageValue {
    if (error === null || error === undefined) return '';
    if (error instanceof AppError) return error.descriptor;
    if (error && typeof error === 'object' && 'key' in error) return error as MessageDescriptor;
    return error instanceof Error ? error.message : String(error);
}
export function formatMessage(t: Translate, value: MessageValue): string {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'object') return String(value);
    const values = Object.fromEntries(Object.entries(value.values || {}).map(([key, item]) => [key, typeof item === 'number' ? item : formatMessage(t, item)]));
    return t(value.key, values);
}
