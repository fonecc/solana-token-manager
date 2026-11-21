import { create } from '../../i18n/testRenderer';
import React from 'react';
import { act} from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { LearningContext, useWorkspaceOperation } from './LearningContext';

it('无工作区 Provider 时也阻止同 tick 重复准备，结束后恢复', () => {
    let operation!: ReturnType<typeof useWorkspaceOperation>;
    function Probe() { operation = useWorkspaceOperation('mint'); return null; }
    let view!: ReturnType<typeof create>; act(() => { view = create(<Probe />); });
    expect(operation.begin()).toBe(true); expect(operation.begin()).toBe(false);
    operation.end(); expect(operation.begin()).toBe(true); view.unmount();
});
describe('操作所有权清理', () => {
    it('卸载释放自己的 token，重渲染不误释放；被工作区拒绝时不持有局部锁', () => {
        let operation!: ReturnType<typeof useWorkspaceOperation>;
        function Probe() { operation = useWorkspaceOperation('pool'); return null; }
        const start = vi.fn().mockReturnValueOnce(false).mockReturnValue(true); const finish = vi.fn();
        const value = { selectedMint: '', navigate: vi.fn(), startOperation: start, finishOperation: finish };
        let view!: ReturnType<typeof create>; act(() => { view = create(<LearningContext.Provider value={value}><Probe /></LearningContext.Provider>); });
        expect(operation.begin()).toBe(false); expect(operation.begin()).toBe(true);
        act(() => { view.update(<LearningContext.Provider value={{ ...value, operationActive: true }}><Probe /></LearningContext.Provider>); }); expect(finish).not.toHaveBeenCalled();
        act(() => { view.unmount(); }); expect(finish).toHaveBeenCalledOnce(); expect(finish.mock.calls[0][0]).toBe(start.mock.calls[1][0]);
    });
});
