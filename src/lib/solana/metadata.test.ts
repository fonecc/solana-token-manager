import { describe, expect, it } from 'vitest';
import { normalizeUri, validateMetadata } from './metadata';

describe('元数据验证', () => {
    it('按 UTF-8 字节而不是字符数限制名称', () => {
        expect(() => validateMetadata('教程代币', 'LEARN', '')).not.toThrow();
        expect(() => validateMetadata('币'.repeat(11), 'LEARN', '')).toThrow('metadata.nameIsRequiredAndMustNotExceed32Bytes');
        expect(() => validateMetadata('Token', '币'.repeat(4), '')).toThrow('metadata.symbolIsRequiredAndMustNotExceed10Bytes');
    });
    it('统一 IPFS URI 并去除链上填充字符', () => {
        expect(normalizeUri('ipfs://ipfs/example/metadata.json\0')).toBe('https://ipfs.io/ipfs/example/metadata.json');
        expect(() => normalizeUri('javascript:alert(1)')).toThrow();
        expect(() => normalizeUri('file:///secret')).toThrow();
    });
    it('URI 可选但不接受无效方案或超长内容', () => {
        expect(() => validateMetadata('Token', 'TKN', '')).not.toThrow();
        expect(() => validateMetadata('Token', 'TKN', 'data:application/json,{}')).toThrow();
        expect(() => validateMetadata('Token', 'TKN', `https://example.com/${'a'.repeat(200)}`)).toThrow('metadata.uriMustNotExceed200Bytes');
    });
});
