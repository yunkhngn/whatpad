"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  createChapter,
  getChapterOfStory,
  getStoryById,
  updateChapter,
} from "../../services/api";
import CreateChapterHeader from "./components/CreateChapterHeader";
import ChapterEditor from "./components/ChapterEditor";
import Loading from "../../components/Loading";
import styles from "./CreateChapterPage.module.css";
import { toast } from "sonner";

export default function CreateChapterPage() {
  const { storyId, chapterId } = useParams();
  const navigate = useNavigate();
  const [fetchedStory, setFetchedStory] = useState({});
  const [fetchedChapter, setFetchedChapter] = useState({});
  const [chapterEdit, setChapterEdit] = useState({
    title: "",
    content: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [chapterId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const storyResponse = await getStoryById(storyId);
      const chapterResponse = await getChapterOfStory(storyId, chapterId);
      setFetchedStory(storyResponse.story);
      setFetchedChapter(chapterResponse.chapter);

      setChapterEdit({
        title:
          chapterResponse.chapter.title === "Untitled"
            ? ""
            : chapterResponse.chapter.title,
        content:
          chapterResponse.chapter.content === "empty"
            ? ""
            : chapterResponse.chapter.content,
      });
    } catch (error) {
      toast.error("Error fetching story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await updateChapter(storyId, chapterId, chapterEdit);
    } catch (error) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextChapter = async () => {
    try {
      setIsLoading(true);

      // Create chapter
      const newChapterData = {
        title: "Untitled",
        content: "empty",
      };
      const createChapterResponse = await createChapter(
        storyId,
        newChapterData
      );

      // Navigate to chapter creation page
      navigate(`/stories/${storyId}/chapters/${createChapterResponse.data.id}`);
    } catch (error) {
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.createChapterPage}>
      {isLoading && <Loading />}

      <CreateChapterHeader
        storyTitle={fetchedStory?.title || "Loading..."}
        onCancel={handleCancel}
        onSave={handleSave}
        onNextChapter={handleNextChapter}
        storyCover={fetchedStory.cover_url}
      />
      <ChapterEditor
        chapterEdit={chapterEdit}
        setChapterEdit={setChapterEdit}
        fetchedChapter={fetchedChapter}
      />
    </div>
  );
}
