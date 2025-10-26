import React from 'react'
import { useNavigate } from 'react-router'
import { Card } from 'react-bootstrap'
import bookCoverPlaceholder from '../../assests/images/book-cover-placeholder.png'
import './ContinueReading.css'

const ContinueReading = ({ stories }) => {
    const navigate = useNavigate()

    if (!stories || stories.length === 0) {
        return null
    }

    const handleCardClick = (chapterId) => {
        navigate(`/read/${chapterId}`)
    }

    return (
        <section className="continue-reading-section">
            <div className="container">
                <h2 className="section-title">Continue Reading</h2>
                <div className="stories-container">
                    {stories.map((item) => (
                        <Card 
                            key={item.story_id}
                            className="continue-reading-card" 
                            onClick={() => handleCardClick(item.chapter_id)}
                        >
                            <div className="story-cover">
                                <Card.Img 
                                    variant="top" 
                                    src={item.story_cover_url || bookCoverPlaceholder} 
                                    alt={item.story_title}
                                />
                            </div>
                            <div className="story-info">
                                <h3 className="story-title">{item.story_title}</h3>
                                <p className="story-chapter">Continue: {item.chapter_title}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ContinueReading
