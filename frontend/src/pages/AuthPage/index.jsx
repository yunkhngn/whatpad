import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Nav } from 'react-bootstrap';
import { authAPI } from '../../services/api';

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

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                const response = await authAPI.login({
                    username: formData.username,
                    password: formData.password
                });
                localStorage.setItem('authToken', response.token);
                setSuccess('Login successful!');
                // Redirect to home page
                window.location.href = '/';
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    return;
                }
                
                await authAPI.register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
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
                                    />
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
                                        />
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
                                    />
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
                                        />
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