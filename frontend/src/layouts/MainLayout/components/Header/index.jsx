"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router"
import "./Header.css"
import avatarPlaceholder from '../../../../assests/images/avatar-placeholder.jpg'

function Header() {
    const [searchQuery, setSearchQuery] = useState("")
    const [isUserProfileOpen, setIsUserProfileOpen] = useState(false)
    const [isCategoryOpen, setIsCategoryOpen] = useState(false)
    const navigate = useNavigate()

    const categoryRef = useRef(null)
    const profileRef = useRef(null)

    const categories = ["Romance", "Fantasy", "Mystery", "Horror", "Adventure", "Sci-Fi", "Comedy", "Drama"]

    useEffect(() => {

        const handleClickOutside = (event) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target)) {
                setIsCategoryOpen(false)
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsUserProfileOpen(false)
            }
        }

        document.addEventListener("click", handleClickOutside)
        return () => {
            document.removeEventListener("click", handleClickOutside)
        }
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        console.log("Searching for:", searchQuery)
        // TODO: Implement search functionality
    }

    const handleCategorySelect = (category) => {
        console.log("Selected category:", category)
        setIsCategoryOpen(false)
        // TODO: Implement category filtering
    }

    const handleLogout = () => {
        console.log("User logged out")
        setIsUserProfileOpen(false)
        // TODO: Implement actual logout logic
    }

    const handleProfileClick = () => {
        // navigate("/profile")
        setIsUserProfileOpen(false)
    }

    return (
        <header className="topbar">
            <div className="container">
                <div className="topbar-content">
                    {/* Topbar left */}
                    <div className="topbar-left">
                        <Link to="/" className="site-logo">
                            <h1>Whattpad</h1>
                        </Link>

                        {/* Category section */}
                        <div className="category-dropdown" ref={categoryRef}>
                            <button className="category-button" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
                                <i className="bi bi-list category-icon"></i>
                                Category
                                <i className={`bi bi-chevron-down chevron-icon ${isCategoryOpen ? "open" : ""}`}></i>
                            </button>
                            {isCategoryOpen && (
                                <div className="category-menu">
                                    {categories.map((category) => (
                                        <button key={category} className="category-item" onClick={() => handleCategorySelect(category)}>
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search section */}
                        <form onSubmit={handleSearch} className="search-form">
                            <div className="search-input-wrapper">
                                <i className="bi bi-search search-icon"></i>
                                <input
                                    type="text"
                                    placeholder="Search stories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Topbar right */}
                    <div className="topbar-right">
                        <button className="btn btn-create">Create Story</button>

                        {/* Profile menu */}
                        <div className="user-profile" ref={profileRef}>
                            <button className="profile-button" onClick={() => setIsUserProfileOpen(!isUserProfileOpen)}>
                                <img src={avatarPlaceholder} alt="User Avatar" className="user-avatar" />
                                <i className="bi bi-chevron-down dropdown-icon"></i>
                            </button>

                            {isUserProfileOpen && (
                                <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={handleProfileClick}>
                                        My Profile
                                    </button>
                                    <button className="dropdown-item" onClick={handleLogout}>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
