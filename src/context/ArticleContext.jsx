import { createContext, useContext, useState, useEffect } from 'react';
import { articles as initialArticles } from '../data/articles';

// 创建文章上下文
const ArticleContext = createContext();

// 本地存储的键名
const STORAGE_KEY = 'ai-reading-buddy-articles';

// 文章提供者组件
export function ArticleProvider({ children }) {
    // 从 LocalStorage 加载初始数据，如果没有则使用默认文章
    const [articles, setArticles] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : initialArticles;
        } catch {
            return initialArticles;
        }
    });

    // 当文章列表变化时，保存到 LocalStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    }, [articles]);

    // 获取所有文章
    const getAllArticles = () => articles;

    // 根据ID获取文章
    const getArticleById = (id) => articles.find(article => article.id === parseInt(id));

    // 根据等级筛选文章
    const getArticlesByLevel = (level) => {
        if (!level || level === '全部') return articles;
        return articles.filter(article => article.level === level);
    };

    // 添加文章
    const addArticle = (article) => {
        const newId = Math.max(0, ...articles.map(a => a.id)) + 1;
        const newArticle = {
            ...article,
            id: newId,
            characters: article.content.length,
            estimated_time: `${Math.ceil(article.content.length / 100)}分钟`
        };
        setArticles(prev => [...prev, newArticle]);
        return newArticle;
    };

    // 更新文章
    const updateArticle = (id, updates) => {
        setArticles(prev => prev.map(article => {
            if (article.id === parseInt(id)) {
                const updated = { ...article, ...updates };
                // 自动更新字数和阅读时间
                if (updates.content) {
                    updated.characters = updates.content.length;
                    updated.estimated_time = `${Math.ceil(updates.content.length / 100)}分钟`;
                }
                return updated;
            }
            return article;
        }));
    };

    // 删除文章
    const deleteArticle = (id) => {
        setArticles(prev => prev.filter(article => article.id !== parseInt(id)));
    };

    // 重置为默认文章
    const resetToDefault = () => {
        setArticles(initialArticles);
    };

    const value = {
        articles,
        getAllArticles,
        getArticleById,
        getArticlesByLevel,
        addArticle,
        updateArticle,
        deleteArticle,
        resetToDefault,
        articleCount: articles.length
    };

    return (
        <ArticleContext.Provider value={value}>
            {children}
        </ArticleContext.Provider>
    );
}

// 自定义 Hook 使用文章上下文
export function useArticles() {
    const context = useContext(ArticleContext);
    if (!context) {
        throw new Error('useArticles must be used within an ArticleProvider');
    }
    return context;
}

export default ArticleContext;
