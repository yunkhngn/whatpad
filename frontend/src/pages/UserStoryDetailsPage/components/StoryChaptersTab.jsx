"use client";
import { ListGroup, Card, Button, Form, Pagination, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router";
import { createChapter } from "../../../services/api";
import ChapterListItem from "./ChapterListItem";
import { toast } from "sonner";
import Loading from "../../../components/Loading";
import { useState, useMemo } from "react";

const CHAPTERS_PER_PAGE = 10;

const StoryChaptersTab = ({
  storyId,
  chapters,
  onDeleteChapter,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleAddChapter = async () => {
    try {
      setIsLoading(true);
      const response = await createChapter(storyId, {
        title: "Untitled",
        content: "Empty",
      });
      const newChapter = response.data;

      // Navigate to create chapter page
      navigate(`/work/story/${storyId}/chapter/${newChapter.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Cannot create new chapter yet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter chapters based on search query
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters || [];
    
    const query = searchQuery.toLowerCase();
    return (chapters || []).filter(chapter => 
      chapter.title.toLowerCase().includes(query)
    );
  }, [chapters, searchQuery]);

  // Paginate filtered chapters
  const totalPages = Math.ceil(filteredChapters.length / CHAPTERS_PER_PAGE);
  const paginatedChapters = useMemo(() => {
    const startIndex = (currentPage - 1) * CHAPTERS_PER_PAGE;
    const endIndex = startIndex + CHAPTERS_PER_PAGE;
    return filteredChapters.slice(startIndex, endIndex);
  }, [filteredChapters, currentPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!chapters || chapters.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <i
            className="bi bi-file-earmark-text"
            style={{ fontSize: "2rem" }}
          ></i>
          <p className="mt-3 text-muted">No chapters written yet.</p>
          <Button variant="primary" onClick={handleAddChapter}>
            <i className="bi bi-plus me-1"></i>
            Add First Chapter
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-3 d-flex justify-content-between align-items-center gap-3">
        <Button variant="primary" onClick={handleAddChapter}>
          <i className="bi bi-plus me-1"></i>
          Add Chapter
        </Button>

        {/* Search Bar */}
        {chapters && chapters.length > 0 && (
          <InputGroup style={{ maxWidth: "400px" }}>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </InputGroup>
        )}
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="mb-2 text-muted">
          Found {filteredChapters.length} chapter{filteredChapters.length !== 1 ? 's' : ''}
        </div>
      )}

      <ListGroup>
        {paginatedChapters.map((chapter, index) => {
          const chapterOrder = (currentPage - 1) * CHAPTERS_PER_PAGE + index + 1;
          return (
            <ChapterListItem
              storyId={storyId}
              key={chapter.id}
              chapter={chapter}
              chapterOrder={chapterOrder}
              onDelete={onDeleteChapter}
              onUpdate={onRefresh}
            />
          );
        })}
      </ListGroup>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
              disabled={currentPage === 1}
            />
            
            {[...Array(totalPages)].map((_, idx) => {
              const page = idx + 1;
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <Pagination.Ellipsis key={page} disabled />;
              }
              return null;
            })}
            
            <Pagination.Next 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
              disabled={currentPage === totalPages}
            />
            <Pagination.Last 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}
    </>
  );
};

export default StoryChaptersTab;
