"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  createChapter,
  createStory,
  getTags,
  uploadImage,
} from "../../services/api";
import CreateStoryHeader from "./components/CreateStoryHeader";
import CreateStoryForm from "./components/CreateStoryForm";
import CancelModal from "./components/CancelModal";
import { toast, Toaster } from "sonner";
import Loading from "../../components/Loading";
// import "./CreateStory.module.css"

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const [storyDetails, setStoryDetails] = useState({
    title: "",
    description: "",
    cover: null,
    tags: [],
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [titleEmpty, setTitleEmpty] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await getTags();
      setAllTags(response.tags || []);
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  };

  const handleSubmitStory = async () => {
    if (titleEmpty) {
      toast.error("Title is required");
      return;
    }

    try {
      setLoading(true);
      let imageUrl = null;

      // Upload cover image if provided
      if (storyDetails.cover) {
        const uploadResponse = await uploadImage(storyDetails.cover);
        imageUrl = uploadResponse.data.image_url || uploadResponse.data.url;
      }

      // Prepare story data with tag IDs
      const tagIds = storyDetails.tags.map((tag) => tag.id);
      const storyData = {
        title: storyDetails.title,
        description: storyDetails.description,
        cover_url: imageUrl,
        tags: tagIds,
      };

      // Create story
      const createStoryResponse = await createStory(storyData);
      const newStoryId = createStoryResponse.data?.id || createStoryResponse.id;

      // Create chapter
      const newChapterData = {
        title: "Untitled",
        content: "empty",
      };
      const createChapterResponse = await createChapter(
        newStoryId,
        newChapterData
      );
      const newChapterId = createChapterResponse.data.id;

      // Navigate to chapter creation page
      navigate(`/work/story/${newStoryId}/chapter/${newChapterId}`);
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error("Failed to create story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigate(-1);
  };

  return (
    <div className="create-story-page">
      <Toaster />

      {loading && <Loading />}

      <CreateStoryHeader
        storyTitle={storyDetails.title}
        onCancel={handleCancel}
        onNext={handleSubmitStory}
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
  );
}
