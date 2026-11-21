import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Keypair, type Connection } from '@solana/web3.js';
import { getMint, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';
import { buildMintTransaction, buildTransferTransaction, buildBurnTransaction, buildFreezeTransaction } from './tokens';
vi.mock('@solana/spl-token', async importOriginal => ({ ...await importOriginal<typeof import('@solana/spl-token')>(), getMint: vi.fn(), getAccount: vi.fn() }));

const mint = Keypair.generate().publicKey;
const owner = Keypair.generate().publicKey;
const recipient = Keypair.generate().publicKey;
const connection = {} as Connection;

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getMint).mockResolvedValue({ decimals: 6, mintAuthority: owner } as Awaited<ReturnType<typeof getMint>>);
    vi.mocked(getAccount).mockResolvedValue({ amount: 10000000n, isFrozen: false } as Awaited<ReturnType<typeof getAccount>>);
});

describe('SPL Token 指令构造', () => {
    it('增发到首次接收者，同时创建幂等 ATA', async () => {
        const tx = await buildMintTransaction(connection, mint, owner, recipient, '1.000001');
        expect(tx.instructions).toHaveLength(2);
        expect(tx.instructions[0].data[0]).toBe(1); // ATA CreateIdempotent
        expect(tx.instructions[1].data[0]).toBe(14); // MintToChecked
        expect(tx.instructions[1].data.readBigUInt64LE(1)).toBe(1000001n);
        expect(tx.instructions[1].data[9]).toBe(6);
        expect(getAccount).not.toHaveBeenCalled(); // 接收 ATA 不必预先存在
    });
    it('权限错误时不生成增发指令', async () => {
        vi.mocked(getMint).mockResolvedValueOnce({ decimals: 6, mintAuthority: null } as Awaited<ReturnType<typeof getMint>>);
        await expect(buildMintTransaction(connection, mint, owner, recipient, '1')).rejects.toThrow('tokens.thisWalletHasNoMintAuthority');
    });
    it('支持零精度转账并校验余额', async () => {
        vi.mocked(getMint).mockResolvedValueOnce({ decimals: 0 } as Awaited<ReturnType<typeof getMint>>);
        const tx = await buildTransferTransaction(connection, mint, owner, recipient, '3');
        expect(tx.instructions[1].data.readBigUInt64LE(1)).toBe(3n);
        expect(tx.instructions[1].data[9]).toBe(0);
        await expect(buildTransferTransaction(connection, mint, owner, recipient, '11')).rejects.toThrow('tokens.amountExceedsTheSendingAtaBalanceTheListAggregates');
    });
    it('销毁使用实际精度并拒绝冻结账户', async () => {
        const tx = await buildBurnTransaction(connection, mint, owner, '0.000001');
        expect(tx.instructions[0].data[0]).toBe(15); // BurnChecked
        expect(tx.instructions[0].data.readBigUInt64LE(1)).toBe(1n);
        vi.mocked(getAccount).mockResolvedValueOnce({ amount: 100n, isFrozen: true } as Awaited<ReturnType<typeof getAccount>>);
        await expect(buildBurnTransaction(connection, mint, owner, '0.000001')).rejects.toThrow('tokens.ataIsFrozenThawItFirst');
    });
    it('冻结与解冻使用目标钱包 ATA，并校验状态', async () => {
        vi.mocked(getMint).mockResolvedValue({ freezeAuthority: owner } as Awaited<ReturnType<typeof getMint>>);
        vi.mocked(getAccount).mockResolvedValue({ mint, owner: recipient, isFrozen: false } as Awaited<ReturnType<typeof getAccount>>);
        const tx = await buildFreezeTransaction(connection, mint, owner, recipient, false);
        expect(tx.instructions).toHaveLength(1);
        expect(tx.instructions[0].data[0]).toBe(10);
        await expect(buildFreezeTransaction(connection, mint, owner, recipient, true)).rejects.toThrow('tokens.targetAtaIsNotFrozen');
        vi.mocked(getAccount).mockResolvedValue({ mint, owner: recipient, isFrozen: true } as Awaited<ReturnType<typeof getAccount>>);
        expect((await buildFreezeTransaction(connection, mint, owner, recipient, true)).instructions[0].data[0]).toBe(11);
        await expect(buildFreezeTransaction(connection, mint, owner, recipient, false)).rejects.toThrow('tokens.targetAtaIsAlreadyFrozen');
    });
    it('仅账户不存在时创建冻结 ATA，RPC 错误不伪装成不存在', async () => {
        vi.mocked(getMint).mockResolvedValue({ freezeAuthority: owner } as Awaited<ReturnType<typeof getMint>>);
        vi.mocked(getAccount).mockRejectedValue(new TokenAccountNotFoundError());
        const tx = await buildFreezeTransaction(connection, mint, owner, recipient, false);
        expect(tx.instructions.map(instruction => instruction.data[0])).toEqual([1, 10]);
        await expect(buildFreezeTransaction(connection, mint, owner, recipient, true)).rejects.toThrow('FreezeToken.targetAtaDoesNotExist');
        vi.mocked(getAccount).mockRejectedValue(new Error('RPC 429'));
        await expect(buildFreezeTransaction(connection, mint, owner, recipient, false)).rejects.toThrow('RPC 429');
    });
    it('冻结拒绝错误权限与不匹配的账户', async () => {
        await expect(buildFreezeTransaction(connection, mint, owner, recipient, false)).rejects.toThrow('tokens.thisWalletHasNoFreezeThawAuthority');
        expect(getAccount).not.toHaveBeenCalled();
        vi.mocked(getMint).mockResolvedValue({ freezeAuthority: owner } as Awaited<ReturnType<typeof getMint>>);
        vi.mocked(getAccount).mockResolvedValue({ mint, owner, isFrozen: false } as Awaited<ReturnType<typeof getAccount>>);
        await expect(buildFreezeTransaction(connection, mint, owner, recipient, false)).rejects.toThrow('tokens.targetAtaDoesNotMatchTheMintOwner');
        vi.mocked(getAccount).mockResolvedValue({ mint: owner, owner: recipient, isFrozen: false } as Awaited<ReturnType<typeof getAccount>>);
        await expect(buildFreezeTransaction(connection, mint, owner, recipient, false)).rejects.toThrow('tokens.targetAtaDoesNotMatchTheMintOwner');
    });
    it('拒绝超精度与非法金额', async () => {
        await expect(buildMintTransaction(connection, mint, owner, recipient, '0.0000001')).rejects.toThrow('amounts.amountSupportsAtMostDecimalPlaces');
        await expect(buildBurnTransaction(connection, mint, owner, '-1')).rejects.toThrow();
    });
});
