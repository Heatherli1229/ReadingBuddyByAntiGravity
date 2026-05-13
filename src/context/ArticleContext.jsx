import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const ArticleContext = createContext();

export function ArticleProvider({ children }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    // Listen to articles in Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'articles'), (snapshot) => {
            if (snapshot.empty) {
                // If database is empty, seed it with the default articles
                import('../data/articles').then(module => {
                    const initialArticles = module.articles;
                    initialArticles.forEach(async (article) => {
                        await setDoc(doc(db, 'articles', article.id.toString()), article);
                    });
                });
            } else {
                const loaded = [];
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    // 兼容旧文章：如果缺少 authorRole，根据 authorId 推断
                    if (!data.authorRole && data.authorId === 'teacher') {
                        data.authorRole = 'teacher';
                    }
                    // 兼容旧文章：如果缺少 createdAt，用 id 推算一个早期时间戳（种子文章排在最后）
                    if (!data.createdAt) {
                        data.createdAt = typeof data.id === 'number' ? data.id * 1000 : 0;
                    }
                    loaded.push({ id: isNaN(parseInt(docSnap.id, 10)) ? docSnap.id : parseInt(docSnap.id, 10), ...data });
                });
                // 按 createdAt 降序排列（最新的在最前）
                loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setArticles(loaded);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const getAllArticles = () => articles;

    const getArticleById = (id) => articles.find(article => article.id === parseInt(id) || article.id === id);

    const getArticlesByLevel = (level) => {
        if (!level || level === '全部') return articles;
        return articles.filter(article => article.level === level);
    };

    const addArticle = async (article) => {
        const newId = articles.length > 0 ? Math.max(0, ...articles.map(a => typeof a.id === 'number' ? a.id : 0)) + 1 : 1;
        const newArticle = {
            ...article,
            id: newId,
            authorId: currentUser ? currentUser.id : 'teacher',
            authorRole: currentUser ? currentUser.role : 'teacher',
            createdAt: Date.now(),
            characters: article.content ? article.content.length : 0,
            estimated_time: article.content ? `${Math.ceil(article.content.length / 100)}分钟` : '0分钟'
        };
        await setDoc(doc(db, 'articles', newId.toString()), newArticle);
        return newArticle;
    };

    const updateArticle = async (id, updates) => {
        const updated = { ...updates };
        if (updates.content) {
            updated.characters = updates.content.length;
            updated.estimated_time = `${Math.ceil(updates.content.length / 100)}分钟`;
        }
        await updateDoc(doc(db, 'articles', id.toString()), updated);
    };

    const deleteArticle = async (id) => {
        await deleteDoc(doc(db, 'articles', id.toString()));
    };

    const resetToDefault = () => {
        // Just delete all and it will re-seed
        articles.forEach(async (a) => {
            await deleteDoc(doc(db, 'articles', a.id.toString()));
        });
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
            {!loading && children}
        </ArticleContext.Provider>
    );
}

export function useArticles() {
    const context = useContext(ArticleContext);
    if (!context) {
        throw new Error('useArticles must be used within an ArticleProvider');
    }
    return context;
}

export default ArticleContext;
