"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { getTags } from "../../services/api"
import CreateStoryHeader from "./components/CreateStoryHeader"
import CreateStoryForm from "./components/CreateStoryForm"
import CancelModal from "./components/CancelModal"
// import "./CreateStory.module.css"

export default function CreateStoryPage() {
    const navigate = useNavigate()
    const [storyDetails, setStoryDetails] = useState({
        title: "",
        description: "",
        cover: null,
        tags: [],
    })
    const [previewUrl, setPreviewUrl] = useState(null)
    const [allTags, setAllTags] = useState([])
    const [showCancelModal, setShowCancelModal] = useState(false)

    // Check if form has unsaved changes
    const isDirty = storyDetails.title || storyDetails.description || storyDetails.cover || storyDetails.tags.length > 0

    useEffect(() => {
        fetchTags()
    }, [])

    const fetchTags = async () => {
        try {
            const response = await getTags()
            setAllTags(response.tags || [])
        } catch (err) {
            console.error("Error fetching tags:", err)
        }
    }

    const handleSkipNext = () => {
        // TODO: Implement navigation to next step or skip logic
        console.log("Skip/Next clicked with story details:", storyDetails)
        // For now, navigate to home
        navigate("/")
    }

    const handleCancel = () => {
        setShowCancelModal(true)
    }

    const handleConfirmCancel = () => {
        setShowCancelModal(false)
        navigate(-1)
    }

    return (
        <div className="create-story-page">
            <CreateStoryHeader
                storyTitle={storyDetails.title}
                isDirty={isDirty}
                onCancel={handleCancel}
                onSkipNext={handleSkipNext}
            />

            <CreateStoryForm
                storyDetails={storyDetails}
                setStoryDetails={setStoryDetails}
                allTags={allTags}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
            />

            <CancelModal
                show={showCancelModal}
                onHide={() => setShowCancelModal(false)}
                onConfirm={handleConfirmCancel}
            />
        </div>
    )
}