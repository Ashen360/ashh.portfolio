import "./GitHubCard.css";
import { useEffect, useState } from "react";
import snapshot from "./githubSnapshot.json";

const USER = "Ashen360";
const API = "https://api.github.com";
const CACHE_KEY = "github-commits";
const CACHE_MS = 30 * 60 * 1000;
const WEEKS = 12;
const SHOWN = 5;
const REPOS = 3;

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (value) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    return;
  }
};

async function fetchCommits(signal) {
  const since = new Date(Date.now() - WEEKS * 7 * 864e5).toISOString();
  const get = async (path) => {
    const res = await fetch(`${API}${path}`, { signal, headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return res.json();
  };
  const repos = (await get(`/users/${USER}/repos?sort=pushed&per_page=6`)).filter((r) => !r.fork).slice(0, REPOS);
  const lists = await Promise.all(
    repos.map((r) =>
      get(`/repos/${USER}/${r.name}/commits?per_page=30&author=${USER}&since=${since}`).then((cs) =>
        cs.map((c) => ({
          sha: c.sha,
          message: c.commit.message.split("\n")[0],
          date: c.commit.author.date,
          url: c.html_url,
          repo: r.name,
          repoUrl: r.html_url,
        })),
      ),
    ),
  );
  const commits = lists.flat().sort((a, b) => b.date.localeCompare(a.date));
  return { capturedAt: new Date().toISOString(), repos: repos.map((r) => r.name), commits };
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS = [
  ["year", 365 * 864e5],
  ["month", 30 * 864e5],
  ["week", 7 * 864e5],
  ["day", 864e5],
  ["hour", 36e5],
  ["minute", 6e4],
];

function relative(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms || unit === "minute") return rtf.format(Math.round(diff / ms), unit);
  }
  return "";
}

function weeklyCounts(commits) {
  const now = Date.now();
  const counts = new Array(WEEKS).fill(0);
  commits.forEach((c) => {
    const age = Math.floor((now - new Date(c.date).getTime()) / (7 * 864e5));
    if (age >= 0 && age < WEEKS) counts[WEEKS - 1 - age] += 1;
  });
  return counts;
}

function initialData() {
  const cached = readCache();
  if (cached?.data) return { data: cached.data, source: "cache", fresh: Date.now() - cached.at < CACHE_MS };
  return { data: snapshot, source: "snapshot", fresh: false };
}

export default function GitHubCard({ active }) {
  const [state, setState] = useState(initialData);

  useEffect(() => {
    if (!active || state.fresh) return;
    const controller = new AbortController();
    fetchCommits(controller.signal)
      .then((data) => {
        writeCache({ at: Date.now(), data });
        setState({ data, source: "live", fresh: true });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [active, state.fresh]);

  const { commits, repos } = state.data;
  const counts = weeklyCounts(commits);
  const peak = Math.max(...counts, 1);
  const total = counts.reduce((a, b) => a + b, 0);
  const live = state.fresh;
  const statusText = live ? "Live from GitHub" : state.source === "cache" ? "Cached · refreshing" : "Snapshot · refreshing";

  return (
    <div className="gh-card-inner">
      <div className="gh-side">
        <div>
          <div className="gh-status">
            <span className={`gh-dot ${live ? "live" : ""}`} aria-hidden="true" />
            {statusText}
          </div>
          <h3 className="gh-title">Recently shipped</h3>
          <p className="gh-sub">What I've been committing lately, straight from my public repos.</p>
        </div>
        <div>
          <div className="gh-bars" role="img" aria-label={`${total} commits in the last ${WEEKS} weeks across ${repos.join(", ")}`}>
            {counts.map((n, i) => (
              <i key={i} className={n ? "on" : ""} style={{ height: `${n ? Math.max((n / peak) * 100, 12) : 6}%` }} />
            ))}
          </div>
          <div className="gh-bars-legend">
            <span>{WEEKS} weeks ago</span>
            <span>this week</span>
          </div>
          <a className="gh-profile" href={`https://github.com/${USER}`} target="_blank" rel="noopener noreferrer">
            github.com/{USER}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>
        </div>
      </div>
      <ol className="gh-list">
        {commits.slice(0, SHOWN).map((c) => (
          <li key={c.sha}>
            <a className="gh-sha" href={c.url} target="_blank" rel="noopener noreferrer" aria-label={`Commit ${c.sha.slice(0, 7)} on GitHub`}>
              {c.sha.slice(0, 7)}
            </a>
            <span className="gh-msg">
              <span className="gh-msg-text" title={c.message}>
                {c.message}
              </span>
              <a className="gh-repo" href={c.repoUrl} target="_blank" rel="noopener noreferrer">
                {c.repo}
              </a>
            </span>
            <time className="gh-time" dateTime={c.date}>
              {relative(c.date)}
            </time>
          </li>
        ))}
      </ol>
    </div>
  );
}
