const GITHUB_OWNER = "Anshu101com";
const GITHUB_REPOSITORY = "bonding";

const GITHUB_RELEASES_API =
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/releases`;

const TARGET_TAG = "beta_test";


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
            GITHUB_RELEASES_API,
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


        const releases =
            await response.json();


        if (!Array.isArray(releases)) {
            throw new Error(
                "GitHub returned an invalid release list."
            );
        }


        /*
         * Find the specific beta release.
         *
         * This allows the website to display
         * a GitHub PRE-RELEASE instead of relying
         * on /releases/latest.
         */
        const release =
            releases.find(
                item =>
                    item.tag_name === TARGET_TAG &&
                    item.draft === false
            );


        if (!release) {
            throw new Error(
                `Release "${TARGET_TAG}" was not found.`
            );
        }


        /*
         * Make sure this is actually a
         * pre-release.
         */
        if (!release.prerelease) {
            console.warn(
                `Release "${TARGET_TAG}" is not marked as a pre-release.`
            );
        }


        const version =
            extractVersionFromApk(
                release.assets
            ) ||
            extractVersionFromRelease(
                release.name
            ) ||
            "1.0.2";


        const title =
            release.name ||
            "Beta Testing";


        const publishedDate =
            formatDate(
                release.published_at
            );


        const apk =
            findApkAsset(
                release.assets
            );


        /*
         * Hero version
         */
        if (versionElement) {
            versionElement.textContent =
                version;
        }


        /*
         * Release version
         */
        if (releaseVersion) {

            releaseVersion.textContent =
                `Bonding ${version}`;

        }


        /*
         * Release title
         */
        if (releaseTitle) {

            releaseTitle.textContent =
                title;

        }


        /*
         * Release date
         */
        if (releaseDate) {

            releaseDate.textContent =
                publishedDate;

        }


        /*
         * Release notes
         */
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


        /*
         * APK download
         */
        if (apk) {

            downloadButton.href =
                apk.browser_download_url;

            downloadButton.textContent =
                "Download APK";

            downloadButton.classList.remove(
                "disabled"
            );

            downloadButton.removeAttribute(
                "aria-disabled"
            );

            downloadButton.setAttribute(
                "download",
                apk.name
            );

        } else {

            downloadButton.textContent =
                "APK unavailable";

            downloadButton.classList.add(
                "disabled"
            );

        }


    } catch (error) {

        console.error(
            "Unable to load Bonding release:",
            error
        );


        if (versionElement) {

            versionElement.textContent =
                "Unavailable";

        }


        if (releaseVersion) {

            releaseVersion.textContent =
                "Beta release unavailable";

        }


        if (releaseTitle) {

            releaseTitle.textContent =
                "Please try again later.";

        }


        if (releaseDate) {

            releaseDate.textContent =
                "—";

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


/*
 * Find APK asset.
 */
function findApkAsset(assets) {

    if (!Array.isArray(assets)) {
        return null;
    }


    return assets.find(
        asset => {

            const name =
                String(asset.name || "")
                    .toLowerCase();

            return name.endsWith(".apk");

        }
    ) || null;

}


/*
 * Extract version from APK name.
 *
 * Example:
 *
 * Bonding.Family.v1.0.2.Anshu101com.apk
 *
 * returns:
 *
 * 1.0.2
 */
function extractVersionFromApk(assets) {

    const apk =
        findApkAsset(assets);

    if (!apk || !apk.name) {
        return null;
    }


    const match =
        apk.name.match(
            /v(\d+\.\d+\.\d+)/i
        );


    if (!match) {
        return null;
    }


    return match[1];

}


/*
 * Fallback version extraction
 * from the release title.
 */
function extractVersionFromRelease(title) {

    if (!title) {
        return null;
    }


    const match =
        String(title).match(
            /v?(\d+\.\d+\.\d+)/i
        );


    if (!match) {
        return null;
    }


    return match[1];

}


/*
 * Format GitHub release date.
 */
function formatDate(dateString) {

    if (!dateString) {
        return "Unknown release date";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
        return "Unknown release date";
    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


/*
 * Escape release notes before
 * inserting them into HTML.
 */
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
