# Soma Calculator

A responsive, client-side calculator built with HTML, CSS, and vanilla JavaScript. It runs directly in a browser and is ready to publish with GitHub Pages. No server, build step, dependencies, or account credentials are needed.

## Features

- Addition, subtraction, multiplication, division, decimals, percentages, and sign toggle
- Chained and repeated-equals calculations, clear, and delete
- Floating-point cleanup and friendly handling for division by zero and out-of-range results
- Keyboard controls for digits, decimal, operators, Enter, Backspace, Escape, and `%`
- Recent calculation history and light/dark theme, both saved in local storage
- Responsive layout, visible keyboard focus, descriptive button labels, and reduced-motion support

## Project structure

```text
Calculator-WebApp/
├── index.html              # Root entry point for local use and GitHub Pages
├── README.md
├── .gitignore
├── frontend/
│   ├── index.html          # Calculator interface
│   ├── style.css
│   └── script.js
└── backend/
	└── README.md          # Explains why no server code is needed
```

The root `index.html` forwards to `frontend/`. The calculator and its relative asset links live in `frontend/`, so GitHub Pages project URLs with a repository-name path work without hardcoded hostnames.

## Run locally

Open `index.html` in the repository root in a modern browser. You can also open `frontend/index.html` directly. There is no install or build step. Browser storage may be restricted when opening a `file:` URL; calculations still work, but history and theme persistence require browser storage to be available. For testing persistence, use a local static server or the deployed Pages URL.

## Publish to GitHub

Create an empty repository on GitHub, then run these commands from this project folder (replace the URL with your repository URL):

```sh
git init
git add .
git commit -m "Build Soma calculator website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If this folder is already a Git repository, skip `git init`. If `origin` already exists, update it with `git remote set-url origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git` instead of adding it again.

## Enable GitHub Pages

1. Open the repository on GitHub and choose **Settings**.
2. In the left sidebar, open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder, then select **Save**.
5. Wait for the Pages deployment to finish. GitHub displays the live URL in **Settings → Pages**. A project site usually has the form `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

The root entry point forwards to `frontend/`, so the published calculator continues to load from the project subpath. No custom domain is required.

## Update the live site

Edit the files in `frontend/`, then publish the changes:

```sh
git add .
git commit -m "Update calculator"
git push
```

GitHub Pages rebuilds the site from the new `main` commit. Allow a short time for deployment, then refresh the URL; a hard refresh can clear a stale browser cache.

## Troubleshooting

- **404 or wrong page:** Check that Pages uses `main` and `/ (root)`, and that the root `index.html` was committed.
- **Styles or JavaScript missing:** Keep the `frontend/` folder name unchanged and retain the relative `./style.css` and `./script.js` links in `frontend/index.html`.
- **Changes are not visible:** Check the Pages deployment status under **Actions**, confirm the latest commit reached `main`, and hard-refresh the site.
- **History or theme does not persist:** Ensure browser storage is enabled and test on the same browser and site URL. Local storage is isolated per browser and origin.
- **Git push is rejected:** Pull or resolve repository history as appropriate, then push again. Never replace existing remote work blindly.

## Quick quality checklist

- [x] All requested calculator controls and keyboard input are implemented.
- [x] Results are rounded to 12 significant digits; invalid and zero-divisor operations show a message.
- [x] History and theme preference use local storage.
- [x] Layout adapts to mobile and desktop widths; controls have accessible labels and focus styling.
- [x] Relative asset URLs support a GitHub Pages repository subpath.
- [x] Browser-tested addition, subtraction, multiplication, division, decimals, percent, chained/repeated calculations, invalid operator sequences, sign toggle, and divide-by-zero/out-of-range errors.
- [x] Browser-tested keyboard entry, Enter, Backspace, Escape, DEL, history clear, and local-storage history/theme persistence across reloads.
- [x] Browser-tested responsive layout at 390px and 1440px with no horizontal overflow; no browser console errors were observed.
- [x] Opened the root `index.html` directly and confirmed it forwards to the working calculator without a development server.