import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// 创建生词库上下文
const VocabContext = createContext();

// 按用户 ID 生成独立的 localStorage 键名
const storageKey = (userId) =>
    userId ? `ai-reading-buddy-vocab-${userId}` : null;

// 读取指定用户的生词列表
const loadWords = (userId) => {
    const key = storageKey(userId);
    if (!key) return [];
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// 生词库提供者组件
export function VocabProvider({ children }) {
    const { currentUser } = useAuth();
    const userId = currentUser?.id ?? null;

    // 初始化：从当前用户的 localStorage slot 加载
    const [savedWords, setSavedWords] = useState(() => loadWords(userId));

    // 当用户切换（登录/退出/切换账号）时，重新加载对应用户的生词
    useEffect(() => {
        setSavedWords(loadWords(userId));
    }, [userId]);

    // 当生词列表变化时，保存到对应用户的 localStorage
    useEffect(() => {
        const key = storageKey(userId);
        if (key) {
            localStorage.setItem(key, JSON.stringify(savedWords));
        }
    }, [savedWords, userId]);

    // 添加生词
    const addWord = (word) => {
        setSavedWords(prev => {
            const exists = prev.some(w => w.word === word.word);
            if (exists) return prev;
            return [...prev, { ...word, addedAt: Date.now() }];
        });
    };

    // 移除生词
    const removeWord = (wordText) => {
        setSavedWords(prev => prev.filter(w => w.word !== wordText));
    };

    // 检查生词是否已保存
    const isWordSaved = (wordText) => {
        return savedWords.some(w => w.word === wordText);
    };

    // 获取随机生词（用于练习模式）
    const getRandomWords = (count = 1) => {
        const shuffled = [...savedWords].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    // 清空所有生词
    const clearAllWords = () => {
        setSavedWords([]);
    };

    const value = {
        savedWords,
        addWord,
        removeWord,
        isWordSaved,
        getRandomWords,
        clearAllWords,
        wordCount: savedWords.length
    };

    return (
        <VocabContext.Provider value={value}>
            {children}
        </VocabContext.Provider>
    );
}

// 自定义 Hook 使用生词库
export function useVocab() {
    const context = useContext(VocabContext);
    if (!context) {
        throw new Error('useVocab must be used within a VocabProvider');
    }
    return context;
}

export default VocabContext;

