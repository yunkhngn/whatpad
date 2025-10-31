import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Nav } from 'react-bootstrap';
import { loginUser, registerUser } from '../../services/api';

// Input validation utilities
const validateUsername = (username) => {
    if (!username || username.length < 3) {
        return 'Username must be at least 3 characters';
    }
    if (username.length > 30) {
        return 'Username must be less than 30 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
};

const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }
    return null;
};

const validatePassword = (password) => {
    if (!password || password.length < 6) {
        return 'Password must be at least 6 characters';
    }
    if (password.length > 100) {
        return 'Password must be less than 100 characters';
    }
    return null;
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
    if (!input) return '';
    return input.trim().replace(/[<>]/g, '');
};

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInput(value);
        
        setFormData({
            ...formData,
            [name]: sanitizedValue
        });

        // Clear validation error for this field
        setValidationErrors({
            ...validationErrors,
            [name]: null
        });
    };

    const validateForm = () => {
        const errors = {};

        // Validate username
        const usernameError = validateUsername(formData.username);
        if (usernameError) errors.username = usernameError;

        // Validate email (only for registration)
        if (!isLogin) {
            const emailError = validateEmail(formData.email);
            if (emailError) errors.email = emailError;
        }

        // Validate password
        const passwordError = validatePassword(formData.password);
        if (passwordError) errors.password = passwordError;

        // Validate confirm password (only for registration)
        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate form before submission
        if (!validateForm()) {
            setLoading(false);
            setError('Please fix the validation errors');
            return;
        }

        try {
            if (isLogin) {
                const response = await loginUser({
                    username: sanitizeInput(formData.username),
                    password: formData.password // Don't sanitize password
                });
                
                // Save token to localStorage
                if (response.token) {
                    localStorage.setItem('authToken', response.token);
                    console.log('Token saved:', response.token);
                    // Dispatch custom event to notify components about login
                    window.dispatchEvent(new Event('userLogin'))
                }
                
                setSuccess('Login successful!');
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                await registerUser({
                    username: sanitizeInput(formData.username),
                    email: sanitizeInput(formData.email),
                    password: formData.password // Don't sanitize password
                });
                setSuccess('Registration successful! Please login.');
                setIsLogin(true);
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card>
                        <Card.Header>
                            <Nav variant="pills" className="justify-content-center">
                                <Nav.Item>
                                    <Nav.Link 
                                        active={isLogin} 
                                        onClick={() => setIsLogin(true)}
                                    >
                                        Login
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        active={!isLogin} 
                                        onClick={() => setIsLogin(false)}
                                    >
                                        Register
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter username"
                                        isInvalid={!!validationErrors.username}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.username}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {!isLogin && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter email"
                                            isInvalid={!!validationErrors.email}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {validationErrors.email}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter password"
                                        isInvalid={!!validationErrors.password}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.password}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                {!isLogin && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Confirm Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Confirm password"
                                            isInvalid={!!validationErrors.confirmPassword}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {validationErrors.confirmPassword}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                )}

                                <div className="d-grid">
                                    <Button 
                                        variant="primary" 
                                        type="submit" 
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AuthPage;