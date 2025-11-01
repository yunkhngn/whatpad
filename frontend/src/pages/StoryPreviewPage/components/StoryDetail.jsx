import { useNavigate } from 'react-router'
import bookCoverPlaceholder from '../../../assests/images/book-cover-placeholder.png'

export default function StoryDetail({
    styles,
    story,
    publisher
}) {
    const navigate = useNavigate()

    return <div className={styles.section}>
        <h2 className={styles.storyTitle}>{story.title}</h2>
        <div className={styles.storyDetail}>
            <img src={story.coverUrl || bookCoverPlaceholder} alt={story.title} className={styles.storyCover} />

            <div>
                <div>
                    <p className={styles.detailLabel}>Upload by</p>
                    <p>{publisher?.username || 'Unknown'}</p>
                </div>
                <div>
                    <p className={styles.detailLabel}>Author</p>
                    <p>{story.author || 'Somebody'}</p>
                </div>
                <div>
                    <p className={styles.detailLabel}>Tag</p>
                    <ul className="list-unstyled mt-2 d-flex gap-2">
                        <li className={styles.tag}>Horror</li>
                        <li className={styles.tag}>Horror</li>
                        {story.tags?.map((tag, index) => <li key={index} className={styles.tag}>{tag?.name}</li>)}
                    </ul>
                </div>
                <div>
                    <p className={styles.detailLabel}>Description</p>
                    <p>{story.description}</p>
                </div>
                <div>
                    <p className={styles.detailLabel}>Status</p>
                    <p>{story.status}</p>
                </div>
            </div>
        </div>
        <button className="btn-primary mt-3 d-flex mx-auto" onClick={() => navigate(`/story/${story.id}/chapter/1`)}>
            <i className="bi bi-book me-2"></i>
            Start reading
        </button>
    </div>
}