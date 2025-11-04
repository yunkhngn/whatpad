import styles from "./Loading.module.css"

/**
 * Full-screen loading overlay component.
 * Props:
 *  - show (boolean) default true: whether to display the overlay
 *  - message (string) optional message shown under the spinner
 *
 * Usage:
 *  <Loading show={isLoading} message="Saving..." />
 *  or simply <Loading /> when you conditionally render it.
 */
export default function Loading() {
    return (
        <div className={styles.overlay} aria-live="polite">
            <div className={styles.content}>
                <div className={styles.spinner} aria-hidden="true" />
            </div>
        </div>
    )
}
