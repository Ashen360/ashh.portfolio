import { useEffect } from "react";

export function useCaseStudyFonts(id, href) {
  useEffect(() => {
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [id, href]);
}
