import { Link } from 'react-router-dom';
import './ArticleCard.css';

function ArticleCard({ article, sourceType }) {
    const { id, title_cn, title_en, level, characters, estimated_time, content } = article;

    // 获取文章摘要（前100个字符）
    const summary = content.substring(0, 100).replace(/\n/g, ' ') + '...';

    // 根据等级返回对应的 badge 类名
    const getLevelClass = () => {
        switch (level) {
            case '入门级': return 'badge-entry';
            case '初级': return 'badge-beginner';
            case '中级': return 'badge-intermediate';
            case '高级': return 'badge-advanced';
            default: return 'badge-entry';
        }
    };

    // 根据来源类型返回卡片样式
    const getCardClass = () => {
        if (sourceType === 'teacher') return 'article-card card card-teacher';
        if (sourceType === 'student') return 'article-card card card-student';
        return 'article-card card';
    };

    return (
        <article className={getCardClass()}>
            {/* 来源标签 */}
            {sourceType === 'teacher' && (
                <div className="article-source-badge source-teacher">
                    <span className="source-icon">📚</span>
                    <span>教师推荐</span>
                </div>
            )}
            {sourceType === 'student' && (
                <div className="article-source-badge source-student">
                    <span className="source-icon">✏️</span>
                    <span>我上传的</span>
                </div>
            )}

            <div className="article-card-header">
                <span className={`badge ${getLevelClass()}`}>{level}</span>
                <span className="article-meta">
                    <span className="article-chars">{characters} 字</span>
                    <span className="article-time">⏱️ {estimated_time}</span>
                </span>
            </div>

            <h3 className="article-title-cn">{title_cn}</h3>
            <h4 className="article-title-en">{title_en}</h4>

            <p className="article-summary">{summary}</p>

            <Link to={`/read/${id}`} className="btn btn-primary article-btn">
                开始阅读 →
            </Link>
        </article>
    );
}

export default ArticleCard;
