import { ListGroup } from "react-bootstrap";
import UserStoryItem from "./UserStoryItem";

const UserStoryList = ({ stories, onViewStory, onRefresh }) => {
  if (!stories || stories.length === 0) {
    return (
      <div className="alert alert-info text-center py-5">
        <i className="bi bi-book me-2" style={{ fontSize: "2rem" }}></i>
        <p className="mt-2">
          You haven't created any stories yet. Click the "New Story" to a new
          story!
        </p>
      </div>
    );
  }

  return (
    <ListGroup className="shadow-sm">
      {stories.map((story) => (
        <UserStoryItem
          key={story.id}
          story={story}
          onView={onViewStory}
          onRefresh={onRefresh}
        />
      ))}
    </ListGroup>
  );
};

export default UserStoryList;
