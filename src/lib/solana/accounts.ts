import { Metadata, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { TOKEN_PROGRAM_ID,unpackMint } from '@solana/spl-token';
import { PublicKey,type Connection } from '@solana/web3.js';
import { formatTokenAmount } from './amounts';
import { metadataAddress,metadataJson } from './metadata';

export interface WalletToken {
    mint: string;
    rawAmount: string;
    amount: string;
    decimals: number;
    name: string;
    symbol: string;
    uri?: string;
    image?: string;
    mintAuthority?: string;
    freezeAuthority?: string;
    metadataUpdateAuthority?: string;
    hasMetadata?: boolean;
}

async function batchAccounts(connection: Connection, keys: PublicKey[]) {
    const result = [];
    for (let index = 0; index < keys.length; index += 100) result.push(...await connection.getMultipleAccountsInfo(keys.slice(index, index + 100)));
    return result;
}

async function mapLimited<T, R>(items: T[], concurrency: number, fn: (value: T, index: number) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await fn(items[index], index);
        }
    }));
    return results;
}

// 仅缓存链下只读元数据；账户余额和权限每次刷新，避免陈旧权限。
const jsonCache = new Map<string, { expires: number; value: { image?: string } }>();
export async function loadWalletTokens(connection: Connection, owner: PublicKey): Promise<WalletToken[]> {
    const parsed = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });
    const grouped = new Map<string, { raw: bigint; decimals: number }>();
    for (const entry of parsed.value) {
        const info = entry.account.data.parsed.info;
        const previous = grouped.get(info.mint);
        grouped.set(info.mint, { raw: (previous?.raw || 0n) + BigInt(info.tokenAmount.amount), decimals: info.tokenAmount.decimals });
    }
    const mints = [...grouped.keys()].map(mint => new PublicKey(mint));
    const [mintAccounts, metadataAccounts] = await Promise.all([
        batchAccounts(connection, mints), batchAccounts(connection, mints.map(metadataAddress))
    ]);
    return mapLimited(mints, 4, async (mint, index) => {
        const amount = grouped.get(mint.toBase58())!;
        const mintAccount = mintAccounts[index];
        const mintInfo = mintAccount ? unpackMint(mint, mintAccount) : undefined;
        let metadata: Metadata | undefined;
        try {
            const account = metadataAccounts[index];
            if (account?.owner.equals(PROGRAM_ID)) metadata = Metadata.deserialize(account.data)[0];
        } catch { /* 元数据损坏不隐藏基础资产。 */ }
        const uri = metadata?.data.uri.replace(/\0/g, '').trim();
        let image: string | undefined;
        if (uri) {
            const key = `${connection.rpcEndpoint}:${mint.toBase58()}:${uri}`;
            const cached = jsonCache.get(key);
            if (cached && cached.expires > Date.now()) image = cached.value.image;
            else {
                try {
                    const json = await metadataJson(uri);
                    image = json.image;
                    if (jsonCache.size >= 200) jsonCache.delete(jsonCache.keys().next().value!);
                    jsonCache.set(key, { expires: Date.now() + 300000, value: json });
                } catch { /* 链下 URI 不可用时仍显示链上数据。 */ }
            }
        }
        return {
            mint: mint.toBase58(), rawAmount: amount.raw.toString(), amount: formatTokenAmount(amount.raw, amount.decimals), decimals: amount.decimals,
            name: metadata?.data.name.replace(/\0/g, '').trim() || '', symbol: metadata?.data.symbol.replace(/\0/g, '').trim() || '',
            hasMetadata: Boolean(metadata),
            uri, image, mintAuthority: mintInfo?.mintAuthority?.toBase58(), freezeAuthority: mintInfo?.freezeAuthority?.toBase58(), metadataUpdateAuthority: metadata?.updateAuthority.toBase58()
        };
    });
}
