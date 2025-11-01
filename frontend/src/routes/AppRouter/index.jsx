import { BrowserRouter, Route, Routes } from "react-router"
import MainLayout from '../../layouts/MainLayout'
import CreateStoryLayout from '../../layouts/CreateStoryLayout'
import HomePage from '../../pages/HomePage'
import ReadingPage from '../../pages/ReadingPage'
import AuthPage from '../../pages/AuthPage'
import StoryDetailPage from '../../pages/StoryDetailPage'
import SearchPage from '../../pages/SearchPage'
import ProfilePage from '../../pages/ProfilePage'
import CreateStoryPage from "../../pages/CreateStoryPage"
import UserStoryPage from "../../pages/UserStoryPage"
import CreateChapterPage from "../../pages/CreateChapterPage"

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Main Layout */}
                <Route path="/" element={
                    <MainLayout>
                        <HomePage />
                    </MainLayout>
                } />

                <Route path="/search" element={
                    <MainLayout>
                        <SearchPage />
                    </MainLayout>
                } />

                <Route path="/auth" element={
                    <MainLayout>
                        <AuthPage />
                    </MainLayout>
                } />

                <Route path="/story/:id" element={
                    <MainLayout>
                        <StoryDetailPage />
                    </MainLayout>
                } />

                <Route path="/read/:chapterId" element={
                    <MainLayout>
                        <ReadingPage />
                    </MainLayout>
                } />

                <Route path="/profile" element={
                    <MainLayout>
                        <ProfilePage />
                    </MainLayout>
                } />

                <Route path="/my-stories" element={
                    <MainLayout>
                        <UserStoryPage />
                    </MainLayout>
                } />

                {/* Create Story Layout */}
                <Route path="/create-story" element={
                    <CreateStoryLayout>
                        <CreateStoryPage />
                    </CreateStoryLayout>
                } />

                <Route path="/stories/:storyId/chapters/:chapterId" element={
                    <CreateStoryLayout>
                        <CreateChapterPage />
                    </CreateStoryLayout>
                } />

            </Routes>
        </BrowserRouter>
    )
}

export default AppRouter