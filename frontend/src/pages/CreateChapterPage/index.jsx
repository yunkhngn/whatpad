"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { getStoryById } from "../../services/api"
import CreateChapterHeader from "./components/CreateChapterHeader"
import ChapterEditor from "./components/ChapterEditor"
import styles from "./CreateChapterPage.module.css"

export default function CreateChapterPage() {
    const { storyId } = useParams()
    const navigate = useNavigate()
    const [story, setStory] = useState(null)
    const [chapterTitle, setChapterTitle] = useState("")
    const [chapterContent, setChapterContent] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchStory()
    }, [storyId])

    const fetchStory = async () => {
        try {
            const response = await getStoryById(storyId)
            setStory(response.story)
            setIsLoading(false)
        } catch (error) {
            console.error("Error fetching story:", error)
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate('/')
    }

    const handleSave = () => {
        // TODO: Implement chapter save logic
        console.log("Save chapter:", { chapterTitle, chapterContent })
        navigate("/")
    }

    if (isLoading) {
        return <div className={styles.createChapterPage}>Loading...</div>
    }

    return (
        <div className={styles.createChapterPage}>
            <CreateChapterHeader
                storyTitle={story?.title || "Loading..."}
                onCancel={handleCancel}
                onSave={handleSave} />
            <ChapterEditor
                title={chapterTitle}
                setTitle={setChapterTitle}
                content={chapterContent}
                setContent={setChapterContent}
            />

        </div>
    )
}
