import React from "react"
import { useNavigate } from "react-router"
import { Card } from "react-bootstrap"
import bookCoverPlaceholder from '../../assests/images/book-cover-placeholder.png'
import './StoryCard.css'

const StoryCard = ({ story, showProgress = false, progress = 0 }) => {
    const navigate = useNavigate()

    const handleClick = () => {
        navigate(`/story/${story.id}`)
    }

    return (
        <Card
            className="story-card"
            onClick={handleClick}
        >
            <div className="story-cover">
                <Card.Img
                    variant="top"
                    src={story.cover_url || bookCoverPlaceholder}
                    alt={story.title}
                />
                {showProgress && (
                    <div className="progress-overlay">
                        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                )}
            </div>
            <div className="story-info">
                <h3 className="story-title">{story.title}</h3>
                <p className="story-genre">
                    {story.tags && story.tags.length > 0 ? story.tags[0].name : 'Story'}
                </p>
            </div>
        </Card>
    )
}

export default StoryCard
