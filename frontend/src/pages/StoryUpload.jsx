import React, { useState, useRef, useEffect } from "react";
import { tagsAPI, uploadAPI } from "../services/api";

export default function StoryUploadPage() {
  const [coverPreview, setCoverPreview] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [uploadingStory, setUploadingStory] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const fileInputRef = useRef(null);

  // Fetch tags từ API khi component mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoadingTags(true);
        const response = await tagsAPI.getAll();
        setAvailableTags(response.tags || []);
      } catch (error) {
        console.error('Lỗi khi fetch tags:', error);
        // Fallback về danh sách tags cứng nếu lỗi API
        setAvailableTags([
          'Romance', 'Fantasy', 'Martial Arts', 'Urban', 'Sci-Fi',
          'Mystery', 'Horror', 'Comedy', 'Fanfiction', 'LGBTQ+',
          'Isekai', 'Historical', 'Modern', 'BL', 'GL',
          'School', 'Game', 'Military',
          'Tình Cảm', 'Phiêu Lưu', 'Hài Hước', 'Kinh Dị', 'Trinh Thám'
        ]);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  const handleCoverUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);

    try {
      const response = await uploadAPI.uploadImage(file);
      setCoverUrl(response.data.url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Lỗi upload ảnh bìa: " + err.message);
    }
    setUploadingCover(false);
  };

  const handleAddTag = () => {
    if (selectedTag && !tags.includes(selectedTag)) {
      setTags([...tags, selectedTag]);
      setSelectedTag("");
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadingStory(true);

    try {
      const body = {
        title,
        description,
        cover_url: coverUrl,
        tags,
        chapter_title: chapterTitle,
        chapter_content: chapterContent,
      };
      const res = await fetch("/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Upload truyện thất bại");
      alert("Đã upload truyện thành công!");
    } catch (err) {
      alert("Lỗi upload truyện!");
    }
    setUploadingStory(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee", padding: "32px" }}>
      <h2 style={{ marginBottom: 24 }}>Tạo Truyện Mới</h2>
      <form onSubmit={handleSubmit}>
        {/* Cover upload */}
        <div style={{ marginBottom: 20 }}>
          <label>Ảnh bìa truyện:</label><br />
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleCoverChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <button 
            type="button"
            onClick={handleCoverUploadClick}
            style={{ 
              padding: "10px 20px", 
              borderRadius: 5, 
              border: "2px dashed #ddd", 
              background: "#f9f9f9", 
              color: "#666",
              cursor: "pointer",
              marginTop: 6 
            }}
          >
            {coverPreview ? "Thay đổi ảnh bìa" : "Chọn ảnh bìa"}
          </button>
          {coverPreview && (
            <div style={{ marginTop: 12 }}>
              <img src={coverPreview} alt="preview" style={{ width: 140, borderRadius: 8 }} />
              {uploadingCover && <div>Đang tải ảnh bìa...</div>}
            </div>
          )}
        </div>
        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <label>Tiêu đề truyện:</label>
          <input
            style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ddd", marginTop: 6 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label>Mô tả truyện:</label>
          <textarea
            style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ddd", marginTop: 6 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        {/* Tags */}
        <div style={{ marginBottom: 20 }}>
          <label>Tag (thể loại, chủ đề):</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <select
              style={{ flex: 1, padding: "10px 14px", borderRadius: 5, border: "1px solid #ddd", fontSize: 16 }}
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              disabled={loadingTags}
            >
              <option value="">
                {loadingTags ? "Đang tải..." : "Chọn thể loại"}
              </option>
              {availableTags.map((tag) => (
                <option 
                  key={tag.id || tag} 
                  value={typeof tag === 'object' ? tag.name : tag} 
                  disabled={tags.includes(typeof tag === 'object' ? tag.name : tag)}
                >
                  {typeof tag === 'object' ? tag.name : tag}
                </option>
              ))}
            </select>
            <button 
              type="button" 
              style={{ 
                padding: "0 16px", 
                borderRadius: 5, 
                border: "none", 
                background: loadingTags || !selectedTag || tags.includes(selectedTag) ? "#ccc" : "#ff5533", 
                color: "#fff", 
                fontWeight: 600 
              }} 
              onClick={handleAddTag}
              disabled={loadingTags || !selectedTag || tags.includes(selectedTag)}
            >
              Thêm
            </button>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((tag, i) => (
              <span key={i} style={{ background: "#eee", borderRadius: 5, padding: "6px 12px", fontWeight: 500 }}>
                {tag}
                <span style={{ marginLeft: 6, color: "#ff5533", cursor: "pointer" }} onClick={() => handleRemoveTag(tag)}>×</span>
              </span>
            ))}
          </div>
        </div>
        {/* Chapter */}
        <div style={{ marginBottom: 20 }}>
          <label>Chương đầu tiên:</label>
          <input
            style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ddd", marginTop: 6 }}
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            placeholder="Tiêu đề chương"
            required
          />
          <textarea
            style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ddd", marginTop: 6 }}
            value={chapterContent}
            onChange={(e) => setChapterContent(e.target.value)}
            rows={8}
            placeholder="Nội dung chương đầu tiên"
            required
          />
        </div>
        <button type="submit" disabled={uploadingStory} style={{
          background: "#ff5533", color: "#fff", border: "none", borderRadius: 5, padding: "12px 28px", fontWeight: 600
        }}>
          {uploadingStory ? "Đang upload..." : "Tạo truyện"}
        </button>
      </form>
    </div>
  );
}