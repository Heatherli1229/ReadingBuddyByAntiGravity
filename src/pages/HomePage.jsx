import { useState, useMemo } from 'react';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import ArticleCard from '../components/ArticleCard';
import SearchFilter from '../components/SearchFilter';
import './HomePage.css';

function HomePage() {
    const { getAllArticles, getArticlesByLevel } = useArticles();
    const { currentUser, isPublicAuthor, users } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('全部');
    const [selectedSource, setSelectedSource] = useState('全部');

    // 判断文章来源类型：teacher 或 student
    const getSourceType = (article) => {
        if (!currentUser) return 'teacher';
        if (isPublicAuthor(article.authorId, article.authorRole)) return 'teacher';
        if (currentUser && article.authorId === currentUser.id) return 'student';
        return null;
    };

    // 过滤文章
    const filteredArticles = useMemo(() => {
        let articles = getAllArticles();

        // Visibility: show public (teacher/admin authored) + own private articles
        articles = articles.filter(a => isPublicAuthor(a.authorId, a.authorRole) || (currentUser && a.authorId === currentUser.id));

        // 按来源筛选
        if (selectedSource && selectedSource !== '全部') {
            if (selectedSource === 'teacher') {
                articles = articles.filter(a => isPublicAuthor(a.authorId, a.authorRole));
            } else if (selectedSource === 'student') {
                articles = articles.filter(a => currentUser && a.authorId === currentUser.id);
            }
        }

        // 按等级筛选
        if (selectedLevel && selectedLevel !== '全部') {
            articles = articles.filter(a => a.level === selectedLevel);
        }

        // 按搜索词筛选
        if (searchQuery) {
            articles = articles.filter(article =>
                article.title_cn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.title_en.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return articles;
    }, [searchQuery, selectedLevel, selectedSource, getAllArticles, currentUser, isPublicAuthor]);

    // 已登录的学生才显示来源筛选（教师和管理员不需要区分自己的文章）
    const showSourceFilter = !!(currentUser && currentUser.role === 'student');

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
                selectedSource={selectedSource}
                onSourceChange={setSelectedSource}
                showSourceFilter={showSourceFilter}
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
                        <ArticleCard
                            key={article.id}
                            article={article}
                            sourceType={currentUser ? getSourceType(article) : 'teacher'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default HomePage;
