import { create } from '../../i18n/testRenderer';
import React, { createElement, useState } from 'react';
import { act} from 'react-test-renderer';
import { describe, expect, it } from 'vitest';
import { courseOrder, lessonById, lessons, legacyLessonIds } from './curriculum';
import { KeepLesson } from './LearningContext';
import { validAmount } from './amountValidation';

 describe('课程结构与精确输入', () => {
    it('九个功能有唯一 ID、目标、准备、原理与核对项', () => {
        expect(new Set(lessons.map(item => item.id)).size).toBe(9);
        expect(new Set(courseOrder).size).toBe(10);
        for (const lesson of lessons) {
            expect(courseOrder).toContain(lesson.id);
            expect(lesson.goal.length).toBeGreaterThan(5);
            expect(lesson.prepare.length).toBeGreaterThan(5);
            expect(lesson.concepts.length).toBeGreaterThan(0);
            expect(lesson.checks.length).toBeGreaterThan(0);
            expect(lessonById[lesson.id]).toBe(lesson);
        }
    });
    it('旧资产入口的数字语义不随课程排序变化', () => {
        expect(legacyLessonIds).toEqual(['assets', 'create', 'metadata', 'mint', 'pool', 'burn', 'freeze', 'liquidity', 'swap']);
        expect(courseOrder).toEqual(['overview', 'create', 'metadata', 'mint', 'assets', 'freeze', 'burn', 'pool', 'liquidity', 'swap']);
    });
    it('隐藏课程退出可访问树，但不卸载表单状态', () => {
        function Draft() {
            const [value, setValue] = useState('');
            return <input value={value} onChange={event => setValue(event.target.value)} />;
        }
        const view = create(<KeepLesson active><Draft /></KeepLesson>);
        act(() => { view.root.findByType('input').props.onChange({ target: { value: '0.000000001' } }); });
        act(() => { view.update(<KeepLesson active={false}><Draft /></KeepLesson>); });
        expect(view.root.findByType('div').props.hidden).toBe(true);
        expect(view.root.findByType('div').props.style.display).toBe('none');
        act(() => { view.update(<KeepLesson active><Draft /></KeepLesson>); });
        expect(view.root.findByType('input').props.value).toBe('0.000000001');
        view.unmount();
    });
    it.each(['', '0', '-1', '1e3', '1.', '0.0000000001'])('SOL 非法数量 %s 不可提交', value => {
        expect(validAmount(value, 9)).toBe(false);
    });
    it('大整数及一个最小单位按 bigint 比较，不经过 Number', () => {
        expect(validAmount('18446744073.709551615', 9, '18446744073709551615')).toBe(true);
        expect(validAmount('18446744073.709551615', 9, '18446744073709551614')).toBe(false);
        expect(validAmount('0.000000001', 9, '1')).toBe(true);
    });
});
