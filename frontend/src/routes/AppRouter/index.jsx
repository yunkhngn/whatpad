import { BrowserRouter, Route, Routes } from "react-router"
import MainLayout from '../../layouts/MainLayout'
import HomePage from '../../pages/HomePage'
import ReadingPage from '../../pages/ReadingPage'
import AuthPage from '../../pages/AuthPage'
import StoryDetailPage from '../../pages/StoryDetailPage'
import SearchPage from '../../pages/SearchPage'

const AppRouter = () => {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<HomePage />}></Route>
                    <Route path="/search" element={<SearchPage />}></Route>
                    <Route path="/auth" element={<AuthPage />}></Route>
                    <Route path="/story/:id" element={<StoryDetailPage />}></Route>
                    <Route path="/read/:chapterId" element={<ReadingPage />}></Route>
                </Routes>
            </MainLayout>
        </BrowserRouter>
    )
}

export default AppRouter