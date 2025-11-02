"use client";
import { Navbar, Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router";

const StoryDetailHeader = ({ title }) => {
  const navigate = useNavigate();

  return (
    <Navbar bg="light" className="border-bottom mb-4">
      <Container fluid className="px-4">
        <div className="d-flex justify-content-between align-items-center w-100">
          {/* Back Button */}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back
          </Button>

          {/* Title */}
          <Navbar.Brand className="mx-auto">
            <h5 className="mb-0">{title || "Loading..."}</h5>
          </Navbar.Brand>

          {/* Cancel Button */}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate("/my-stories")}
          >
            Close
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default StoryDetailHeader;
