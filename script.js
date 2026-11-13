const REPO = "nathanielclintsuyod0-collab/RustPlusPlus";
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases`;

document.getElementById("year").textContent = new Date().getFullYear();

document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("nav-links").classList.toggle("open");
});

document.querySelectorAll("#nav-links a").forEach(link => {
  link.addEventListener("click", () => document.getElementById("nav-links").classList.remove("open"));
});

function setPlatform(platform, asset, release) {
  const card = document.querySelector(`[data-platform="${platform}"]`);
  if (!card) return;
  const link = card.querySelector(".download-link");
  const status = card.querySelector(".asset-status");
  if (asset) {
    link.href = asset.browser_download_url;
    link.textContent = "Download now ↓";
    link.removeAttribute("target");
    link.removeAttribute("rel");
    status.textContent = `${release.tag_name || "Latest"} · ${formatSize(asset.size)}`;
    status.classList.add("available");
  } else {
    link.href = release.html_url || RELEASES_PAGE;
    link.textContent = "View release ↗";
    link.target = "_blank";
    link.rel = "noreferrer";
    status.textContent = "No matching installer in latest release";
  }
}

function formatSize(bytes) {
  if (!bytes) return "Download";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function findAsset(assets, patterns) {
  return assets.find(asset => patterns.some(pattern => pattern.test(asset.name)));
}

async function loadReleases() {
  try {
    const response = await fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const releases = await response.json();
    const published = releases.filter(release => !release.draft && !release.prerelease);
    if (!published.length) {
      document.getElementById("release-title").textContent = "First release coming soon";
      document.getElementById("release-description").textContent = "No public release is available yet. Check the GitHub repository for development updates.";
      document.querySelectorAll(".asset-status").forEach(el => {
        if (el.textContent.includes("Checking")) el.textContent = "Awaiting first release";
      });
      document.getElementById("release-list").innerHTML = `<div class="release-item"><span class="release-dot"></span><div><b>No published releases yet</b><p>When a release is published, version notes and matching installers will appear here.</p><a href="${RELEASES_PAGE}" target="_blank" rel="noreferrer">Visit GitHub releases ↗</a></div></div>`;
      return;
    }

    const latest = published[0];
    document.getElementById("release-title").textContent = `${latest.name || latest.tag_name} is available`;
    document.getElementById("release-description").textContent = `Published ${new Date(latest.published_at).toLocaleDateString()} · ${latest.tag_name}`;
    const assets = latest.assets || [];
    setPlatform("windows", findAsset(assets, [/\.exe$/i, /\.msi$/i]), latest);
    setPlatform("android", findAsset(assets, [/\.apk$/i]), latest);
    setPlatform("mac", findAsset(assets, [/\.dmg$/i, /\.app\.tar\.gz$/i]), latest);

    document.getElementById("release-list").innerHTML = published.slice(0, 5).map(release => {
      const body = (release.body || "No release notes provided.").slice(0, 260);
      return `<div class="release-item"><span class="release-dot"></span><div><b>${escapeHtml(release.name || release.tag_name)}</b><p>${escapeHtml(body)}</p><p>${new Date(release.published_at).toLocaleDateString()} · <a href="${release.html_url}" target="_blank" rel="noreferrer">View release ↗</a></p></div></div>`;
    }).join("");
  } catch (error) {
    document.getElementById("release-title").textContent = "Release information unavailable";
    document.getElementById("release-description").textContent = "Visit GitHub Releases to check for the latest installers.";
    document.querySelectorAll(".asset-status").forEach(el => {
      if (el.textContent.includes("Checking")) el.textContent = "Check GitHub releases";
    });
    console.warn("Could not load GitHub releases:", error);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

loadReleases();
