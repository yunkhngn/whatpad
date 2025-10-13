"use client"
import { useNavigate } from "react-router"
import "./StoryCard.css"
import bookCoverPlaceholder from '../../assests/images/book-cover-placeholder.png'

const StoryCard = ({ story, showProgress = false, progress = 0 }) => {
    const navigate = useNavigate()

    const handleClick = () => {
        navigate(`/read/${story.id}`)
    }

    return (
        <div className="story-card" onClick={handleClick}>
            <div className="story-cover">
                <img src={story.coverImage || bookCoverPlaceholder} alt={story.title} />
                {showProgress && (
                    <div className="progress-overlay">
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>
            <div className="story-info">
                <h4 className="story-title">{story.title}</h4>
                <p className="story-genre">{story.genre || "Fiction"}</p>
            </div>
        </div>
    )
}

export default StoryCard
