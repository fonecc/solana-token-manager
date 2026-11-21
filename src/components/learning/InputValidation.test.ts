import { describe, expect, it } from 'vitest';
import { addressError, positiveDecimalError } from './inputValidation';
import { metadataFieldErrors, validateMetadata } from '../../lib/solana/metadata';

describe('就地校验与提交规则一致', () => {
    it.each(['0', '-1', '1e3', '01', '1.', ' 1', 'NaN'])('数量 %s 原样拒绝，不舍入', value => {
        expect(positiveDecimalError(value)).not.toBe('');
    });
    it('未知精度时不武断限制位数；空输入不立即报错', () => {
        expect(positiveDecimalError('0.000000000000000001')).toBe('');
        expect(positiveDecimalError('18446744073709551615')).toBe('');
        expect(positiveDecimalError('')).toBe('');
    });
    it('地址按 PublicKey 校验而非长度猜测', () => {
        expect(addressError('So11111111111111111111111111111111111111112')).toBe('');
        expect(addressError('not-a-mint')).not.toBe('');
        expect(addressError('')).toBe('');
    });
    it.each([
        ['中'.repeat(11), 'LEARN', '', 'name'],
        ['学习币', '中'.repeat(4), '', 'symbol'],
        ['学习币', 'LEARN', 'javascript:alert(1)', 'uri'],
        ['学习币', 'LEARN', 'https://' + 'a'.repeat(201), 'uri'],
    ])('字段错误与 submit 同源 %s', (name, symbol, uri, field) => {
        const errors = metadataFieldErrors(name, symbol, uri);
        expect(errors[field as keyof typeof errors]).not.toBe('');
        expect(() => validateMetadata(name, symbol, uri)).toThrow(errors[field as keyof typeof errors]);
    });
});
