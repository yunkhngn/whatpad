import React, { useState, useEffect, useCallback, useRef } from "react"
import { Navbar, Nav, NavDropdown, Form, Button, Container } from "react-bootstrap"
import { Link, useNavigate } from "react-router"
import { authAPI, tagsAPI } from "../../../../services/api"
import "./Header.css"
function Header() {
    const [user, setUser] = useState(null)
    const [tags, setTags] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const navigate = useNavigate()
    const debounceTimerRef = useRef(null)

    useEffect(() => {
        checkAuthStatus()
        fetchTags()
    }, [])

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('authToken')
        if (token) {
            try {
                const response = await authAPI.me()
                setUser(response.user)
            } catch (err) {
                localStorage.removeItem('authToken')
                setUser(null)
            }
        }
    }

    const fetchTags = async () => {
        try {
            const response = await tagsAPI.getAll()
            setTags(response.tags || [])
        } catch (err) {
            console.error('Error fetching tags:', err)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/?q=${encodeURIComponent(searchQuery)}`)
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
                // Optional: Auto-search after delay
                // navigate(`/?q=${encodeURIComponent(value)}`)
            }
        }, 500) // 500ms delay
    }, [])

    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        handleSearchInput(value)
    }

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
                                    to={`/?tag=${tag.id}`}
                                >
                                    {tag.name}
                                </NavDropdown.Item>
                            ))}
                        </NavDropdown>
                        
                        {/* Search Bar - Moved next to Browse */}
                        <Form className="d-flex search-form ms-3" onSubmit={handleSearch}>
                            <div className="search-wrapper">
                                <i className="bi bi-search search-icon"></i>
                                <Form.Control
                                    type="search"
                                    placeholder="Search"
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </Form>
                    </Nav>

                    {/* Right Side Nav */}
                    <Nav className="ms-auto align-items-center">
                        {user ? (
                            <>
                                {/* Write Button */}
                                <Nav.Link as={Link} to="/upload" className="me-2">
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
