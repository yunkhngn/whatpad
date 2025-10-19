"use client"
import { useNavigate } from "react-router"
import { useEffect, useState } from "react"
import styles from "./ReadingPage.module.css"
import Button from "../../components/Button"
import { getChapterById } from "../../services/api"
import UserImage from "../../components/UserImage"
import avatarPlaceholder from '../../assests/images/avatar-placeholder.jpg'

const currentUser = {}
const comments = [
    {
        id: 1,
        user: 'Jonathan',
        rating: '4',
        title: 'Good',
        content: 'i like this story',
        createAt: '14/10/2025'
    },
    {
        id: 2,
        user: 'Bob',
        rating: '4',
        title: 'Good',
        content: 'i like this story',
        createAt: '14/10/2025'
    },
    {
        id: 3,
        user: 'Mary',
        rating: '4',
        title: 'Good',
        content: 'i like this story',
        createAt: '14/10/2025'
    },
]

const ReadingPage = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const [chapter, setChapter] = useState({})
    const [commentInput, setCommentInput] = useState('')

    const pathname = window.location.pathname;
    const parts = pathname.split('/');
    const infoFromPath = {
        storyId: parts[2],
        chapterId: parts[4]
    }
    const navigate = useNavigate()

    useEffect(() => {
        async function getChapter() {
            const chapter = await getChapterById(infoFromPath.chapterId)
            setChapter(chapter)
        }
        getChapter()
    }, [])

    if (!chapter) return (
        <div className={styles.readingPage}>
            <div className="container">
                <h2>Story not found</h2>
                <Button onClick={() => navigate("/")}>Back to Home</Button>
            </div>
        </div>
    )


    return (
        <div className={styles.readingPage}>
            {/* Chapter comment */}
            <article className={styles.section}>
                <header className={styles.storyHeader}>
                    <h1 className={styles.storyTitle}>{chapter.title}</h1>
                </header>

                <div className={styles.storyBody}>
                    <div className={styles.storyText}>
                        {chapter.content}
                    </div>
                </div>

                <footer className={styles.storyFooter}>
                    <button className={styles.button}>
                        <i className="bi bi-chevron-left" />
                        Previouse chapter
                    </button>
                    <button className={styles.button}>
                        Next chapter
                        <i className="bi bi-chevron-right" />
                    </button>
                </footer>
            </article>

            {/* Chapter comment */}
            <article className={styles.section}>
                <h3 className="mb-3">Comments</h3>

                <div className={styles.userComment}>
                    <UserImage
                        size="sm"
                        src={currentUser.avatar_url || avatarPlaceholder}
                        alt={currentUser.name} />
                    <input
                        type="text"
                        className={styles.commentInput}
                        placeholder="Add your review here"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)} />
                </div>

                <ul className="list-unstyled">
                    {comments.map(comment => <li key={comment.id} className={styles.commentItem}>
                        <div className={styles.userInfo}>
                            <UserImage size="sm" src={comment.userAvatar || avatarPlaceholder} alt={comment.user} />
                            <div className={styles.userDetail}>
                                <p className={styles.userName}>{comment.user}</p>
                                <p className={styles.commentDate}>{comment.createAt}</p>
                            </div>
                        </div>
                        <div>
                            {comment.content}
                        </div>
                    </li>)}
                </ul>
            </article>
        </div>
    )
}

export default ReadingPage
