const GITHUB_OWNER = "Anshu101com";
const GITHUB_REPOSITORY = "bonding";

const GITHUB_RELEASES_API =
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/releases`;

document.addEventListener("DOMContentLoaded", () => {
    const yearElement = document.getElementById("year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    loadLatestRelease();
});

async function loadLatestRelease() {
    const versionElement = document.getElementById("hero-version");
    const releaseVersion = document.getElementById("release-version");
    const releaseTitle = document.getElementById("release-title");
    const releaseDate = document.getElementById("release-date");
    const downloadButton = document.getElementById("download-button");
    const releaseNotes = document.getElementById("release-notes");

    try {
        if (releaseVersion) {
            releaseVersion.textContent = "Checking for updates...";
        }

        if (downloadButton) {
            downloadButton.textContent = "Loading release...";
            downloadButton.classList.add("disabled");
            downloadButton.setAttribute("aria-disabled", "true");
            downloadButton.removeAttribute("href");
        }

        const response = await fetch(
            GITHUB_RELEASES_API,
            {
                headers: {
                    Accept: "application/vnd.github+json"
                },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub returned ${response.status}`);
        }

        const releases = await response.json();

        if (!Array.isArray(releases)) {
            throw new Error("Invalid GitHub release response.");
        }

        // GitHub normally returns releases newest first.
        // Select the newest published release that contains an APK.
        const release = releases
            .filter(item =>
                item.draft === false &&
                item.published_at &&
                Array.isArray(item.assets) &&
                item.assets.some(asset =>
                    asset.name?.toLowerCase().endsWith(".apk")
                )
            )
            .sort((a, b) =>
                new Date(b.published_at) - new Date(a.published_at)
            )[0];

        if (!release) {
            throw new Error("No published release with an APK was found.");
        }

        const apk = findApkAsset(release.assets);

        if (!apk) {
            throw new Error("The APK asset could not be found.");
        }

        const version =
            extractVersionFromApk(apk.name) ||
            extractVersionFromRelease(release.name) ||
            extractVersionFromRelease(release.tag_name) ||
            "Unknown";

        const title = release.name || release.tag_name || "Bonding Release";
        const publishedDate = formatDate(release.published_at);

        // Update hero version.
        if (versionElement) {
            versionElement.textContent =
                version === "Unknown" ? version : `v${version}`;
        }

        // Update release version.
        if (releaseVersion) {
            releaseVersion.textContent =
                version === "Unknown"
                    ? "Latest Bonding release"
                    : `Bonding v${version}`;
        }

        // Update release title.
        if (releaseTitle) {
            releaseTitle.textContent = title;
        }

        // Update release date.
        if (releaseDate) {
            releaseDate.textContent = publishedDate;
        }

        // Render release notes safely.
        if (releaseNotes) {
            const notes = release.body?.trim() ||
                "No release notes available.";

            releaseNotes.innerHTML = `
                <strong>What's new</strong>
                <br>
                ${escapeHtml(notes).replace(/\r?\n/g, "<br>")}
            `;
        }

        // Set direct APK download.
        if (downloadButton) {
            downloadButton.href = apk.browser_download_url;
            downloadButton.textContent = "Download APK";
            downloadButton.classList.remove("disabled");
            downloadButton.removeAttribute("aria-disabled");
            downloadButton.setAttribute("download", apk.name);
        }

        console.log("Latest Bonding release loaded:", {
            title,
            version,
            tag: release.tag_name,
            apk: apk.name,
            date: publishedDate
        });

    } catch (error) {
        console.error("Unable to load Bonding release:", error);

        if (versionElement) {
            versionElement.textContent = "Unavailable";
        }

        if (releaseVersion) {
            releaseVersion.textContent = "Release unavailable";
        }

        if (releaseTitle) {
            releaseTitle.textContent = "Please try again later.";
        }

        if (releaseDate) {
            releaseDate.textContent = "—";
        }

        if (releaseNotes) {
            releaseNotes.textContent =
                "Unable to load release information. Please try again later.";
        }

        if (downloadButton) {
            downloadButton.textContent = "Download unavailable";
            downloadButton.classList.add("disabled");
            downloadButton.setAttribute("aria-disabled", "true");
            downloadButton.removeAttribute("href");
        }
    }
}

function findApkAsset(assets) {
    if (!Array.isArray(assets)) {
        return null;
    }

    const apkAssets = assets
        .filter(asset =>
            typeof asset.name === "string" &&
            asset.name.toLowerCase().endsWith(".apk") &&
            typeof asset.browser_download_url === "string"
        )
        .map(asset => ({
            ...asset,
            version: extractVersionFromApk(asset.name)
        }))
        .filter(asset => asset.version !== null);

    if (apkAssets.length === 0) {
        return null;
    }

    // Sort by version number, highest first.
    apkAssets.sort((a, b) =>
        compareVersions(b.version, a.version)
    );

    return apkAssets[0];
}

function compareVersions(a, b) {
    const versionA = a.split(/[.-]/).map(Number);
    const versionB = b.split(/[.-]/).map(Number);

    const length = Math.max(versionA.length, versionB.length);

    for (let i = 0; i < length; i++) {
        const partA = versionA[i] || 0;
        const partB = versionB[i] || 0;

        if (partA !== partB) {
            return partA - partB;
        }
    }

    return 0;
}

function extractVersionFromApk(filename) {
    if (!filename) {
        return null;
    }

    const match = String(filename).match(
        /v?(\d+\.\d+\.\d+(?:[.-]\d+)*)/i
    );

    return match ? match[1] : null;
}

function extractVersionFromRelease(title) {
    if (!title) {
        return null;
    }

    const match = String(title).match(
        /v?(\d+\.\d+\.\d+(?:[.-]\d+)*)/i
    );

    return match ? match[1] : null;
}

function formatDate(dateString) {
    if (!dateString) {
        return "Unknown release date";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Unknown release date";
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

