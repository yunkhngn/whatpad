import { BrowserRouter, Route, Routes } from "react-router"
import MainLayout from '../../layouts/MainLayout'
import HomePage from '../../pages/HomePage'
import ReadingPage from '../../pages/ReadingPage'
import UserProfilePage from "../../pages/UserProfilePage"
import StoryPreviewPage from "../../pages/StoryPreviewPage"

const AppRouter = () => {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<UserProfilePage />} />
                    <Route path="/story/:id" element={<StoryPreviewPage />} />
                    <Route path="/story/:id/chapter/:id" element={<ReadingPage />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    )
}

export default AppRouter