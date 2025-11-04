import Footer from '../components/Footer'
import styles from './CreateStoryLayout.module.css'

export default function CreateStoryLayout({ children }) {
    return (
        <div className={styles.createStoryLayoutContainer}>
            <main className={styles.createStoryMainContent}>{children}</main>
            <Footer />
        </div>
    )
}