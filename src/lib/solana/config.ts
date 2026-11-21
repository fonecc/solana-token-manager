import { AppError, message } from '../../i18n/message';
import { clusterApiUrl,type Commitment,type Connection } from '@solana/web3.js';

// 本教程只允许 Devnet。自定义 RPC 也必须连接 Devnet。
export const CLUSTER = 'devnet' as const;
export const DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export async function assertDevnet(connection: Connection) {
    if (await connection.getGenesisHash() !== DEVNET_GENESIS_HASH) throw new AppError(message("config.rpcIsNotSolanaDevnetTransactionOrAirdropBlocked"));
}
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(CLUSTER);
export const COMMITMENT: Commitment = 'confirmed';

export function explorerUrl(value: string, type: 'tx' | 'address' = 'address') {
    return `https://explorer.solana.com/${type}/${encodeURIComponent(value)}?cluster=${CLUSTER}`;
}
