import { Keypair,SystemProgram,Transaction,type Connection } from '@solana/web3.js';
import { describe,expect,it,vi } from 'vitest';
import { DEVNET_GENESIS_HASH } from './config';
import { PendingTransactionError,executeInstructionBatches,executeTransaction,type TransactionUpdate } from './transactions';

function setup() {
    const payer = Keypair.generate();
    const connection = {
        getGenesisHash: vi.fn().mockResolvedValue(DEVNET_GENESIS_HASH),
        getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 100 }),
        sendRawTransaction: vi.fn().mockResolvedValue('test-signature'),
        confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
        getSignatureStatuses: vi.fn().mockResolvedValue({ value: [null] })
    };
    const wallet = { publicKey: payer.publicKey, signTransaction: vi.fn(async <T extends Transaction>(tx: T) => { tx.partialSign(payer); return tx; }) };
    const instruction = SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 });
    return { connection, rpc: connection as unknown as Connection, wallet, instruction, tx: new Transaction().add(instruction) };
}

describe('安全交易执行', () => {
    it('使用有效期确认并检查成功状态', async () => {
        const { connection, rpc, wallet, tx } = setup();
        const updates: TransactionUpdate[] = [];
        await expect(executeTransaction(rpc, wallet, tx, [], update => updates.push(update))).resolves.toBe('test-signature');
        expect(connection.confirmTransaction).toHaveBeenCalledWith(expect.objectContaining({ signature: 'test-signature', lastValidBlockHeight: 100 }), 'confirmed');
        expect(connection.sendRawTransaction).toHaveBeenCalledWith(expect.any(Buffer), { skipPreflight: false, preflightCommitment: 'confirmed' });
        expect(updates.at(-1)?.stage).toBe('success');
    });
    it('拒签时不广播', async () => {
        const { connection, rpc, wallet, tx } = setup();
        wallet.signTransaction.mockRejectedValueOnce(new Error('User rejected the request.'));
        await expect(executeTransaction(rpc, wallet, tx)).rejects.toThrow('User rejected');
        expect(connection.sendRawTransaction).not.toHaveBeenCalled();
    });
    it('拒绝主网 RPC 且不请求签名', async () => {
        const { connection, rpc, wallet, tx } = setup();
        connection.getGenesisHash.mockResolvedValue('mainnet');
        await expect(executeTransaction(rpc, wallet, tx)).rejects.toThrow('config.rpcIsNotSolanaDevnetTransactionOrAirdropBlocked');
        expect(wallet.signTransaction).not.toHaveBeenCalled();
    });
    it('支持 Mint / SDK 的额外签名者', async () => {
        const { rpc, wallet } = setup();
        const extra = Keypair.generate();
        const tx = new Transaction().add(SystemProgram.createAccount({ fromPubkey: wallet.publicKey, newAccountPubkey: extra.publicKey, lamports: 1, space: 0, programId: SystemProgram.programId }));
        await executeTransaction(rpc, wallet, tx, [extra]);
        expect(tx.signatures.every(item => item.signature !== null)).toBe(true);
    });
    it('链上 err 不得显示成功', async () => {
        const { connection, rpc, wallet, tx } = setup();
        connection.confirmTransaction.mockResolvedValueOnce({ value: { err: { InstructionError: [0, 'error'] } } });
        await expect(executeTransaction(rpc, wallet, tx)).rejects.toThrow('transactions.onChainExecutionFailed2');
    });
    it('超时但原交易已确认，不再次广播', async () => {
        const { connection, rpc, wallet, tx } = setup();
        connection.confirmTransaction.mockRejectedValueOnce(new Error('timeout'));
        connection.getSignatureStatuses.mockResolvedValueOnce({ value: [{ err: null, confirmationStatus: 'confirmed' }] });
        await expect(executeTransaction(rpc, wallet, tx)).resolves.toBe('test-signature');
        expect(connection.sendRawTransaction).toHaveBeenCalledTimes(1);
        expect(wallet.signTransaction).toHaveBeenCalledTimes(1);
    });
    it('无法确定或过期时保留签名，不盲目重签', async () => {
        const { connection, rpc, wallet, tx } = setup();
        connection.confirmTransaction.mockRejectedValueOnce(new Error('block height exceeded'));
        await expect(executeTransaction(rpc, wallet, tx)).rejects.toBeInstanceOf(PendingTransactionError);
        expect(connection.sendRawTransaction).toHaveBeenCalledTimes(1);
    });
    it('广播响应丢失仍使用本地签名查询', async () => {
        const { connection, rpc, wallet, tx } = setup();
        connection.sendRawTransaction.mockRejectedValueOnce(new Error('network disconnected'));
        await expect(executeTransaction(rpc, wallet, tx)).rejects.toBeInstanceOf(PendingTransactionError);
        expect(connection.getSignatureStatuses).toHaveBeenCalledWith([expect.any(String)], { searchTransactionHistory: true });
    });
    it('多步骤失败后停止，不跳过第二步', async () => {
        const { connection, rpc, wallet, instruction } = setup();
        connection.confirmTransaction.mockResolvedValueOnce({ value: { err: null } }).mockResolvedValueOnce({ value: { err: 'failed' } });
        await expect(executeInstructionBatches(rpc, wallet, Array.from({ length: 3 }, () => ({ instructions: [instruction] })))).rejects.toThrow('transactions.stepNotCompletedConfirmedTransactions');
        expect(connection.sendRawTransaction).toHaveBeenCalledTimes(2);
    });
});


describe('重复提交保护', () => {
    it('待确认交易阻止同一钱包重新签署', async () => {
        const { connection, rpc, wallet, tx, instruction } = setup();
        connection.confirmTransaction.mockRejectedValueOnce(new Error('timeout'));
        await expect(executeTransaction(rpc, wallet, tx)).rejects.toBeInstanceOf(PendingTransactionError);
        await expect(executeTransaction(rpc, wallet, new Transaction().add(instruction))).rejects.toBeInstanceOf(PendingTransactionError);
        expect(wallet.signTransaction).toHaveBeenCalledTimes(1);
        connection.getSignatureStatuses.mockResolvedValueOnce({ value: [{ err: null, confirmationStatus: 'confirmed' }] });
        await expect(executeTransaction(rpc, wallet, new Transaction().add(instruction))).rejects.toThrow('transactions.originalTransactionConfirmedNothingWasResubmittedRefreshBalancesAnd');
        expect(wallet.signTransaction).toHaveBeenCalledTimes(1);
    });
    it('空的 SDK 批次不能当作成功', async () => {
        const { rpc, wallet } = setup();
        await expect(executeInstructionBatches(rpc, wallet, [])).rejects.toThrow('transactions.sdkProducedNoValidTransactionInstructions');
    });
});
