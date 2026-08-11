/* flow-live.js - the Daybreak pipeline floor (learn-data-pipelines-with-phoebe)
   A deterministic teaching simulator: break a stage, run the day, watch what the
   dashboard does. No real data moves; failures and catches are scripted from
   real incident patterns. Vanilla JS, no dependencies, themes itself from the
   site's CSS custom properties. */
(function () {
  "use strict";

  var mount = document.getElementById("flow-live");
  if (!mount) return;

  var css = getComputedStyle(document.documentElement);
  function v(name, fb) { var x = css.getPropertyValue(name).trim(); return x || fb; }
  var C = {
    accent: v("--indigo", "#0284C7"),
    deep: v("--indigo-deep", "#075985"),
    soft: v("--indigo-soft", "#7DD3FC"),
    tint: v("--indigo-50", "#E8F5FD"),
    ink: v("--ink", "#1C2B36"),
    muted: v("--muted", "#64707A"),
    hairline: v("--hairline", "#E3E9EF"),
    warm: v("--amber", "#C08A3E"),
    warmTint: v("--amber-50", "#F8F0E1"),
    warmInk: v("--amber-ink", "#3A2A0E"),
    red: "#991B1B", redSoft: "#FCA5A5", redTint: "#FEF2F2",
    green: "#0B7A4B", greenTint: "#E7F6EE"
  };

  /* ---------- the pipeline model (all numbers are canon - session 05 quotes them) ---------- */

  var GOOD = 18240;      // a healthy day of Daybreak revenue
  var YESTERDAY = 17980; // what the dashboard shows when today never arrives

  var STAGES = [
    { key: "source",    name: "Checkout app",  icon: "🛒", fail: "A promo-code update starts writing prices as text",       kind: "wrong", num: 9120,
      story: "Half the orders now carry a price the pipeline cannot read as a number. They quietly drop out of the total." },
    { key: "ingest",    name: "Ingest",        icon: "🚚", fail: "The 2am sync credential expired",                          kind: "stale", num: YESTERDAY,
      story: "Nothing arrived overnight. The warehouse still holds yesterday's orders - and the dashboard happily shows them." },
    { key: "warehouse", name: "Warehouse",     icon: "🏬", fail: "The storage quota filled up mid-load",                     kind: "stale", num: YESTERDAY,
      story: "The load stopped halfway and rolled back. Today's orders never landed on the shelf." },
    { key: "transform", name: "Transform",     icon: "🧼", fail: "A SQL change divides by the wrong column",                 kind: "wrong", num: 3648,
      story: "The cleanup step still runs green - it just computes a number that is confidently wrong." },
    { key: "metrics",   name: "Metrics",       icon: "📐", fail: "Two teams define 'revenue' differently",                   kind: "wrong", num: 21890,
      story: "This version counts refunded orders as revenue. Finance's number and this one will never match." },
    { key: "dashboard", name: "Dashboard",     icon: "📊", fail: "The dashboard still points at the old table",              kind: "stale", num: YESTERDAY,
      story: "The pipeline works perfectly. The screen is reading last quarter's copy of the data." }
  ];

  /* week mode: a fixed 7-day schedule with 3 scripted incidents */
  var WEEK = [
    { day: "Mon", broken: null },
    { day: "Tue", broken: "ingest" },     // stale
    { day: "Wed", broken: null },
    { day: "Thu", broken: "transform" },  // wrong
    { day: "Fri", broken: null },
    { day: "Sat", broken: "dashboard" },  // stale
    { day: "Sun", broken: null }
  ];

  /* levers */
  var levers = { fresh: false, tests: false, oncall: false };
  var broken = null; // key of the broken stage in day mode
  var tab = "day";

  function money(n) { return "$" + n.toLocaleString("en-US"); }
  function stage(key) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].key === key) return STAGES[i]; return null; }

  /* what does the dashboard do on a day where `key` is broken?
     returns {num, caught, label, kind} */
  function outcome(key) {
    if (!key) return { num: GOOD, caught: false, kind: "good", label: "fresh - updated 6:05am today" };
    var s = stage(key);
    if (s.kind === "stale") {
      if (levers.fresh) return { num: YESTERDAY, caught: true, kind: "stale", label: "STALE - last updated 2 days ago" };
      return { num: YESTERDAY, caught: false, kind: "stale", label: "looks normal - no one can tell it is old" };
    }
    /* wrong-number failures: freshness cannot see them - the data IS fresh, just wrong */
    if (levers.tests) return { num: null, caught: true, kind: "wrong", label: "BLOCKED - a data test failed before publish" };
    return { num: s.num, caught: false, kind: "wrong", label: "looks normal - fresh timestamp, wrong number" };
  }

  /* ---------- styles ---------- */

  var style = document.createElement("style");
  style.textContent =
    "#flow-live{border:1px solid " + C.hairline + ";border-radius:14px;overflow:hidden;background:#fff;font-feature-settings:'tnum'}" +
    "#flow-live .fl-tabs{display:flex;border-bottom:1px solid " + C.hairline + ";background:" + C.tint + "}" +
    "#flow-live .fl-tab{flex:1;padding:.7rem 1rem;border:none;background:transparent;font:inherit;font-weight:700;color:" + C.muted + ";cursor:pointer}" +
    "#flow-live .fl-tab.on{color:" + C.deep + ";background:#fff;border-bottom:3px solid " + C.accent + "}" +
    "#flow-live .fl-body{padding:1.1rem 1.2rem 1.3rem}" +
    "#flow-live .fl-hint{font-size:.85rem;color:" + C.muted + ";margin:0 0 .8rem}" +
    "#flow-live .fl-stages{display:flex;align-items:stretch;gap:.35rem;flex-wrap:wrap;margin-bottom:1rem}" +
    "#flow-live .fl-stage{flex:1 1 100px;min-width:96px;border:2px solid " + C.hairline + ";border-radius:10px;padding:.55rem .5rem;text-align:center;cursor:pointer;background:#fff;transition:all .15s;position:relative}" +
    "#flow-live .fl-stage:hover{border-color:" + C.soft + "}" +
    "#flow-live .fl-stage.on{border-color:" + C.accent + ";background:" + C.tint + "}" +
    "#flow-live .fl-stage.broken{border-color:" + C.redSoft + ";background:" + C.redTint + "}" +
    "#flow-live .fl-stage .ic{font-size:1.3rem;display:block}" +
    "#flow-live .fl-stage .nm{font-size:.78rem;font-weight:700;color:" + C.ink + ";display:block;line-height:1.3}" +
    "#flow-live .fl-stage .st{font-size:.68rem;color:" + C.muted + ";display:block;line-height:1.3}" +
    "#flow-live .fl-stage.broken .st{color:" + C.red + ";font-weight:700}" +
    "#flow-live .fl-arrow{align-self:center;color:" + C.soft + ";font-weight:700}" +
    "#flow-live .fl-levers{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem}" +
    "#flow-live .fl-lever{border:1.5px solid " + C.hairline + ";border-radius:999px;padding:.35rem .8rem;font:inherit;font-size:.82rem;font-weight:700;background:#fff;color:" + C.muted + ";cursor:pointer}" +
    "#flow-live .fl-lever.on{border-color:" + C.warm + ";background:" + C.warmTint + ";color:" + C.warmInk + "}" +
    "#flow-live .fl-run{border:none;border-radius:999px;padding:.45rem 1.2rem;font:inherit;font-weight:800;background:" + C.accent + ";color:#fff;cursor:pointer}" +
    "#flow-live .fl-run:hover{background:" + C.deep + "}" +
    "#flow-live .fl-dash{margin-top:1rem;border:1px solid " + C.hairline + ";border-radius:12px;padding:1rem 1.1rem;background:" + C.tint + "}" +
    "#flow-live .fl-dash .dt{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:" + C.muted + ";font-weight:700}" +
    "#flow-live .fl-dash .dn{font-size:2rem;font-weight:800;color:" + C.deep + ";line-height:1.2}" +
    "#flow-live .fl-dash .dn.bad{color:" + C.red + "}" +
    "#flow-live .fl-dash .dl{font-size:.82rem;font-weight:700}" +
    "#flow-live .fl-dash .dl.good{color:" + C.green + "}" +
    "#flow-live .fl-dash .dl.hid{color:" + C.muted + "}" +
    "#flow-live .fl-dash .dl.bad{color:" + C.red + "}" +
    "#flow-live .fl-story{margin-top:.7rem;font-size:.85rem;color:" + C.ink + ";background:#fff;border-left:3px solid " + C.warm + ";padding:.5rem .8rem;border-radius:0 8px 8px 0}" +
    "#flow-live .fl-week{width:100%;border-collapse:collapse;margin-top:.6rem}" +
    "#flow-live .fl-week th{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:" + C.muted + ";text-align:left;padding:.35rem .5rem;border-bottom:1px solid " + C.hairline + "}" +
    "#flow-live .fl-week td{padding:.42rem .5rem;border-bottom:1px solid " + C.hairline + ";font-size:.85rem}" +
    "#flow-live .fl-week .ok{color:" + C.green + ";font-weight:700}" +
    "#flow-live .fl-week .miss{color:" + C.red + ";font-weight:700}" +
    "#flow-live .fl-week .cat{color:" + C.warmInk + ";font-weight:700}" +
    "#flow-live .fl-score{display:flex;gap:1rem;flex-wrap:wrap;margin-top:.9rem}" +
    "#flow-live .fl-box{flex:1 1 150px;border:1px solid " + C.hairline + ";border-radius:10px;padding:.6rem .8rem;text-align:center}" +
    "#flow-live .fl-box .bn{font-size:1.5rem;font-weight:800;color:" + C.deep + "}" +
    "#flow-live .fl-box .bl{font-size:.72rem;color:" + C.muted + ";font-weight:700}" +
    "#flow-live .fl-rail{font-size:.75rem;color:" + C.muted + ";padding:.6rem 1.2rem;border-top:1px dashed " + C.hairline + ";background:" + C.tint + "}";
  document.head.appendChild(style);

  /* ---------- render ---------- */

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function render() {
    mount.innerHTML = "";
    var tabs = el("div", "fl-tabs");
    [["day", "☀️ Break one day"], ["week", "🗓 Score a full week"]].forEach(function (t) {
      var b = el("button", "fl-tab" + (tab === t[0] ? " on" : ""), t[1]);
      b.onclick = function () { tab = t[0]; render(); };
      tabs.appendChild(b);
    });
    mount.appendChild(tabs);
    var body = el("div", "fl-body");
    mount.appendChild(body);
    if (tab === "day") renderDay(body); else renderWeek(body);
    mount.appendChild(el("div", "fl-rail",
      "Honesty rail: this floor is a teaching simulation - the failures, catches, and numbers are scripted from real incident patterns. No real data is moving."));
  }

  function leverRow(parent, keys) {
    var row = el("div", "fl-levers");
    var defs = { fresh: "⏱ Freshness badge", tests: "🧪 Data tests", oncall: "📟 On-call alert" };
    keys.forEach(function (k) {
      var b = el("button", "fl-lever" + (levers[k] ? " on" : ""), defs[k] + (levers[k] ? " · ON" : " · off"));
      b.onclick = function () { levers[k] = !levers[k]; render(); };
      row.appendChild(b);
    });
    parent.appendChild(row);
  }

  function renderDay(body) {
    body.appendChild(el("p", "fl-hint", "Click a stage to break it (click again to repair). Toggle the safeguards. Then run the day and read the dashboard like a CEO would - top number first."));

    var srow = el("div", "fl-stages");
    STAGES.forEach(function (s, i) {
      var card = el("div", "fl-stage" + (broken === s.key ? " broken" : ""));
      card.appendChild(el("span", "ic", s.icon));
      card.appendChild(el("span", "nm", s.name));
      card.appendChild(el("span", "st", broken === s.key ? "BROKEN" : "healthy"));
      card.onclick = function () { broken = (broken === s.key ? null : s.key); render(); };
      srow.appendChild(card);
      if (i < STAGES.length - 1) srow.appendChild(el("span", "fl-arrow", "→"));
    });
    body.appendChild(srow);

    leverRow(body, ["fresh", "tests", "oncall"]);

    var run = el("button", "fl-run", "▶ Run the day");
    body.appendChild(run);

    var dash = el("div", "fl-dash");
    dash.appendChild(el("div", "dt", "Daybreak revenue dashboard · Monday 9am"));
    dash.appendChild(el("div", "dn", "- press run -"));
    body.appendChild(dash);

    run.onclick = function () {
      var o = outcome(broken);
      dash.innerHTML = "";
      dash.appendChild(el("div", "dt", "Daybreak revenue dashboard · Monday 9am"));
      if (o.num === null) {
        dash.appendChild(el("div", "dn bad", "publish blocked"));
        dash.appendChild(el("div", "dl bad", "🧪 " + o.label));
      } else {
        var badNum = (o.kind === "wrong") || (o.kind === "stale" && o.caught);
        dash.appendChild(el("div", "dn" + (badNum && o.caught ? " bad" : ""), money(o.num)));
        var cls = o.kind === "good" ? "good" : (o.caught ? "bad" : "hid");
        var mark = o.kind === "good" ? "✓ " : (o.caught ? "⚠️ " : "😶 ");
        dash.appendChild(el("div", "dl " + cls, mark + o.label));
      }
      if (broken) {
        var s = stage(broken);
        var fix = levers.oncall
          ? "📟 On-call alert fired at 6:12am - fixed before the 9am meeting (about 3 hours)."
          : "No alert. On average this gets discovered by a confused human days later (the classic: the CFO, on Thursday).";
        dash.appendChild(el("div", "fl-story", "<b>" + s.fail + ".</b> " + s.story + "<br>" + fix));
        if (!o.caught && o.num !== null) {
          dash.appendChild(el("div", "fl-story", "<b>The scary part:</b> the dashboard gave no sign. " +
            (s.kind === "wrong"
              ? "Freshness checks cannot catch this - the data is perfectly fresh, just wrong. Only a data test sees it."
              : "A freshness badge would have exposed this instantly - turn it on and rerun.")));
        }
      } else {
        dash.appendChild(el("div", "fl-story", "A healthy day: the order flowed source → ingest → warehouse → transform → metrics → dashboard overnight, and the number is " + money(GOOD) + ", fresh at 6:05am."));
      }
    };
  }

  function renderWeek(body) {
    body.appendChild(el("p", "fl-hint", "The same week replays every time: three real incidents are scripted into it. Watch two numbers - how many incidents you CAUGHT, and how many days you unknowingly trusted a bad dashboard."));
    leverRow(body, ["fresh", "tests"]);

    var tbl = el("table", "fl-week");
    tbl.innerHTML = "<thead><tr><th>Day</th><th>What happened</th><th>Dashboard showed</th><th>You knew?</th></tr></thead>";
    var tb = document.createElement("tbody");

    var caught = 0, blind = 0, incidents = 0;
    /* an uncaught incident poisons its day AND the next day (found late by a human) */
    var poisonedNext = false;
    WEEK.forEach(function (d) {
      var tr = document.createElement("tr");
      var o = d.broken ? outcome(d.broken) : null;
      var what, shown, knew;
      if (d.broken) {
        incidents++;
        var s = stage(d.broken);
        what = s.icon + " " + s.fail;
        if (o.caught) {
          caught++;
          shown = o.num === null ? "publish blocked 🧪" : money(o.num) + " + ⚠️ stale badge";
          knew = "<span class='ok'>caught same day</span>";
          poisonedNext = false;
        } else {
          blind++;
          shown = money(o.num) + " (looked normal)";
          knew = "<span class='miss'>no idea</span>";
          poisonedNext = true;
        }
      } else if (poisonedNext) {
        blind++;
        what = "still broken from yesterday - nobody noticed yet";
        shown = "yesterday's bad number again";
        knew = "<span class='miss'>no idea</span>";
        poisonedNext = false;
      } else {
        what = "a normal day";
        shown = money(GOOD) + " ✓";
        knew = "<span class='ok'>all good</span>";
      }
      tr.innerHTML = "<td><b>" + d.day + "</b></td><td>" + what + "</td><td>" + shown + "</td><td>" + knew + "</td>";
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    body.appendChild(tbl);

    var score = el("div", "fl-score");
    var b1 = el("div", "fl-box"); b1.appendChild(el("div", "bn", caught + " / " + incidents)); b1.appendChild(el("div", "bl", "incidents caught same day"));
    var b2 = el("div", "fl-box"); b2.appendChild(el("div", "bn", String(blind))); b2.appendChild(el("div", "bl", "days you trusted a bad number"));
    score.appendChild(b1); score.appendChild(b2);
    body.appendChild(score);

    var msg;
    if (!levers.fresh && !levers.tests) msg = "No safeguards: every incident sails straight onto the screen, and the bad number wears a perfectly normal face for days.";
    else if (levers.fresh && !levers.tests) msg = "Freshness catches the two STALE incidents - but Thursday's number was fresh AND wrong. Freshness cannot see wrong. That is what data tests are for.";
    else if (!levers.fresh && levers.tests) msg = "Tests catch the wrong number - but the two stale days still look normal. You need both eyes open.";
    else msg = "Both safeguards on: every incident caught the same day it happened. This - not zero failures - is what a healthy pipeline looks like. Things WILL break; the win is knowing within hours.";
    body.appendChild(el("div", "fl-story", "<b>Read:</b> " + msg));
  }

  render();
})();
