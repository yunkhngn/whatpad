import { useNavigate } from 'react-router'
import { Button } from "react-bootstrap"
import styles from './CreateStoryHeader.module.css'

export default function CreateStoryHeader({ storyTitle, onCancel, onNext }) {
    const navigate = useNavigate()

    function handleGoBack() {
        navigate(-1)
    }

    return (
        <header className={styles.createStoryHeader}>
            {/* Header left */}
            <div className={styles.headerLeft}>
                <button className={styles.backBtn} onClick={handleGoBack} title='Go back'>
                    <i className='bi bi-arrow-left'></i>
                </button>
                <h1 className={styles.storyTitle}>{storyTitle || "Untitled Story"}</h1>
            </div>

            {/* Header right */}
            <div className={styles.headerRight}>
                <Button variant="light" onClick={onCancel} className={styles.cancelBtn}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onNext} className={styles.nextBtn}>
                    Next
                </Button>
            </div>
        </header>
    )
}
