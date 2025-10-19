import styles from './StoryPreviewPage.module.css'
import { useEffect, useState } from 'react'
import { getStoryById, getUserById } from '../../services/api.js'
import { useNavigate, useParams } from 'react-router'
import StoryReviews from './components/StoryReviews.jsx'
import StoryDetail from './components/StoryDetail.jsx'

const reviews = [
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

const currentUser = {
    name: 'huynq',

}

export default function StoryPreviewPage() {
    window.scroll({ top: 0, behavior: 'smooth' });

    const [story, setStory] = useState({})
    const [publisher, setPublisher] = useState({})
    const { id } = useParams()
    const [reviewss, setReviews] = useState([])

    useEffect(() => {
        async function fetchUser(id) {
            try {
                const responseData = await getUserById(id)
                setPublisher(responseData)
            } catch (error) {
                console.error("Failed to fetch user:", error)
            }
        }

        async function fetchStory(storyId) {
            try {
                const responseData = await getStoryById(storyId)
                setStory(responseData)
                fetchUser(responseData.user_id)
            } catch (error) {
                console.error("Failed to fetch story:", error)
            }
        }

        fetchStory(id)
    }, [])

    if (!story) return <div className={styles.storyPreviewPageContainer}>
        <div className={styles.section}>
            <span className="badge-loader"></span>
        </div>
        <div className={styles.section}>
            <span className="badge-loader"></span>
        </div>
    </div>

    return <div className={styles.storyPreviewPageContainer}>
        <StoryDetail
            styles={styles}
            story={story}
            publisher={publisher}
        />

        <StoryReviews
            styles={styles}
            reviews={reviews}
            currentUser={currentUser} />
    </div>
}