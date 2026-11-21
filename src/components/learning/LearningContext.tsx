import React, { createContext, useContext, useEffect, useRef } from 'react';
import type { LessonId } from './curriculum';

export interface LessonDestination { poolId?: string; }
interface LearningContextValue {
    selectedMint: string;
    navigate: (id: LessonId, mint?: string, destination?: LessonDestination) => void;
    startOperation?: (token: symbol, lesson: LessonId) => boolean;
    finishOperation?: (token: symbol) => void;
    operationActive?: boolean;
}
export const LearningContext = createContext<LearningContextValue>({ selectedMint: '', navigate: () => undefined });
export const useLearning = () => useContext(LearningContext);

// 同步防护覆盖准备指令阶段；不代替执行器的网络校验、签名锁或 pending 保护。
export function useWorkspaceOperation(lesson: LessonId) {
    const { startOperation, finishOperation } = useLearning();
    const token = useRef(Symbol(lesson));
    const held = useRef(false);
    useEffect(() => {
        const owner = token.current;
        return () => { finishOperation?.(owner); };
    }, [finishOperation]);
    return {
        begin: () => {
            if (held.current || (startOperation && !startOperation(token.current, lesson))) return false;
            held.current = true;
            return true;
        },
        end: () => { held.current = false; finishOperation?.(token.current); },
    };
}
export function KeepLesson({ active, children }: { active: boolean; children: React.ReactNode }) {
    return <div hidden={!active} style={{ display: active ? undefined : 'none' }}>{children}</div>;
}
