import './Footer.css'

export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <h2 className="footer-title">Let's create something amazing together</h2>
        <div className="footer-links">
          <a href="mailto:developer.ashen.it@gmail.com">Email</a>
          <a href="https://www.linkedin.com/in/kurt-baybay" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://github.com/Ashen360" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.facebook.com/kurtrussel.baybay" target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 A portfolio by Ashen.IT</p>
      </div>
    </footer>
  );
}
