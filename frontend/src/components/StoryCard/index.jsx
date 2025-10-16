import React from "react"
import { useNavigate } from "react-router"
import { Card, Badge, ProgressBar } from "react-bootstrap"
import bookCoverPlaceholder from '../../assests/images/book-cover-placeholder.png'

const StoryCard = ({ story, showProgress = false, progress = 0 }) => {
    const navigate = useNavigate()

    const handleClick = () => {
        navigate(`/story/${story.id}`)
    }

    return (
        <Card 
            className="h-100 story-card" 
            onClick={handleClick}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
            <div style={{ position: 'relative' }}>
                <Card.Img 
                    variant="top" 
                    src={story.cover_url || bookCoverPlaceholder} 
                    alt={story.title}
                    style={{ 
                        height: '200px', 
                        objectFit: 'cover',
                        backgroundColor: '#f8f9fa'
                    }}
                />
                {showProgress && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                        <ProgressBar 
                            now={progress} 
                            variant="success"
                            style={{ height: '4px', borderRadius: 0 }}
                        />
                    </div>
                )}
            </div>
            
            <Card.Body className="d-flex flex-column">
                <Card.Title className="mb-2" style={{ fontSize: '1rem', lineHeight: '1.2' }}>
                    {story.title}
                </Card.Title>
                
                <Card.Text className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>
                    by {story.author_name || story.username || 'Unknown'}
                </Card.Text>
                
                {story.description && (
                    <Card.Text 
                        className="text-muted mb-2" 
                        style={{ 
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}
                    >
                        {story.description}
                    </Card.Text>
                )}
                
                <div className="mt-auto">
                    {/* Tags */}
                    {story.tags && story.tags.length > 0 && (
                        <div className="mb-2">
                            {story.tags.slice(0, 2).map(tag => (
                                <Badge 
                                    key={tag.id || tag.name} 
                                    bg="secondary" 
                                    className="me-1"
                                    style={{ fontSize: '0.7rem' }}
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                    
                    {/* Stats */}
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                        <span>{story.chapters_count || 0} chapters</span>
                        <span>{story.status || 'draft'}</span>
                    </div>
                </div>
            </Card.Body>
        </Card>
    )
}

export default StoryCard
