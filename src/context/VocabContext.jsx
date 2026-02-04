import { createContext, useContext, useState, useEffect } from 'react';

// 创建生词库上下文
const VocabContext = createContext();

// 本地存储的键名
const STORAGE_KEY = 'ai-reading-buddy-vocab';

// 生词库提供者组件
export function VocabProvider({ children }) {
    // 从 LocalStorage 加载初始数据
    const [savedWords, setSavedWords] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // 当生词列表变化时，保存到 LocalStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWords));
    }, [savedWords]);

    // 添加生词
    const addWord = (word) => {
        setSavedWords(prev => {
            // 检查是否已存在
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
