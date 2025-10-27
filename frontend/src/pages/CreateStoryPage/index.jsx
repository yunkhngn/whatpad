"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { getTags } from "../../services/api"
import CreateStoryHeader from "./components/CreateStoryHeader"
import CreateStoryForm from "./components/CreateStoryForm"
import CancelModal from "./components/CancelModal"
import { toast, Toaster } from "sonner"
import Loading from "../../components/Loading/Loading"
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
    const [titleEmpty, setTitleEmpty] = useState(true)

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

    const handleNext = () => {
        if (titleEmpty) {
            toast.error("Title is required")
            return
        }
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
            <Toaster />
            <CreateStoryHeader
                storyTitle={storyDetails.title}
                onCancel={handleCancel}
                onNext={handleNext}
                titleEmpty={titleEmpty}
            />

            <CreateStoryForm
                storyDetails={storyDetails}
                setStoryDetails={setStoryDetails}
                allTags={allTags}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
                titleEmpty={titleEmpty}
                setTitleEmpty={setTitleEmpty}
            />

            <CancelModal
                show={showCancelModal}
                onHide={() => setShowCancelModal(false)}
                onConfirm={handleConfirmCancel}
            />
        </div>
    )
}