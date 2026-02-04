import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VocabProvider } from './context/VocabContext';
import { ArticleProvider } from './context/ArticleContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ReadingPage from './pages/ReadingPage';
import VocabularyPage from './pages/VocabularyPage';
import TeacherPage from './pages/TeacherPage';
import './App.css';

function App() {
    return (
        <ArticleProvider>
            <VocabProvider>
                <Router>
                    <div className="app">
                        <Navbar />
                        <main className="main-content container">
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/read/:id" element={<ReadingPage />} />
                                <Route path="/vocabulary" element={<VocabularyPage />} />
                                <Route path="/teacher" element={<TeacherPage />} />
                            </Routes>
                        </main>
                        <footer className="footer">
                            <div className="container">
                                <p>© 2024 AI 阅读小帮手 | 让中文阅读更简单 🌟</p>
                            </div>
                        </footer>
                    </div>
                </Router>
            </VocabProvider>
        </ArticleProvider>
    );
}

export default App;
