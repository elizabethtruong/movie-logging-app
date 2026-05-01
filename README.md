# Movie Log

A personal movie journal for tracking what you watch, managing a watchlist, and exploring film details. Everything is stored locally in the browser with no account required. This project was created for COMP 6970 - Assistive and Accessible Computing.

Authors: Tyler Nguyen and Elizabeth Truong

## Features

- **Log movies** — record a title, date watched, rating, and review
- **Watchlist** — search OMDb and save films you want to watch next; logged movies are automatically removed from the watchlist
- **Dashboard** — stats (this month, this year, all-time, average rating) alongside recent logs and your watchlist
- **Profile** — browse, edit, and delete your full watch history
- **Movie details** — full OMDb metadata (plot, cast, ratings, runtime) for any logged or watchlisted title
- **No account necessary** — all data is stored in `localStorage` on the device

## Project structure

```
├── index.html          Landing page
├── dashboard.html      Stats + recent activity
├── logmovie.html       OMDb search + log form
├── watchlist.html      Watchlist management
├── profile.html        Full watch history (edit / delete)
├── moviedetails.html  Full OMDb detail view
├── about.html          About the app
├── contact.html        Contact info
├── faq.html            Frequently Asked Questions
├── css/
│   └── style.css       Custom styles (CSS/Bootstrap)
└── js/
    ├── nav.js          Navigation bar for site
    └── app.js          All application logic
```

## Data storage

All data lives in two `localStorage` keys:

| Key | Contents |
|-----|----------|
| `movieLog.watchlist` | Array of OMDb movie objects |
| `movieLog.watched` | Array of logged movie objects with `DateWatched`, `Rating`, and `Review` |

Clearing browser storage will erase all data.
