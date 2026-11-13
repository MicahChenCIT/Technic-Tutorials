/* =========================================================
   Technic Tutorials — shared behaviour
   - Sign in / create account (stored in this browser)
   - Locks every page except index.html until signed in
   - Explore feed, post interactions, create form, settings
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Safe storage ---------- */
  var mem = {};
  function load(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return key in mem ? mem[key] : fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { mem[key] = value; }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { delete mem[key]; }
  }

  /* ---------- Session ---------- */
  function getSession() { return load("tt_session", null); }
  function initials(name) {
    var parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    var a = parts[0][0] || "";
    var b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] || "");
    return (a + b).toUpperCase();
  }

  var body = document.body;
  var session = getSession();

  // Lock protected pages
  if (body.hasAttribute("data-protected") && !session) {
    window.location.replace("index.html");
    return;
  }
  // Signed-in users skip the sign-in page
  if (body.hasAttribute("data-auth-page") && session) {
    window.location.replace("explore.html");
    return;
  }

  // Fill avatar initials / names
  if (session) {
    document.querySelectorAll("[data-user-initials]").forEach(function (el) { el.textContent = initials(session.name); });
    document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = session.name; });
    document.querySelectorAll("[data-user-first]").forEach(function (el) { el.textContent = session.name.split(" ")[0]; });
    document.querySelectorAll("[data-user-email]").forEach(function (el) { el.value = session.email; });
  }

  // Sign out buttons
  document.querySelectorAll("[data-signout]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      remove("tt_session");
      window.location.href = "index.html";
    });
  });

  /* ---------- Toast ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
  document.querySelectorAll("[data-toast]").forEach(function (el) {
    el.addEventListener("click", function () { toast(el.getAttribute("data-toast")); });
  });

  /* ---------- Generic segmented controls ---------- */
  document.querySelectorAll(".segmented").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var btn = e.target.closest(".seg");
      if (!btn) return;
      group.querySelectorAll(".seg").forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
      group.dispatchEvent(new CustomEvent("change", { detail: btn.dataset.value }));
    });
  });

  /* =========================================================
     SIGN IN / CREATE ACCOUNT
     ========================================================= */
  var authTabs = document.getElementById("auth-tabs");
  if (authTabs) {
    var signinForm = document.getElementById("signin-form");
    var signupForm = document.getElementById("signup-form");

    function showMode(mode) {
      signinForm.hidden = mode !== "signin";
      signupForm.hidden = mode !== "signup";
      authTabs.querySelectorAll(".seg").forEach(function (b) {
        b.setAttribute("aria-selected", String(b.dataset.value === mode));
      });
      clearErrors();
    }
    authTabs.addEventListener("change", function (e) { showMode(e.detail); });
    document.querySelectorAll("[data-switch-mode]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); showMode(a.dataset.switchMode); });
    });
    if (window.location.hash === "#signup") showMode("signup");

    function clearErrors() {
      document.querySelectorAll(".auth-form .error").forEach(function (el) { el.textContent = ""; });
    }
    function setError(id, msg) { document.getElementById(id).textContent = msg; }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    signinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors();
      var email = signinForm.email.value.trim().toLowerCase();
      var pw = signinForm.password.value;
      var ok = true;
      if (!validEmail(email)) { setError("si-email-err", "Enter your school email."); ok = false; }
      if (!pw) { setError("si-pw-err", "Enter your password."); ok = false; }
      if (!ok) return;
      var users = load("tt_users", {});
      var user = users[email];
      if (!user) { setError("si-form-err", "No account uses that email yet. Create one first."); return; }
      if (user.password !== pw) { setError("si-form-err", "That password doesn't match. Try again."); return; }
      save("tt_session", { name: user.name, email: email });
      window.location.href = "explore.html";
    });

    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors();
      var name = signupForm.name.value.trim();
      var email = signupForm.email.value.trim().toLowerCase();
      var pw = signupForm.password.value;
      var agreed = signupForm.coc.checked;
      var ok = true;
      if (name.length < 2) { setError("su-name-err", "Enter your first name and last initial."); ok = false; }
      if (!validEmail(email)) { setError("su-email-err", "Enter a valid school email."); ok = false; }
      if (pw.length < 8) { setError("su-pw-err", "Use at least 8 characters."); ok = false; }
      if (!agreed) { setError("su-coc-err", "You need to agree to the Code of Conduct to join."); ok = false; }
      if (!ok) return;
      var users = load("tt_users", {});
      if (users[email]) { setError("su-email-err", "An account already uses this email. Sign in instead."); return; }
      users[email] = { name: name, password: pw };
      save("tt_users", users);
      save("tt_session", { name: name, email: email });
      window.location.href = "explore.html";
    });

    // Show / hide password
    document.querySelectorAll("[data-toggle-pw]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = document.getElementById(btn.dataset.togglePw);
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Hide" : "Show";
        btn.setAttribute("aria-pressed", String(show));
      });
    });
  }

  /* =========================================================
     EXPLORE FEED
     ========================================================= */
  var PROJECTS = [
    { title: "Mind-controlled cursor with an EEG headset", overview: "Move your mouse just by concentrating. A low-cost EEG headband, Python signal filtering and a quick calibration step.", author: "John S.", tags: ["BCI", "Python"], upvotes: 48, comments: 12, order: 9 },
    { title: "Arduino plant-watering station", overview: "A soil-moisture sensor triggers a small pump when the plant gets dry, and logs every reading to an SD card.", author: "Mou G.", tags: ["Arduino", "Electronics"], upvotes: 35, comments: 8, order: 8 },
    { title: "3D-printed 4-axis robotic arm", overview: "Printed in PLA and driven by four servos. STL files, wiring diagram and Arduino sketch all included.", author: "Saifi M.", tags: ["3D Printing", "Robotics"], upvotes: 61, comments: 15, order: 7 },
    { title: "Portfolio site with no frameworks", overview: "Plain HTML, CSS and a little JavaScript. Covers layout, a dark-mode toggle and free hosting.", author: "Swaraa S.", tags: ["Web Dev"], upvotes: 22, comments: 5, order: 6 },
    { title: "Raspberry Pi weather dashboard", overview: "Temperature, humidity and pressure sensors feeding a live dashboard on a 7-inch touchscreen.", author: "Micah C.", tags: ["Raspberry Pi", "Python"], upvotes: 29, comments: 6, order: 5 },
    { title: "Pixel-art platformer in Godot", overview: "Three levels, a boss fight and a save system. Step-by-step guide to tilemaps and player movement.", author: "Mou G.", tags: ["Game Dev"], upvotes: 40, comments: 11, order: 4 },
    { title: "LED matrix scoreboard", overview: "A 32x16 LED panel that keeps score for table tennis, controlled from two big arcade buttons.", author: "Micah C.", tags: ["Electronics"], upvotes: 18, comments: 3, order: 3 },
    { title: "Flashcard quiz app in Python", overview: "Make your own decks, quiz yourself and track which cards you keep missing.", author: "Swaraa S.", tags: ["Python"], upvotes: 14, comments: 2, order: 2 },
    { title: "Line-following robot", overview: "Two IR sensors, a motor driver and a PID loop that keeps it on a taped track.", author: "Saifi M.", tags: ["Robotics", "Arduino"], upvotes: 33, comments: 9, order: 1 }
  ];

  var feed = document.getElementById("feed");
  if (feed) {
    var state = { sort: "recent", tag: null, q: "" };
    var ICON_UP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    var ICON_CMT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';

    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

    function render() {
      var list = PROJECTS.slice();
      var all = list.concat(load("tt_my_projects", []));
      list = all;
      if (state.tag) list = list.filter(function (p) { return p.tags.indexOf(state.tag) !== -1; });
      if (state.q) {
        var q = state.q.toLowerCase();
        list = list.filter(function (p) {
          return (p.title + " " + p.overview + " " + p.author + " " + p.tags.join(" ")).toLowerCase().indexOf(q) !== -1;
        });
      }
      list.sort(state.sort === "popular"
        ? function (a, b) { return b.upvotes - a.upvotes; }
        : function (a, b) { return b.order - a.order; });

      var status = document.getElementById("feed-status");
      var bits = [];
      if (state.q) bits.push('matching “' + esc(state.q) + '”');
      if (state.tag) bits.push("tagged " + esc(state.tag));
      status.innerHTML = bits.length
        ? "<strong>" + list.length + " project" + (list.length === 1 ? "" : "s") + "</strong> " + bits.join(" and ") +
          ' · <a href="#" id="clear-filters">Clear</a>'
        : "";
      var clear = document.getElementById("clear-filters");
      if (clear) clear.addEventListener("click", function (e) {
        e.preventDefault(); state.tag = null; state.q = ""; document.getElementById("hero-q").value = ""; syncChips(); render();
      });

      if (!list.length) {
        feed.innerHTML = '<p class="empty" style="grid-column:1/-1">No projects match yet. Try another tag or search.</p>';
        return;
      }
      feed.innerHTML = list.map(function (p) {
        return '<a class="project-card" href="project.html">' +
          '<div class="photo-ph">first project photo</div>' +
          '<div class="body">' +
            '<div class="row wrap gap-6">' + p.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
            "<h2>" + esc(p.title) + "</h2>" +
            '<p class="overview">' + esc(p.overview) + "</p>" +
            '<div class="card-foot">' +
              '<span class="row gap-8" style="font-weight:500"><span class="avatar avatar-light" style="width:28px;height:28px;font-size:11px">' + esc(initials(p.author)) + "</span>" + esc(p.author) + "</span>" +
              '<span class="row gap-12">' +
                '<span class="stat" aria-label="' + p.upvotes + ' upvotes">' + ICON_UP + p.upvotes + "</span>" +
                '<span class="stat" aria-label="' + p.comments + ' comments">' + ICON_CMT + p.comments + "</span>" +
              "</span>" +
            "</div>" +
          "</div></a>";
      }).join("");
    }

    function syncChips() {
      document.querySelectorAll("#tag-chips .chip").forEach(function (c) {
        var on = c.dataset.tag === state.tag;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
    }

    document.getElementById("sort-tabs").addEventListener("change", function (e) { state.sort = e.detail; render(); });
    document.getElementById("tag-chips").addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      state.tag = state.tag === chip.dataset.tag ? null : chip.dataset.tag;
      syncChips(); render();
    });
    document.getElementById("hero-search").addEventListener("submit", function (e) {
      e.preventDefault();
      state.q = document.getElementById("hero-q").value.trim();
      render();
      document.getElementById("feed-controls").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("load-more").addEventListener("click", function () {
      toast("You've reached the end of the feed for now.");
    });
    render();
  }

  /* =========================================================
     PROJECT POST
     ========================================================= */
  var upvoteBtn = document.getElementById("upvote");
  if (upvoteBtn) {
    var base = 48;
    upvoteBtn.addEventListener("click", function () {
      var on = upvoteBtn.getAttribute("aria-pressed") !== "true";
      upvoteBtn.setAttribute("aria-pressed", String(on));
      upvoteBtn.querySelector(".label").textContent = (on ? "Upvoted · " : "Upvote · ") + (base + (on ? 1 : 0));
    });

    document.querySelectorAll(".reaction").forEach(function (btn) {
      var baseCount = parseInt(btn.dataset.count, 10);
      var startsOn = btn.getAttribute("aria-pressed") === "true";
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(on));
        btn.querySelector(".count").textContent = baseCount + (on ? 1 : 0) - (startsOn ? 1 : 0);
      });
    });

    var reportPanel = document.getElementById("report-panel");
    document.querySelectorAll("[data-report-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        reportPanel.hidden = !reportPanel.hidden;
        document.getElementById("report-btn").setAttribute("aria-expanded", String(!reportPanel.hidden));
      });
    });
    document.getElementById("send-report").addEventListener("click", function () {
      var picked = reportPanel.querySelector('input[name="reason"]:checked');
      if (!picked) { toast("Pick a reason first."); return; }
      reportPanel.hidden = true;
      picked.checked = false;
      toast("Report sent to CIT faculty moderators.");
    });

    // Gallery thumbnails
    var mainLabel = document.getElementById("gallery-label");
    var countLabel = document.getElementById("gallery-count");
    document.querySelectorAll(".thumb").forEach(function (t, i) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".thumb").forEach(function (x) { x.removeAttribute("aria-current"); });
        t.setAttribute("aria-current", "true");
        mainLabel.textContent = "project photo " + (i + 1) + " of 6";
        countLabel.textContent = (i + 1) + " / 6";
      });
    });

    // Comments
    var cform = document.getElementById("comment-form");
    var clist = document.getElementById("comment-list");
    var ccount = document.getElementById("comment-count");
    var total = 12;
    cform.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = cform.comment.value.trim();
      if (!text) { toast("Write something first."); return; }
      var s = getSession() || { name: "You" };
      var div = document.createElement("div");
      div.className = "comment";
      div.innerHTML =
        '<span class="avatar avatar-light" style="width:38px;height:38px;font-size:13px"></span>' +
        '<div class="stack gap-4" style="flex:1 1 auto;min-width:0">' +
          '<div class="row wrap gap-8 small" style="align-items:baseline"><strong></strong><span class="muted">Just now</span></div>' +
          "<p></p>" +
          '<div class="row gap-16 actions"><button type="button">Reply</button><button type="button">Report</button></div>' +
        "</div>";
      div.querySelector(".avatar").textContent = initials(s.name);
      div.querySelector("strong").textContent = s.name;
      div.querySelector("p").textContent = text;
      clist.insertBefore(div, clist.firstChild);
      cform.reset();
      total += 1;
      ccount.textContent = total;
      document.getElementById("show-all").textContent = "Show all " + total + " comments";
      toast("Comment posted.");
    });
    clist.addEventListener("click", function (e) {
      var b = e.target.closest(".actions button");
      if (!b) return;
      toast(b.textContent === "Report" ? "Comment reported to moderators." : "Replies are coming soon.");
    });
  }

  /* =========================================================
     CREATE A PROJECT
     ========================================================= */
  var createForm = document.getElementById("create-form");
  if (createForm) {
    var ov = document.getElementById("c-ov");
    var ovCount = document.getElementById("ov-count");
    var title = document.getElementById("c-title");
    var desc = document.getElementById("c-desc");
    var tagBox = document.getElementById("tag-box");
    var tagInput = document.getElementById("c-tags");
    var photoGrid = document.getElementById("photo-grid");
    var photoCount = document.getElementById("photo-count");
    var tags = ["Robotics", "Arduino"];
    var photos = 3;

    function checklist() {
      var checks = {
        title: title.value.trim().length > 0,
        photo: photos > 0,
        tag: tags.length > 0,
        overview: ov.value.trim().length > 0,
        desc: desc.value.trim().length > 0
      };
      Object.keys(checks).forEach(function (k) {
        document.querySelector('[data-check="' + k + '"]').classList.toggle("done", checks[k]);
      });
      return checks;
    }

    function renderTags() {
      tagBox.querySelectorAll(".tag-pill").forEach(function (p) { p.remove(); });
      tags.forEach(function (t) {
        var pill = document.createElement("span");
        pill.className = "tag-pill";
        pill.textContent = t;
        var x = document.createElement("button");
        x.type = "button";
        x.setAttribute("aria-label", "Remove " + t);
        x.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        x.addEventListener("click", function () { tags = tags.filter(function (y) { return y !== t; }); renderTags(); });
        pill.appendChild(x);
        tagBox.insertBefore(pill, tagInput);
      });
      checklist();
    }
    function addTag(t) {
      t = t.trim().replace(/^\+\s*/, "");
      if (!t || tags.indexOf(t) !== -1) return;
      tags.push(t); renderTags();
    }
    tagInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput.value); tagInput.value = ""; }
      if (e.key === "Backspace" && !tagInput.value && tags.length) { tags.pop(); renderTags(); }
    });
    document.querySelectorAll("[data-add-tag]").forEach(function (b) {
      b.addEventListener("click", function () { addTag(b.dataset.addTag); });
    });

    function renderPhotos() {
      photoGrid.querySelectorAll(".photo-tile").forEach(function (t) { t.remove(); });
      var addBtn = document.getElementById("add-photo");
      for (var i = 0; i < photos; i++) {
        var tile = document.createElement("div");
        tile.className = "photo-tile photo-ph" + (i === 0 ? " cover" : "");
        tile.innerHTML = (i === 0 ? '<span class="cover-badge">Cover</span>' : "") +
          '<button type="button" class="tile-remove" aria-label="Remove photo ' + (i + 1) + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
        tile.querySelector(".tile-remove").addEventListener("click", function () { photos -= 1; renderPhotos(); });
        photoGrid.insertBefore(tile, addBtn);
      }
      addBtn.hidden = photos >= 10;
      photoCount.textContent = photos + " of 10 · the first photo is the cover";
      checklist();
    }
    document.getElementById("add-photo").addEventListener("click", function () {
      if (photos < 10) { photos += 1; renderPhotos(); }
    });

    ov.addEventListener("input", function () { ovCount.textContent = ov.value.length + " / 200"; checklist(); });
    [title, desc].forEach(function (el) { el.addEventListener("input", checklist); });

    // Build steps
    var stepsToggle = document.getElementById("steps-toggle");
    var stepsWrap = document.getElementById("steps-wrap");
    var stepList = document.getElementById("step-list");
    stepsToggle.addEventListener("change", function () { stepsWrap.hidden = !stepsToggle.checked; });
    function renumber() {
      stepList.querySelectorAll(".step-edit").forEach(function (s, i) {
        s.querySelector(".step-num").textContent = String(i + 1).padStart(2, "0");
      });
    }
    stepList.addEventListener("click", function (e) {
      if (e.target.closest("[data-remove-step]")) {
        if (stepList.children.length > 1) { e.target.closest(".step-edit").remove(); renumber(); }
        else toast("Keep at least one step, or turn steps off.");
      }
      if (e.target.closest("[data-step-image]")) toast("Image added to this step.");
    });
    document.getElementById("add-step").addEventListener("click", function () {
      var n = stepList.children.length + 1;
      var tpl = document.getElementById("step-template").content.cloneNode(true);
      tpl.querySelector(".step-num").textContent = String(n).padStart(2, "0");
      stepList.appendChild(tpl);
      stepList.lastElementChild.querySelector("input").focus();
    });

    // Toolbar (wraps selection in markdown-style markers)
    document.querySelectorAll(".tool").forEach(function (b) {
      b.addEventListener("click", function () {
        var wrap = { bold: ["**", "**"], italic: ["_", "_"], heading: ["## ", ""], list: ["- ", ""], code: ["`", "`"], link: ["[", "](https://)"] }[b.dataset.fmt];
        var s = desc.selectionStart, en = desc.selectionEnd, v = desc.value;
        desc.value = v.slice(0, s) + wrap[0] + v.slice(s, en) + wrap[1] + v.slice(en);
        desc.focus(); checklist();
      });
    });

    document.getElementById("save-draft").addEventListener("click", function () { toast("Draft saved."); });

    createForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = checklist();
      var missing = [];
      if (!c.title) missing.push("a title");
      if (!c.overview) missing.push("an overview");
      if (!c.desc) missing.push("a description");
      if (!c.photo) missing.push("a photo");
      if (!c.tag) missing.push("a tag");
      if (missing.length) { toast("Add " + missing.join(", ") + " before publishing."); return; }
      var s = getSession();
      var mine = load("tt_my_projects", []);
      mine.push({ title: title.value.trim(), overview: ov.value.trim(), author: s.name, tags: tags.slice(), upvotes: 0, comments: 0, order: 100 + mine.length, date: "Today" });
      save("tt_my_projects", mine);
      window.location.href = "profile.html";
    });

    renderTags(); renderPhotos();
  }

  /* =========================================================
     SETTINGS
     ========================================================= */
  var settingsNav = document.getElementById("settings-nav");
  if (settingsNav) {
    var links = settingsNav.querySelectorAll("a");
    function setActive(id) {
      links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + id); });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
      }, { rootMargin: "-30% 0px -60% 0px" });
      document.querySelectorAll(".settings-card").forEach(function (s) { io.observe(s); });
    }
    links.forEach(function (a) { a.addEventListener("click", function () { setActive(a.getAttribute("href").slice(1)); }); });

    // Prefill display name
    var nameField = document.getElementById("st-name");
    var sess = getSession();
    if (sess) nameField.value = sess.name;

    document.getElementById("save-profile").addEventListener("click", function () {
      var newName = nameField.value.trim();
      if (newName.length < 2) { toast("Enter a display name."); return; }
      var s2 = getSession();
      s2.name = newName;
      save("tt_session", s2);
      var users = load("tt_users", {});
      if (users[s2.email]) { users[s2.email].name = newName; save("tt_users", users); }
      document.querySelectorAll("[data-user-initials]").forEach(function (el) { el.textContent = initials(newName); });
      toast("Profile saved.");
    });

    document.getElementById("update-pw").addEventListener("click", function () {
      var cur = document.getElementById("st-pw0").value;
      var p1 = document.getElementById("st-pw1").value;
      var p2 = document.getElementById("st-pw2").value;
      var s3 = getSession();
      var users = load("tt_users", {});
      var u = users[s3.email];
      if (!u || u.password !== cur) { toast("Your current password isn't right."); return; }
      if (p1.length < 8) { toast("New password needs at least 8 characters."); return; }
      if (p1 !== p2) { toast("The new passwords don't match."); return; }
      u.password = p1; save("tt_users", users);
      ["st-pw0", "st-pw1", "st-pw2"].forEach(function (id) { document.getElementById(id).value = ""; });
      toast("Password updated.");
    });

    // Switches (saved)
    var prefs = load("tt_notifs", {});
    document.querySelectorAll(".switch").forEach(function (sw) {
      var key = sw.dataset.key;
      if (key in prefs) sw.setAttribute("aria-checked", String(prefs[key]));
      sw.addEventListener("click", function () {
        var on = sw.getAttribute("aria-checked") !== "true";
        sw.setAttribute("aria-checked", String(on));
        prefs[key] = on; save("tt_notifs", prefs);
      });
    });
  }

  /* =========================================================
     PROFILE
     ========================================================= */
  var myGrid = document.getElementById("my-projects");
  if (myGrid) {
    var defaults = [
      { title: "Mind-controlled cursor with an EEG headset", date: "Oct 30", upvotes: 48, order: 4 },
      { title: "Desk-lamp that dims with ambient light", date: "Oct 12", upvotes: 27, order: 3 },
      { title: "Python script that sorts my downloads", date: "Sep 24", upvotes: 21, order: 2 },
      { title: "Cardboard VR viewer with a phone", date: "Sep 8", upvotes: 16, order: 1 }
    ];
    var removed = load("tt_removed_defaults", []);
    var sortSel = document.getElementById("psort");

    function allMine() {
      var mine = load("tt_my_projects", []).map(function (p, i) { return Object.assign({ mine: i }, p); });
      return mine.concat(defaults.filter(function (d) { return removed.indexOf(d.title) === -1; }));
    }
    function renderMine() {
      var list = allMine();
      list.sort(sortSel.value === "upvoted"
        ? function (a, b) { return b.upvotes - a.upvotes; }
        : function (a, b) { return b.order - a.order; });
      document.getElementById("stat-projects").textContent = list.length;
      document.getElementById("stat-upvotes").textContent = list.reduce(function (n, p) { return n + p.upvotes; }, 0);
      if (!list.length) { myGrid.innerHTML = '<p class="empty" style="grid-column:1/-1">No projects yet. <a href="create.html">Share your first one.</a></p>'; return; }
      myGrid.innerHTML = "";
      list.forEach(function (p) {
        var card = document.createElement("div");
        card.className = "card mine-card";
        card.innerHTML =
          '<a href="project.html"><div class="photo-ph">project photo</div><div class="body"><h3></h3>' +
          '<p class="small muted"><span class="d"></span> · <span class="u"></span> upvotes</p></div></a>' +
          '<div class="mine-actions"><button type="button" data-act="edit">Edit</button><button type="button" data-act="delete">Delete</button></div>';
        card.querySelector("h3").textContent = p.title;
        card.querySelector(".d").textContent = p.date || "Today";
        card.querySelector(".u").textContent = p.upvotes;
        card.querySelector('[data-act="edit"]').addEventListener("click", function () { window.location.href = "create.html"; });
        card.querySelector('[data-act="delete"]').addEventListener("click", function () {
          if (!window.confirm("Delete “" + p.title + "”? This can't be undone.")) return;
          if (typeof p.mine === "number") {
            var mine = load("tt_my_projects", []); mine.splice(p.mine, 1); save("tt_my_projects", mine);
          } else { removed.push(p.title); save("tt_removed_defaults", removed); }
          renderMine(); toast("Project deleted.");
        });
        myGrid.appendChild(card);
      });
    }
    sortSel.addEventListener("change", renderMine);
    renderMine();
  }
})();
