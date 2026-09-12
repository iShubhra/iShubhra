/* ==========================================================================
   github.js — live repository cards with graceful fallback
   --------------------------------------------------------------------------
   Repositories are fetched from the public GitHub API once the section is
   scrolled into view. If the request fails (rate limits, no network, blocked
   in the browser) clearly-marked placeholder cards are rendered instead.

   To replace the placeholders with real pinned content, either:
     1. update the PLACEHOLDER_REPOS array below, or
     2. publish repositories on github.com/shubhrakantighosh and let the
        live fetch (top 6 by last update) take over automatically.
   ========================================================================== */

(function () {
  "use strict";

  var USERNAME = "shubhrakantighosh";
  var CONTAINER = document.getElementById("repos");
  if (!CONTAINER) return;

  var LANGUAGE_COLORS = {
    Go: "#00ADD8",
    Python: "#3572A5",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Java: "#b07219",
    "C++": "#f34b7d",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    SQL: "#e38c7a",
    Dockerfile: "#384d54"
  };
  var FALLBACK_COLOR = "#8b949e";

  /* clearly-marked placeholders shown when the API is unavailable.
     Swap these for your real repository names + descriptions. */
  var PLACEHOLDER_REPOS = [
    { name: "your-repo-one",  description: "Placeholder — describe the repository here. Replace this entry in js/github.js.", language: "Go" },
    { name: "your-repo-two",  description: "Placeholder — describe the repository here. Replace this entry in js/github.js.", language: "Go" },
    { name: "your-repo-three", description: "Placeholder — describe the repository here. Replace this entry in js/github.js.", language: "Python" }
  ];

  function langColor(lang) {
    if (!lang) return FALLBACK_COLOR;
    return LANGUAGE_COLORS[lang] || FALLBACK_COLOR;
  }

  function repoCard(repo, placeholder) {
    var card = document.createElement("article");
    card.className = "repo-card" + (placeholder ? " repo-placeholder" : "");

    var head = document.createElement("div");
    head.className = "repo-head";

    var name = document.createElement("a");
    name.className = "repo-name";
    name.textContent = repo.name;
    name.href = repo.html_url || "https://github.com/" + USERNAME;
    name.target = "_blank";
    name.rel = "noopener noreferrer";
    if (repo.archived) {
      var archived = document.createElement("span");
      archived.className = "repo-archived";
      archived.textContent = "archived";
      head.appendChild(archived);
    }
    if (placeholder) {
      var tag = document.createElement("span");
      tag.className = "placeholder-tag";
      tag.textContent = "placeholder · replace me";
      head.appendChild(tag);
    }
    head.insertBefore(name, head.firstChild);
    card.appendChild(head);

    var desc = document.createElement("p");
    desc.className = "repo-desc";
    desc.textContent = repo.description || "No description provided.";
    card.appendChild(desc);

    var tags = document.createElement("div");
    tags.className = "repo-tags";
    if (repo.language) {
      var langTag = document.createElement("span");
      langTag.textContent = repo.language;
      tags.appendChild(langTag);
    }
    if (repo.topics && repo.topics.length) {
      repo.topics.slice(0, 3).forEach(function (t) {
        var span = document.createElement("span");
        span.textContent = t;
        tags.appendChild(span);
      });
    }
    card.appendChild(tags);

    var meta = document.createElement("div");
    meta.className = "repo-meta";
    var lang = document.createElement("span");
    var dot = document.createElement("i");
    dot.className = "lang-dot";
    dot.style.background = langColor(repo.language);
    lang.appendChild(dot);
    lang.append(document.createTextNode(repo.language || "n/a"));
    meta.appendChild(lang);

    var stars = document.createElement("span");
    stars.textContent = (repo.stargazers_count || 0) + " ★";
    meta.appendChild(stars);

    card.appendChild(meta);
    return card;
  }

  function renderPlaceholders() {
    replaceNote("repository data unavailable — showing clearly-marked placeholders");
    PLACEHOLDER_REPOS.forEach(function (repo) {
      CONTAINER.appendChild(repoCard(repo, true));
    });
  }

  function replaceNote(text) {
    var note = document.getElementById("repos-loading");
    if (note) {
      note.className = "mono small dim repos-loading-note";
      note.textContent = text;
    }
  }

  function renderAll(body) {
    replaceNote("live from github.com/" + USERNAME + " — top 6 by last update");
    body.forEach(function (repo) {
      CONTAINER.appendChild(repoCard(repo, false));
    });
  }

  function fetchRepos() {
    fetch("https://api.github.com/users/" + USERNAME + "/repos?sort=updated&per_page=100&type=owner", {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("github api: " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) throw new Error("no repos");
        var top = data
          .filter(function (r) { return !r.fork; })
          .slice(0, 6);
        if (top.length) renderAll(top); else renderPlaceholders();
      })
      .catch(function () {
        renderPlaceholders();
      });
  }

  function init() {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) {
          io.disconnect();
          fetchRepos();
        }
      }, { rootMargin: "400px" });
      io.observe(CONTAINER);
    } else {
      fetchRepos();
    }
  }

  init();
})();