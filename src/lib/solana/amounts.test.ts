import { describe,expect,it } from 'vitest';
import { MAX_U64,formatTokenAmount,parseTokenAmount,positiveTokenAmount } from './amounts';

describe('精确代币金额', () => {
    it.each([0, 6, 9])('支持 %i 位精度的往返转换', decimals => {
        const input = decimals ? '123.000001' : '123';
        expect(formatTokenAmount(parseTokenAmount(input, decimals), decimals)).toBe(input);
    });
    it('大整数不经过浮点数', () => {
        expect(parseTokenAmount('9007199254.740993', 6)).toBe(9007199254740993n);
        expect(parseTokenAmount(MAX_U64.toString(), 0)).toBe(MAX_U64);
    });
    it.each(['', '-1', 'NaN', 'Infinity', '1e3', ' 1 ', '.1', '1.'])('拒绝非法金额 %s', input => {
        expect(() => parseTokenAmount(input, 9)).toThrow();
    });
    it('拒绝超精度、溢出和零业务金额', () => {
        expect(() => parseTokenAmount('0.0000001', 6)).toThrow();
        expect(() => parseTokenAmount((MAX_U64 + 1n).toString(), 0)).toThrow();
        expect(() => positiveTokenAmount('0', 9)).toThrow();
        expect(parseTokenAmount('0', 0)).toBe(0n);
    });
    it('校验 decimals 并格式化前导零', () => {
        expect(formatTokenAmount(1n, 9)).toBe('0.000000001');
        expect(formatTokenAmount(1000000n, 6)).toBe('1');
        expect(() => parseTokenAmount('1', -1)).toThrow();
        expect(() => parseTokenAmount('1', 1.5)).toThrow();
    });
});
