"use client"

import { useState, useEffect } from "react"
import { getStories } from "../../services/api"
import styles from "./HomePage.module.css"
import GenreSection from "../../components/GenreSection"

const HomePage = () => {
    const [storiesByGenre, setStoriesByGenre] = useState({})
    const [continueReading, setContinueReading] = useState([])

    useEffect(() => {
        async function getAllStories() {
            try {
                const allStories = await getStories()

                // Mock continue reading data (first 3 stories with random progress)
                setContinueReading(allStories.slice(0, 3))

                // Group stories by genre
                const genres = {
                    Romance: allStories.filter((s) => s.genre === "Romance" || s.id === "2"),
                    Fantasy: allStories.filter((s) => s.genre === "Fantasy" || s.id === "1"),
                    Mystery: allStories.filter((s) => s.genre === "Mystery" || s.id === "5"),
                    Horror: allStories.filter((s) => s.genre === "Horror"),
                    Adventure: allStories.filter((s) => s.genre === "Adventure" || s.id === "3"),
                    "Sci-Fi": allStories.filter((s) => s.genre === "Sci-Fi" || s.id === "6"),
                    Comedy: allStories.filter((s) => s.genre === "Comedy"),
                    Drama: allStories.filter((s) => s.genre === "Drama" || s.id === "4"),
                }

                // If having empty genres, fill them with all stories for demo
                Object.keys(genres).forEach((genre) => {
                    if (genres[genre].length === 0) {
                        genres[genre] = allStories
                    }
                })

                setStoriesByGenre(genres)
            } catch (error) {
                console.log(error)
            }
        }

        getAllStories()
    }, [])

    return (
        <div className={`container ${styles.homePage}`}>
            <div className={styles.pageContainer}>
                {/* Continue Reading Section */}
                {continueReading.length > 0 && (
                    <GenreSection title="Continue Reading" stories={continueReading} showProgress={true} />
                )}

                {/* Genre Sections */}
                {Object.entries(storiesByGenre).map(([genre, stories]) => (
                    <GenreSection key={genre} title={`${genre}`} stories={stories} />
                ))}
            </div>
        </div>
    )
}

export default HomePage
