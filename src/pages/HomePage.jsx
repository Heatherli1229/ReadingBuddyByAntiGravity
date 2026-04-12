import { useState, useMemo } from 'react';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import ArticleCard from '../components/ArticleCard';
import SearchFilter from '../components/SearchFilter';
import './HomePage.css';

function HomePage() {
    const { getAllArticles, getArticlesByLevel } = useArticles();
    const { currentUser, isPublicAuthor } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('全部');

    // 过滤文章
    const filteredArticles = useMemo(() => {
        let articles = getAllArticles();

        // Visibility: show public (teacher/admin authored) + own private articles
        articles = articles.filter(a => isPublicAuthor(a.authorId) || (currentUser && a.authorId === currentUser.id));

        // 按等级筛选
        if (selectedLevel && selectedLevel !== '全部') {
            articles = getArticlesByLevel(selectedLevel);
        }

        // 按搜索词筛选
        if (searchQuery) {
            articles = articles.filter(article =>
                article.title_cn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.title_en.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return articles;
    }, [searchQuery, selectedLevel, getAllArticles, getArticlesByLevel, currentUser]);

    return (
        <div className="home-page">
            <header className="home-header">
                <h1 className="home-title">
                    今天想读点什么？ 📖
                </h1>
                <p className="home-subtitle">
                    选择一篇适合你的中文文章，开始阅读之旅
                </p>
            </header>

            <SearchFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
            />

            {filteredArticles.length === 0 ? (
                <div className="no-results">
                    <span className="no-results-icon">🔍</span>
                    <h3>没有找到文章</h3>
                    <p>试试其他关键词或筛选条件</p>
                </div>
            ) : (
                <div className="articles-grid">
                    {filteredArticles.map(article => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default HomePage;
