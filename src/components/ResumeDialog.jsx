import "./ResumeDialog.css";
import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { ThemeContext } from "./ThemeContext";

import downloadIconDark from "../assets/Icons/download-dark.svg";
import downloadIconLight from "../assets/Icons/download-light.svg";

export default function ResumeDialog() {

  const { theme } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

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

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleOverlayClick = (e) => {
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

      {/* Global Modal via Portal */}
      {isOpen &&
        createPortal(
          <div className="download-dialog" onClick={handleOverlayClick}>
            <div className="dialog-overlay"></div>

            <div className="dialog-content">
              <h3>Resume Currently Being Updated</h3>

              <p>
                I'm currently redesigning and refining my resume to better
                reflect my latest projects and technical growth.
              </p>

              <p>
                If you'd like a copy in the meantime, feel free to reach out
                through the contact section — I’d be happy to share it directly.
              </p>

              <div className="dialog-actions">
                <button
                  className="dialog-button confirm"
                  onClick={() => setIsOpen(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
