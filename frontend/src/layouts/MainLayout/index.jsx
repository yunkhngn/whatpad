import Header from "./components/Header"
import Footer from "../components/Footer"

function MainLayout({ children }) {
    return (
        <div className="layout-wrapper">
            <Header />
            <main className="main-content">{children}</main>
            <Footer />
        </div>
    )
}

export default MainLayout