"use client"
import { useRef } from "react"
import StoryCard from "../StoryCard"
import "./GenreSection.css"

function GenreSection({ title, stories, showProgress = false }) {
    const scrollContainerRef = useRef(null)

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 600
            const newScrollLeft =
                scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: "smooth",
            })
        }
    }

    return (
        <div className="genre-section">
            <div className="genre-header">
                <h2 className="genre-title">{title}</h2>
                <div className="genre-nav-buttons">
                    <button className="nav-button" onClick={() => scroll("left")} aria-label="Previous">
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <button className="nav-button" onClick={() => scroll("right")} aria-label="Next">
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
            <div className="genre-scroll-container" ref={scrollContainerRef}>
                <div className="genre-stories">
                    {stories.map((story) => (
                        <StoryCard
                            key={story.id}
                            story={story}
                            showProgress={showProgress}
                            progress={showProgress ? Math.random() * 100 : 0}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default GenreSection
