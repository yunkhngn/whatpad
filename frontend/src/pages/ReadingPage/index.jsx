"use client"
import { useParams, useNavigate } from "react-router"
import { getStoryById } from "../../services/api"
import Button from "../../components/Button"
import styles from "./ReadingPage.module.css"

const ReadingPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const story = getStoryById(id)

    if (!story) {
        return (
            <div className={styles.readingPage}>
                <div className="container">
                    <h2>Story not found</h2>
                    <Button onClick={() => navigate("/")}>Back to Home</Button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.readingPage}>
            <div className="container">
                <div className={styles.backButton}>
                    <Button variant="outline" onClick={() => navigate("/")}>
                        ← Back to Home
                    </Button>
                </div>

                <article className={styles.storyContent}>
                    <header className={styles.storyHeader}>
                        <h1 className={styles.storyTitle}>{story.title}</h1>
                        <p className={styles.storyAuthor}>by {story.author}</p>
                        <div className={styles.storyMeta}>
                            <span className={styles.metaItem}>
                                <i className="icon">👁</i> {story.reads} reads
                            </span>
                            <span className={styles.metaItem}>
                                <i className="icon">⭐</i> {story.votes} votes
                            </span>
                            <span className={styles.metaItem}>
                                <i className="icon">💬</i> {story.comments} comments
                            </span>
                        </div>
                    </header>

                    <div className={styles.storyBody}>
                        <p className={styles.storyDescription}>{story.description}</p>
                        <div className={styles.storyText}>
                            {story.content.split("\n\n").map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>

                    <footer className={styles.storyFooter}>
                        <div className={styles.actionButtons}>
                            <Button variant="primary">⭐ Vote</Button>
                            <Button variant="outline">💬 Comment</Button>
                            <Button variant="outline">📚 Add to Library</Button>
                        </div>
                    </footer>
                </article>
            </div>
        </div>
    )
}

export default ReadingPage
