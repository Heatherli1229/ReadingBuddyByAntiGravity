import { getLevels } from '../data/articles';
import './SearchFilter.css';

function SearchFilter({ searchQuery, onSearchChange, selectedLevel, onLevelChange }) {
    const levels = getLevels();

    return (
        <div className="search-filter">
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
    );
}

export default SearchFilter;
