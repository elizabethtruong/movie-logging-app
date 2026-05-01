// Renders the navbar shared across pages and marks the current page's link active.
const NAV_LINKS = [
  { href: "/logmovie.html",  label: "Log Movie", page: "log-movie"  },
  { href: "/watchlist.html", label: "Watchlist",  page: "watchlist"  },
  { href: "/dashboard.html", label: "Dashboard",  page: "dashboard"  },
  { href: "/profile.html",   label: "Profile",    page: "profile"    },
  { href: "/about.html",     label: "About",      page: "about"      },
  { href: "/contact.html",   label: "Contact",    page: "contact"    },
  { href: "/faq.html",       label: "FAQ",        page: "faq"        },
];

const navEl = document.getElementById("siteNav");

if (navEl) {
  const currentPage = document.body.dataset.page;

  const items = NAV_LINKS.map(({ href, label, page }) => {
    const active = page === currentPage ? " active" : "";
    return `<li class="nav-item"><a class="nav-link${active}" href="${href}">${label}</a></li>`;
  }).join("\n          ");

  navEl.innerHTML = `
    <div class="container">
      <a class="navbar-brand" href="/index.html">Movie Log</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navLinks">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navLinks">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          ${items}
        </ul>
      </div>
    </div>
  `;
}
