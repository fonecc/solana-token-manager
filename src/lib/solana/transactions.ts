import { AppError, message, describeError, type MessageValue } from '../../i18n/message';
import { Transaction,type Connection,type PublicKey,type Signer,type TransactionInstruction } from '@solana/web3.js';
import { COMMITMENT,assertDevnet } from './config';
import { errorMessage } from './errors';

export type TransactionStage = 'awaiting-signature' | 'submitted' | 'confirming' | 'success' | 'failed' | 'pending';
export interface TransactionUpdate { stage: TransactionStage; signature?: string; message?: MessageValue; }
export type OnTransactionUpdate = (update: TransactionUpdate) => void;
export interface TransactionWallet {
    publicKey: PublicKey | null;
    signTransaction?: <T extends Transaction>(transaction: T) => Promise<T>;
}
export class PendingTransactionError extends AppError {
    constructor(public readonly signature: string, reason: MessageValue) {
        super(message("transactions.outcomePendingCheckTheOriginalTransactionDoNotResubmit", { v0: reason, v1: signature }));
    }
}

const activeWallets = new Set<string>();
const pendingWallets = new Map<string, string>();
const storageKey = (owner: string) => `solana-tutorial:pending:v1:devnet:${owner}`;

function pendingSignature(owner: string): string | undefined {
    try {
        return pendingWallets.get(owner) || (typeof window !== 'undefined' ? window.sessionStorage.getItem(storageKey(owner)) || undefined : undefined);
    } catch { return pendingWallets.get(owner); }
}

function storePending(owner: string, signature?: string) {
    if (signature) pendingWallets.set(owner, signature);
    else pendingWallets.delete(owner);
    try {
        if (typeof window !== 'undefined') {
            if (signature) window.sessionStorage.setItem(storageKey(owner), signature);
            else window.sessionStorage.removeItem(storageKey(owner));
        }
    } catch { /* 浏览器禁用存储时，当前会话仍保留内存保护。 */ }
}

// 不创建“新 blockhash + 相同业务操作”的自动重试，避免重复转账或重复加仓。
export async function executeTransaction(
    connection: Connection,
    wallet: TransactionWallet,
    transaction: Transaction,
    signers: Signer[] = [],
    onUpdate?: OnTransactionUpdate
): Promise<string> {
    if (!wallet.publicKey || !wallet.signTransaction) throw new AppError(message("transactions.connectAWalletThatSupportsTransactionSigning"));
    const owner = wallet.publicKey.toBase58();
    if (activeWallets.has(owner)) throw new AppError(message("transactions.thisWalletAlreadyHasATransactionInProgressWait"));
    activeWallets.add(owner);
    let signature: string | undefined;
    try {
        await assertDevnet(connection);
        const pending = pendingSignature(owner);
        if (pending) {
            const statuses = await connection.getSignatureStatuses([pending], { searchTransactionHistory: true }).catch(() => null);
            const status = statuses?.value[0];
            if (status?.err) storePending(owner);
            else if (status && ['confirmed', 'finalized'].includes(status.confirmationStatus || '')) {
                storePending(owner);
                throw new AppError(message("transactions.originalTransactionConfirmedNothingWasResubmittedRefreshBalancesAnd", { v0: pending }));
            } else throw new PendingTransactionError(pending, message("transactions.theOriginalTransactionOutcomeIsStillUnknown"));
        }
        const latest = await connection.getLatestBlockhash(COMMITMENT);
        transaction.recentBlockhash = latest.blockhash;
        transaction.feePayer = wallet.publicKey;
        if (signers.length) transaction.partialSign(...signers);
        onUpdate?.({ stage: 'awaiting-signature' });
        const signed = await wallet.signTransaction(transaction);
        // 保留已签交易的 signature，即使广播响应丢失仍可查询，不自动重签。
        const bytes = signed.serialize();
        const bs58 = (await import('bs58')).default;
        signature = signed.signature ? bs58.encode(signed.signature) : undefined;
        onUpdate?.({ stage: 'submitted', signature });
        let confirmation;
        try {
            const returnedSignature = await connection.sendRawTransaction(bytes, { skipPreflight: false, preflightCommitment: COMMITMENT });
            signature = returnedSignature;
            onUpdate?.({ stage: 'confirming', signature });
            confirmation = await connection.confirmTransaction({ ...latest, signature }, COMMITMENT);
        } catch (error) {
            if (!signature) throw error;
            const statuses = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true }).catch(() => null);
            const status = statuses?.value[0];
            if (status?.err) throw new AppError(message("transactions.onChainExecutionFailed", { v0: JSON.stringify(status.err) }));
            if (status && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) {
                onUpdate?.({ stage: 'success', signature });
                return signature;
            }
            // 明确模拟失败未广播时可安全提示失败，其他网络异常保守地视为结果不确定。
            if (errorMessage(error).includes('Simulation failed')) throw error;
            throw new PendingTransactionError(signature, describeError(error));
        }
        if (confirmation.value.err) throw new AppError(message("transactions.onChainExecutionFailed2", { v0: JSON.stringify(confirmation.value.err) }));
        onUpdate?.({ stage: 'success', signature });
        return signature;
    } catch (error) {
        if (error instanceof PendingTransactionError) {
            signature = error.signature;
            storePending(owner, signature);
        }
        onUpdate?.({ stage: error instanceof PendingTransactionError ? 'pending' : 'failed', signature, message: describeError(error) });
        throw error;
    } finally {
        activeWallets.delete(owner);
    }
}

export async function executeInstructionBatches(
    connection: Connection,
    wallet: TransactionWallet,
    batches: { instructions: TransactionInstruction[]; signers?: Signer[] }[],
    onUpdate?: OnTransactionUpdate
): Promise<string[]> {
    if (!batches.length || batches.some(batch => !batch.instructions.length)) throw new AppError(message("transactions.sdkProducedNoValidTransactionInstructions"));
    const signatures: string[] = [];
    for (let index = 0; index < batches.length; index++) {
        const batch = batches[index];
        try {
            const signature = await executeTransaction(connection, wallet, new Transaction().add(...batch.instructions), batch.signers, update => {
                onUpdate?.({ ...update, message: message(update.message ? 'transactions.stepWithDetail' : 'transactions.step', { current: index + 1, total: batches.length, detail: update.message }) });
            });
            signatures.push(signature);
        } catch (error) {
            // 已确认的步骤不可回滚，保留签名供用户恢复，不跳过失败步骤。
            throw new AppError(message("transactions.stepNotCompletedConfirmedTransactions", { v0: index + 1, v1: batches.length, v2: signatures.length ? signatures.join(', ') : message('transactions.none'), v3: describeError(error) }));
        }
    }
    return signatures;
}
