import "./ResumeDialog.css";
import { useState, useEffect } from "react";
import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

import downloadIconDark from "../assets/Icons/download-dark.svg";
import downloadIconLight from "../assets/Icons/download-light.svg";

export default function ResumeDialog() {
  const { theme } = useContext(ThemeContext);

  const [isOpen, setIsOpen] = useState(false);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    // Cleanup
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/assets/Resume.pdf";
    link.download = "Resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleOverlayClick = (e) => {
    // Close only if clicking directly on overlay, not dialog
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Resume Button */}
      <button className="resume-button" onClick={() => setIsOpen(true)}>
        <img
          src={theme === "light" ? downloadIconDark : downloadIconLight}
          alt="Download"
        />
        Download Resume
      </button>

      {/* Resume Download Confirmation Dialog */}
      <div
        className={`download-dialog ${isOpen ? "active" : ""}`}
        onClick={handleOverlayClick}
      >
        <div className="dialog-overlay"></div>
        <div className="dialog-content">
          <h3>Download Resume?</h3>
          <p>
            You're about to download my resume as a PDF file. This will be saved
            to your downloads folder.
          </p>
          <div className="dialog-actions">
            <button className="dialog-button cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button className="dialog-button confirm" onClick={handleDownload}>
              Download Resume
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
