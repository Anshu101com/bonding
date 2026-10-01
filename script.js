const GITHUB_OWNER = "anshu101com";
const GITHUB_REPOSITORY = "bonding";

const GITHUB_RELEASE_API =
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/releases/latest`;


document.addEventListener("DOMContentLoaded", () => {

    const yearElement =
        document.getElementById("year");

    if (yearElement) {
        yearElement.textContent =
            new Date().getFullYear();
    }

    loadLatestRelease();

});


async function loadLatestRelease() {

    const versionElement =
        document.getElementById("hero-version");

    const releaseVersion =
        document.getElementById("release-version");

    const releaseTitle =
        document.getElementById("release-title");

    const releaseDate =
        document.getElementById("release-date");

    const downloadButton =
        document.getElementById("download-button");

    const releaseNotes =
        document.getElementById("release-notes");


    try {

        const response = await fetch(
            GITHUB_RELEASE_API,
            {
                headers: {
                    "Accept":
                        "application/vnd.github+json"
                },

                cache: "no-store"
            }
        );


        if (!response.ok) {
            throw new Error(
                `GitHub returned ${response.status}`
            );
        }


        const release =
            await response.json();


        const version =
            cleanVersion(release.tag_name);


        const title =
            release.name ||
            "Latest Bonding Release";


        const publishedDate =
            formatDate(
                release.published_at
            );


        const apk =
            findApkAsset(
                release.assets
            );


        if (versionElement) {
            versionElement.textContent =
                version;
        }


        if (releaseVersion) {
            releaseVersion.textContent =
                `Bonding ${version}`;
        }


        if (releaseTitle) {
            releaseTitle.textContent =
                title;
        }


        if (releaseDate) {
            releaseDate.textContent =
                publishedDate;
        }


        if (releaseNotes) {

            const notes =
                release.body ||
                "No release notes available.";

            releaseNotes.innerHTML = `
                <strong>What's new</strong>
                <br>
                ${escapeHtml(notes)
                    .replace(/\n/g, "<br>")}
            `;
        }


        if (apk) {

            downloadButton.href =
                apk.browser_download_url;

            downloadButton.textContent =
                "Download APK";

            downloadButton.classList.remove(
                "disabled"
            );

            downloadButton.setAttribute(
                "download",
                apk.name
            );

        } else {

            downloadButton.textContent =
                "APK unavailable";

        }


    } catch (error) {

        console.error(
            "Unable to load latest release:",
            error
        );


        if (versionElement) {
            versionElement.textContent =
                "Unavailable";
        }


        if (releaseVersion) {
            releaseVersion.textContent =
                "Release unavailable";
        }


        if (releaseTitle) {
            releaseTitle.textContent =
                "Please try again later.";
        }


        if (downloadButton) {
            downloadButton.textContent =
                "Unavailable";

            downloadButton.classList.add(
                "disabled"
            );
        }

    }

}


function findApkAsset(assets) {

    if (!Array.isArray(assets)) {
        return null;
    }


    return assets.find(
        asset => {

            const name =
                asset.name.toLowerCase();

            return name.endsWith(".apk");

        }
    ) || null;

}


function cleanVersion(tag) {

    if (!tag) {
        return "Unknown";
    }


    return tag
        .replace(/^v/i, "")
        .trim();

}


function formatDate(dateString) {

    if (!dateString) {
        return "Unknown release date";
    }


    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}