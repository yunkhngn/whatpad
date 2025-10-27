"use client"

import React from "react"
import ReactDOM from "react-dom"
import styles from "./Loading.module.css"

export default function Loading({ show = true, message = "Loading..." }) {
    if (typeof document === "undefined") return null
    if (!show) return null

    const overlay = (
        <div className={styles.overlay} role="status" aria-live="polite">
            <div className={styles.backdrop} />
            <div className={styles.container}>
                <div className={styles.spinner} />
                {message && <div className={styles.message}>{message}</div>}
            </div>
        </div>
    )

    return ReactDOM.createPortal(overlay, document.body)
}
