import { AppError, message, type Translate, type MessageKey } from '../../i18n/message';
import { PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';

export function metadataAddress(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync([Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mint.toBuffer()], PROGRAM_ID)[0];
}

export function normalizeUri(uri: string): string {
    const clean = uri.replace(/\0/g, '').trim();
    const normalized = clean.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${clean.slice(7).replace(/^ipfs\//, '')}` : clean;
    if (!/^https?:\/\//i.test(normalized)) throw new AppError(message("metadata.uriMustUseHttpSOrIpfs"));
    return new URL(normalized).toString();
}

function metadataFieldErrorKeys(name: string, symbol: string, uri: string) {
    const errors: Record<'name' | 'symbol' | 'uri', MessageKey | ''> = { name: '', symbol: '', uri: '' };
    const length = (value: string) => new TextEncoder().encode(value).length;
    if (!name.trim() || length(name) > 32) errors.name = 'metadata.nameIsRequiredAndMustNotExceed32Bytes';
    if (!symbol.trim() || length(symbol) > 10) errors.symbol = 'metadata.symbolIsRequiredAndMustNotExceed10Bytes';
    if (length(uri) > 200) errors.uri = 'metadata.uriMustNotExceed200Bytes';
    else if (uri) {
        try { normalizeUri(uri); }
        catch { errors.uri = 'metadata.uriMustBeAValidHttpSOrIpfs'; }
    }
    return errors;
}

export function metadataFieldErrors(name: string, symbol: string, uri: string, t: Translate = key => key) {
    const keys = metadataFieldErrorKeys(name, symbol, uri);
    return { name: keys.name ? t(keys.name) : '', symbol: keys.symbol ? t(keys.symbol) : '', uri: keys.uri ? t(keys.uri) : '' };
}

export function validateMetadata(name: string, symbol: string, uri: string) {
    const errors = metadataFieldErrorKeys(name, symbol, uri);
    const first = errors.name || errors.symbol || errors.uri;
    if (first) throw new AppError(message(first));
}

export async function metadataJson(uri: string): Promise<{ image?: string; description?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(normalizeUri(uri), { signal: controller.signal, referrerPolicy: 'no-referrer' });
        if (!response.ok) throw new AppError(message("metadata.metadataHttp", { v0: response.status }));
        const json = await response.json();
        return { image: typeof json.image === 'string' ? normalizeUri(json.image) : undefined, description: typeof json.description === 'string' ? json.description : undefined };
    } finally { clearTimeout(timer); }
}
