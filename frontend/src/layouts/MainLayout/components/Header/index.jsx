import React, { useState, useEffect, useCallback, useRef } from "react"
import { Navbar, Nav, NavDropdown, Form, Button, Container } from "react-bootstrap"
import { Link, useNavigate } from "react-router"
import { getCurrentUser, getTags } from "../../../../services/api"
import "./Header.css"

function Header() {
    const [user, setUser] = useState(null)
    const [tags, setTags] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
    const navigate = useNavigate()
    const debounceTimerRef = useRef(null)
    const searchWrapperRef = useRef(null)

    useEffect(() => {
        checkAuthStatus()
        fetchTags()
    }, [])

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('authToken')
        if (token) {
            try {
                const response = await getCurrentUser()
                setUser(response.user)
            } catch (err) {
                localStorage.removeItem('authToken')
                setUser(null)
            }
        }
    }

    const fetchTags = async () => {
        try {
            const response = await getTags()
            setTags(response.tags || [])
        } catch (err) {
            console.error('Error fetching tags:', err)
        }
    }

    const fetchSuggestions = useCallback(async (query) => {
        if (!query || query.trim().length < 2) {
            setSuggestions([])
            setShowSuggestions(false)
            setIsLoadingSuggestions(false)
            return
        }

        setIsLoadingSuggestions(true)
        try {
            const response = await fetch(
                `http://localhost:4000/stories?q=${encodeURIComponent(query)}&size=5`
            )
            const data = await response.json()
            setSuggestions(data.data || [])
            setShowSuggestions(true)
        } catch (err) {
            console.error('Error fetching suggestions:', err)
            setSuggestions([])
        } finally {
            setIsLoadingSuggestions(false)
        }
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
            setShowSuggestions(false)
        }
    }

    // Debounced search handler
    const handleSearchInput = useCallback((value) => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            if (value.trim()) {
                fetchSuggestions(value)
            }
        }, 300) // 300ms delay
    }, [fetchSuggestions])

    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        handleSearchInput(value)
    }

    const handleSuggestionClick = (story) => {
        navigate(`/story/${story.id}`)
        setSearchQuery("")
        setSuggestions([])
        setShowSuggestions(false)
    }

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        setUser(null)
        navigate('/')
    }

    return (
        <Navbar bg="white" expand="lg" className="header-wattpad border-bottom">
            <Container fluid className="px-4">
                {/* Logo */}
                <Navbar.Brand as={Link} to="/" className="me-4">
                    <img 
                        src="/Hompage/main_logo.svg" 
                        alt="Whatpad" 
                        height="28"
                        className="d-inline-block align-top"
                    />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="navbar-content" />
                
                <Navbar.Collapse id="navbar-content">
                    {/* Navigation Links */}
                    <Nav className="me-auto">
                        <NavDropdown 
                            title="Browse" 
                            id="browse-dropdown"
                            className="header-dropdown"
                        >
                            <NavDropdown.Item as={Link} to="/">Home</NavDropdown.Item>
                            <NavDropdown.Divider />
                            {tags.slice(0, 10).map(tag => (
                                <NavDropdown.Item 
                                    key={tag.id} 
                                    as={Link} 
                                    to={`/search?tag=${tag.id}`}
                                >
                                    {tag.name}
                                </NavDropdown.Item>
                            ))}
                        </NavDropdown>
                        
                        {/* Search Bar - Moved next to Browse */}
                        <Form className="d-flex search-form ms-3" onSubmit={handleSearch}>
                            <div className="search-wrapper" ref={searchWrapperRef}>
                                <i className="bi bi-search search-icon"></i>
                                <Form.Control
                                    type="search"
                                    placeholder="Search"
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                />
                                {showSuggestions && (
                                    <div className="search-suggestions">
                                        {isLoadingSuggestions ? (
                                            <div className="suggestion-loading">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <span className="ms-2">Searching...</span>
                                            </div>
                                        ) : suggestions.length > 0 ? (
                                            suggestions.map((story) => (
                                                <div
                                                    key={story.id}
                                                    className="suggestion-item"
                                                    onClick={() => handleSuggestionClick(story)}
                                                >
                                                    <div className="suggestion-content">
                                                        {story.cover_url && (
                                                            <img 
                                                                src={story.cover_url} 
                                                                alt={story.title}
                                                                className="suggestion-cover"
                                                            />
                                                        )}
                                                        <div className="suggestion-text">
                                                            <div className="suggestion-title">{story.title}</div>
                                                            <div className="suggestion-author">by {story.author_name}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="suggestion-empty">
                                                <i className="bi bi-search"></i>
                                                <span>No stories found</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Form>
                    </Nav>

                    {/* Right Side Nav */}
                    <Nav className="ms-auto align-items-center">
                        {user ? (
                            <>
                                {/* Write Button */}
                                <Nav.Link as={Link} to="/create-story" className="me-2">
                                    <Button variant="link" className="write-btn">
                                        <i className="bi bi-pencil me-1"></i>
                                        Write
                                    </Button>
                                </Nav.Link>

                                {/* User Avatar Dropdown */}
                                <NavDropdown 
                                    title={
                                        <img 
                                            src={user.avatar_url || '/default-avatar.png'} 
                                            alt="Avatar"
                                            className="user-avatar"
                                        />
                                    } 
                                    id="user-dropdown"
                                    className="user-dropdown"
                                    align="end"
                                >
                                    <NavDropdown.Item as={Link} to="/profile">
                                        Profile
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/my-stories">
                                        My Stories
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/library">
                                        Library
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/messages">
                                        Messages
                                    </NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={handleLogout}>
                                        Logout
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/create-story" className="me-2">
                                    <Button variant="link" className="write-btn">
                                        <i className="bi bi-pencil me-1"></i>
                                        Write
                                    </Button>
                                </Nav.Link>
                                <Nav.Link as={Link} to="/auth">
                                    <Button variant="link" className="login-btn">
                                        Login
                                    </Button>
                                </Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default Header
