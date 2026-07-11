import "./ResumeDialog.css";
import { useState, useEffect } from "react";
import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import { createPortal } from "react-dom";

import downloadIconDark from "../assets/Icons/download-dark.svg";
import downloadIconLight from "../assets/Icons/download-light.svg";
import resumePDF from "../assets/resume/KurtRussel-Baybay-CV-latest.pdf";

export default function ResumeDialog() {
  const { theme } = useContext(ThemeContext);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [showModal]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowModal(false);
    };
    if (showModal) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showModal]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = resumePDF;
    link.download = "KurtRussel-Baybay-CV.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowModal(false);
  };

  return (
    <>
      <button className="resume-button" onClick={() => setShowModal(true)}>
        <img
          src={theme === "light" ? downloadIconDark : downloadIconLight}
          alt="Download"
        />
        Download Resume
      </button>

      {showModal && createPortal(
        <div className="download-dialog" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="dialog-overlay"></div>
          <div className="dialog-content">
            <h3>Download Resume</h3>
            <p>Would you like to download my resume?</p>
            <div className="dialog-actions">
              <button className="dialog-button cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="dialog-button confirm" onClick={handleDownload}>Download</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
