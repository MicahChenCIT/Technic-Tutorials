# Technic Tutorials — HTML/CSS website

Open `index.html` in a browser (or upload the folder to any static host such as GitHub Pages or Netlify).

## Pages
| File | Screen |
|---|---|
| `index.html` | Sign in / Create account (first page — everything else is locked until you sign in) |
| `explore.html` | Explore feed: search, Recent/Popular, tag filters, project cards |
| `project.html` | Project post: gallery, upvote, reactions, report panel, build steps, comments |
| `create.html` | Share a project: photos, description editor, build steps, tags, checklist |
| `settings.html` | Profile, account & password, notifications, privacy, display |
| `profile.html` | My projects with Edit / Delete |
| `styles.css` | All styling (navy · light blue · cream design system; colors are variables at the top) |
| `app.js` | Sign-in lock and all button behaviour |

## About sign-in
Accounts are saved in the browser's local storage, so this is a working front-end prototype, not real security.
Before going live, connect the sign-in and sign-up forms in `index.html` to a real backend (for example Firebase Auth or your school's Google sign-in) and restrict sign-up to the school email domain.
