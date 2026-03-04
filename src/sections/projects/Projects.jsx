import "./Projects.css";
import { useRef } from "react";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";

import project1Img from "../../assets/projects/wordweaver.jpg";
import project2Img from "../../assets/projects/siningfilipino.jpg";

export default function Projects() {
  const project1Ref = useRef(null);
  const project2Ref = useRef(null);

  const project1Visible = useIntersectionObserver(project1Ref);
  const project2Visible = useIntersectionObserver(project2Ref);

  const projects = [
    {
      number: "01",
      title: "WordWeaver",
      description:
        "A React-based category word puzzle game where players identify groups of four related words from a shuffled grid. With multiple diffuculty levels—from everyday topics to advanced computer science concepts. It challenges logic, pattern recognition, and domain knowledge.",
      tags: ["React", "Word Game", "Minimalist Design"],
      image: project1Img,
      link: "https://ashen360.github.io/WordWeaver/",
      ref: project1Ref,
      visible: project1Visible,
    },
    {
      number: "02",
      title: "Sining Filipino",
      description:
        "This project, created as my final requirement for Art Appreciation at the Technological Institute of the Philippines (SY 2024–2025), is an interactive visual timeline showcasing the evolution of Philippine art. It highlights significant Filipino artists from the Pre-Colonial, Colonial, and Post-Colonial periods, featuring their biographies, artistic movements, and representative works. The site aims to make Philippine art history more engaging, accessible, and visually immersive for learners.",
      tags: ["HTML", "CSS", "JavaScript", "Educational"],
      image: project2Img,
      link: "https://ashen360.github.io/SiningFilipino/",
      ref: project2Ref,
      visible: project2Visible,
    },
  ];

  return (
    <section id="projects">
      <div className="container">
        <div className="projects-header">
          <div className="section-label">My Projects</div>
          <h2 className="section-title">Works that push boundaries</h2>
        </div>

        <div className="projects-grid">
          {projects.map((project, idx) => (
            <div
              key={idx}
              ref={project.ref}
              className={`project-card ${project.visible ? "visible" : ""}`}
            >
              <div className="project-image">
                <img src={project.image} alt={project.title} />
              </div>
              <div className="project-info">
                <div className="project-number">{project.number}</div>
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag, tagIdx) => (
                    <span key={tagIdx} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link"
                >
                  View Project
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
