import { getLevels } from '../data/articles';
import './SearchFilter.css';

function SearchFilter({ searchQuery, onSearchChange, selectedLevel, onLevelChange, selectedSource, onSourceChange, showSourceFilter }) {
    const levels = getLevels();

    return (
        <div className="search-filter">
            {/* 搜索框 */}
            <div className="search-filter-row">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="搜索文章标题..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => onSearchChange('')}
                            aria-label="清除搜索"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* 等级筛选 */}
                <div className="level-filter">
                    {levels.map(level => (
                        <button
                            key={level}
                            className={`level-btn ${selectedLevel === level ? 'active' : ''}`}
                            onClick={() => onLevelChange(level)}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* 来源筛选 */}
            {showSourceFilter && (
                <div className="source-filter-row">
                    <span className="source-filter-label">📂 文章来源</span>
                    <div className="source-filter">
                        <button
                            className={`source-btn ${!selectedSource || selectedSource === '全部' ? 'active' : ''}`}
                            onClick={() => onSourceChange('全部')}
                        >
                            全部
                        </button>
                        <button
                            className={`source-btn source-btn-teacher ${selectedSource === 'teacher' ? 'active active-teacher' : ''}`}
                            onClick={() => onSourceChange('teacher')}
                        >
                            <span>📚</span> 教师文章
                        </button>
                        <button
                            className={`source-btn source-btn-student ${selectedSource === 'student' ? 'active active-student' : ''}`}
                            onClick={() => onSourceChange('student')}
                        >
                            <span>✏️</span> 我的文章
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchFilter;
