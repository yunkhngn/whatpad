import { BrowserRouter, Route, Routes } from "react-router"
import MainLayout from '../../layouts/MainLayout'
import HomePage from '../../pages/HomePage'
import ReadingPage from '../../pages/ReadingPage'

const AppRouter = () => {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<HomePage />}></Route>
                    <Route path="/read/:id" element={<ReadingPage />}></Route>
                </Routes>
            </MainLayout>
        </BrowserRouter>
    )
}

export default AppRouter