/**
 * AppToolbar LEGAGNEUR DÉVELOPPEMENT — Version Vanilla JS (HTML statique)
 *
 * Pour apps sans React/Next.js : Neon Breaker V5, Pac-Neon, etc.
 *
 * Usage : inclure ce script dans le <head> ou avant </body> de votre page HTML :
 *   <script src="app-toolbar.js"></script>
 *
 * Ou inline directement dans le HTML :
 *   <script>/* coller le code ici *\/</script>
 *
 * La barre s'injecte automatiquement. Aucune dépendance requise.
 */
(function () {
  "use strict";

  var PORTFOLIO_URL = "https://legagneur-developpement.vercel.app";

  // Détecte si déjà installé (standalone)
  var isStandalone =
    window.matchMedia &&
    window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari
  if (window.navigator.standalone === true) isStandalone = true;

  if (isStandalone) return; // déjà installée, ne pas afficher

  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    hide();
  });

  function svg(name) {
    var icons = {
      back:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
      download:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      close:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      share:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>',
      more:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="4" x2="12" y2="4.01"/><line x1="12" y1="12" x2="12" y2="12.01"/><line x1="12" y1="20" x2="12" y2="20.01"/></svg>',
      plus:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      check:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      info:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      monitor:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
    };
    return icons[name] || "";
  }

  // --- Détection du navigateur (alignée sur la version React) ---
  function detectBrowser() {
    var ua = navigator.userAgent;
    var isIOS = /iPad|iPhone|iPod/.test(ua);
    var isAndroid = /Android/.test(ua);

    if (isIOS) {
      // Sur iOS, Chrome/Firefox utilisent WebKit mais l'installation PWA ne marche que via Safari
      return "ios-safari";
    }
    if (isAndroid) {
      // Opera Android supporte l'install via le menu, comme Chrome
      return "android-chrome";
    }
    // Desktop
    if (/OPR\/|Opera/.test(ua)) return "opera";
    if (/Edg\//.test(ua)) return "edge";
    if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "chrome";
    if (/Firefox\//.test(ua)) return "firefox";
    if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "safari";
    return "other";
  }

  function browserLabel(browser) {
    var labels = {
      chrome: "Chrome",
      edge: "Edge",
      opera: "Opera",
      firefox: "Firefox",
      safari: "Safari",
      "ios-safari": "iOS Safari",
      "android-chrome": "Android Chrome",
      other: "Navigateur inconnu"
    };
    return labels[browser] || browser;
  }

  // --- Étapes d'installation par navigateur (alignées sur la version React) ---
  function getInstallSteps(browser) {
    switch (browser) {
      case "chrome":
      case "edge":
        return {
          supported: true,
          heading: "Installation sur Chrome / Edge",
          steps: [
            {
              num: 1,
              title: "Cliquez sur l'icône Installer",
              detail:
                "Une icône avec un + ou « Installer » apparaît à droite de la barre d'adresse (près de l'étoile favoris).",
              icon: "plus"
            },
            {
              num: 2,
              title: "Confirmez en cliquant « Installer »",
              detail:
                "Une fenêtre apparaît — cliquez sur « Installer ». L'app s'ouvre dans sa propre fenêtre, comme un vrai logiciel.",
              icon: null
            },
            {
              num: 3,
              title: "C'est prêt !",
              detail:
                "Aurora est maintenant dans votre menu Démarrer / Bureau / Dock. Elle fonctionne même sans internet.",
              icon: "check"
            }
          ]
        };
      case "opera":
        return {
          supported: true,
          heading: "Installation sur Opera",
          steps: [
            {
              num: 1,
              title: "Ouvrez le menu Opera",
              detail:
                "Cliquez sur le bouton « O » rouge en haut à gauche de la fenêtre Opera.",
              icon: null
            },
            {
              num: 2,
              title: "Allez dans « Page » → « Créer un raccourci… »",
              detail:
                "Dans le menu, descendez jusqu'à « Page » puis choisissez « Créer un raccourci… » (ou « Installer l'application » selon votre version d'Opera).",
              icon: "more"
            },
            {
              num: 3,
              title: "Cochez « Ouvrir comme fenêtre »",
              detail:
                "Dans la boîte de dialogue, cochez « Ouvrir comme fenêtre » pour qu'Aurora s'ouvre dans sa propre fenêtre dédiée.",
              icon: "monitor"
            },
            {
              num: 4,
              title: "Cliquez « Créer »",
              detail:
                "Un raccourci Aurora est créé sur votre bureau et dans le menu Démarrer. L'app s'ouvre dans une fenêtre dédiée.",
              icon: "check"
            }
          ]
        };
      case "firefox":
        return {
          supported: false,
          heading: "Installation sur Firefox",
          steps: [
            {
              num: 1,
              title: "Firefox ne supporte pas l'installation PWA native",
              detail:
                "Pour installer Aurora comme une vraie application, utilisez plutôt Google Chrome ou Microsoft Edge.",
              icon: "info"
            },
            {
              num: 2,
              title: "Alternative : ajoutez aux favoris",
              detail:
                "Appuyez sur Ctrl+D pour ajouter Aurora à vos favoris — vous y accéderez rapidement depuis la barre personnelle.",
              icon: null
            }
          ]
        };
      case "safari":
        return {
          supported: false,
          heading: "Installation sur Safari (Mac)",
          steps: [
            {
              num: 1,
              title: "Safari ne supporte pas l'installation PWA native",
              detail:
                "Pour installer Aurora comme une vraie application, utilisez Google Chrome ou Microsoft Edge sur Mac.",
              icon: "info"
            },
            {
              num: 2,
              title: "Alternative : ajoutez au Dock",
              detail:
                "Faites glisser l'URL depuis la barre d'adresse vers le Dock (à droite de la ligne de séparation) pour un accès rapide.",
              icon: null
            }
          ]
        };
      case "ios-safari":
        return {
          supported: true,
          heading: "Installation sur iPhone / iPad",
          steps: [
            {
              num: 1,
              title: "Appuyez sur le bouton Partager",
              detail:
                "L'icône carrée avec une flèche vers le haut, en bas de l'écran Safari.",
              icon: "share"
            },
            {
              num: 2,
              title: "Sélectionnez « Sur l'écran d'accueil »",
              detail:
                "Faites défiler vers le bas et appuyez sur « Sur l'écran d'accueil ».",
              icon: "plus"
            },
            {
              num: 3,
              title: "Appuyez sur « Ajouter »",
              detail:
                "Aurora apparaît sur votre écran d'accueil comme une vraie app. Elle fonctionne en plein écran, sans la barre Safari.",
              icon: "check"
            }
          ]
        };
      case "android-chrome":
        return {
          supported: true,
          heading: "Installation sur Android",
          steps: [
            {
              num: 1,
              title: "Appuyez sur les 3 points",
              detail: "En haut à droite de Chrome / Opera mobile.",
              icon: "more"
            },
            {
              num: 2,
              title: "Sélectionnez « Ajouter à l'écran d'accueil »",
              detail: "Ou « Installer l'application » si proposé.",
              icon: "plus"
            },
            {
              num: 3,
              title: "Confirmez avec « Installer »",
              detail:
                "Aurora s'installe comme une app native. Elle fonctionne même hors-ligne.",
              icon: "check"
            }
          ]
        };
      default:
        return {
          supported: false,
          heading: "Installer Aurora",
          steps: [
            {
              num: 1,
              title: "Utilisez Chrome ou Edge pour une installation native",
              detail:
                "Les navigateurs basés sur Chromium (Chrome, Edge) permettent d'installer Aurora comme une vraie application.",
              icon: "info"
            }
          ]
        };
    }
  }

  function injectStyles() {
    if (document.getElementById("apptoolbar-styles")) return;
    var css = document.createElement("style");
    css.id = "apptoolbar-styles";
    css.textContent =
      ".apptoolbar{position:fixed;top:12px;right:12px;z-index:9999;display:flex;align-items:center;gap:4px;padding:6px;border-radius:16px;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);box-shadow:0 8px 32px rgba(0,0,0,0.4);font-family:system-ui,-apple-system,sans-serif;}" +
      ".apptoolbar-btn{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;border:none;background:transparent;color:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s;}" +
      ".apptoolbar-btn:hover{background:rgba(255,255,255,0.1);}" +
      ".apptoolbar-btn.close:hover{background:rgba(244,63,94,0.3);}" +
      ".apptoolbar-sep{width:1px;height:20px;background:rgba(255,255,255,0.2);}" +
      ".apptoolbar-label{display:inline;}" +
      "@media(max-width:640px){.apptoolbar-label{display:none;}.apptoolbar-btn{padding:8px;}}" +
      ".apptoolbar-reveal{position:fixed;bottom:16px;right:16px;z-index:9999;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.2);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.4);}" +
      ".apptoolbar-reveal:hover{background:rgba(0,0,0,0.9);}" +
      "@keyframes apptoolbar-fadein{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}" +
      ".apptoolbar,.apptoolbar-reveal{animation:apptoolbar-fadein .2s ease-out;}" +
      // --- Modal d'installation in-app ---
      "@keyframes apptoolbar-modal-fadein{from{opacity:0;}to{opacity:1;}}" +
      "@keyframes apptoolbar-modal-scalein{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}" +
      ".apptoolbar-modal-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:apptoolbar-modal-fadein .2s ease-out;}" +
      ".apptoolbar-modal{position:relative;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;border-radius:16px;background:#0e0e16;border:1px solid rgba(255,255,255,0.15);box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:system-ui,-apple-system,sans-serif;color:#fff;animation:apptoolbar-modal-scalein .25s ease-out;}" +
      ".apptoolbar-modal-header{display:flex;align-items:center;justify-content:space-between;padding:20px;background:linear-gradient(to right,#6366f1,#ec4899,#f59e0b);}" +
      ".apptoolbar-modal-headertitle{display:flex;align-items:center;gap:12px;color:#fff;}" +
      ".apptoolbar-modal-headertitle>svg{flex-shrink:0;width:24px;height:24px;}" +
      ".apptoolbar-modal-headertext h3{margin:0;font-size:18px;font-weight:700;color:#fff;line-height:1.2;}" +
      ".apptoolbar-modal-headertext p{margin:2px 0 0 0;font-size:12px;color:rgba(255,255,255,0.85);}" +
      ".apptoolbar-modal-close{background:transparent;border:none;color:rgba(255,255,255,0.85);cursor:pointer;padding:4px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:color .15s,background .15s;}" +
      ".apptoolbar-modal-close:hover{color:#fff;background:rgba(255,255,255,0.15);}" +
      ".apptoolbar-modal-close svg{width:20px;height:20px;display:block;}" +
      ".apptoolbar-modal-content{padding:24px;display:flex;flex-direction:column;gap:16px;}" +
      ".apptoolbar-modal-banner{display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);}" +
      ".apptoolbar-modal-banner svg{flex-shrink:0;width:20px;height:20px;color:#f59e0b;margin-top:1px;}" +
      ".apptoolbar-modal-banner p{margin:0;font-size:12px;color:#fcd34d;line-height:1.5;}" +
      ".apptoolbar-modal-intro{margin:0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;}" +
      ".apptoolbar-modal-steps{display:flex;flex-direction:column;gap:12px;}" +
      ".apptoolbar-modal-step{padding:16px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);}" +
      ".apptoolbar-modal-stephead{display:flex;align-items:center;gap:12px;margin-bottom:4px;}" +
      ".apptoolbar-modal-stepnum{width:28px;height:28px;border-radius:50%;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#a5b4fc;flex-shrink:0;}" +
      ".apptoolbar-modal-steptitle{font-size:14px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px;line-height:1.3;}" +
      ".apptoolbar-modal-steptitle svg{width:16px;height:16px;flex-shrink:0;}" +
      ".apptoolbar-modal-stepdetail{margin:0 0 0 40px;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;}" +
      ".apptoolbar-modal-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);flex-wrap:wrap;}" +
      ".apptoolbar-modal-browser{margin:0;font-size:12px;color:rgba(255,255,255,0.4);}" +
      ".apptoolbar-modal-browser span{font-weight:600;color:rgba(255,255,255,0.75);}" +
      ".apptoolbar-modal-ok{padding:8px 16px;border-radius:12px;border:none;background:rgba(255,255,255,0.1);color:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s;font-family:inherit;}" +
      ".apptoolbar-modal-ok:hover{background:rgba(255,255,255,0.2);}" +
      "@media(max-width:640px){" +
      ".apptoolbar-modal{border-radius:12px;}" +
      ".apptoolbar-modal-content{padding:16px;gap:12px;}" +
      ".apptoolbar-modal-header{padding:16px;}" +
      ".apptoolbar-modal-step{padding:12px;}" +
      ".apptoolbar-modal-stepdetail{margin-left:0;}" +
      ".apptoolbar-modal-headertitle>svg{width:20px;height:20px;}" +
      ".apptoolbar-modal-headertext h3{font-size:16px;}" +
      "}";
    document.head.appendChild(css);
  }

  var toolbar = null;
  var revealBtn = null;
  var modal = null;

  function build() {
    injectStyles();
    toolbar = document.createElement("div");
    toolbar.className = "apptoolbar";

    // Bouton retour portfolio
    var back = document.createElement("button");
    back.className = "apptoolbar-btn";
    back.title = "Retour au portfolio";
    back.setAttribute("aria-label", "Retour au portfolio");
    back.innerHTML = svg("back") + '<span class="apptoolbar-label">Portfolio</span>';
    back.onclick = function () {
      if (window.history.length > 2) window.history.back();
      else window.location.href = PORTFOLIO_URL;
    };
    toolbar.appendChild(back);

    // Séparateur
    var sep1 = document.createElement("div");
    sep1.className = "apptoolbar-sep";
    toolbar.appendChild(sep1);

    // Bouton installer
    var install = document.createElement("button");
    install.className = "apptoolbar-btn";
    install.title = "Installer cette application";
    install.setAttribute("aria-label", "Installer l'application");
    install.innerHTML = svg("download") + '<span class="apptoolbar-label">Installer</span>';
    install.onclick = function () {
      if (!deferredPrompt) {
        // Navigateur sans support natif (Opera/Firefox/Safari/iOS) : modal in-app
        showInstallModal();
        return;
      }
      // Navigateur compatible (Chrome/Edge) : invite native
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        if (choice.outcome === "accepted") {
          deferredPrompt = null;
          hide();
        }
      });
    };
    toolbar.appendChild(install);

    // Séparateur
    var sep2 = document.createElement("div");
    sep2.className = "apptoolbar-sep";
    toolbar.appendChild(sep2);

    // Bouton fermer
    var close = document.createElement("button");
    close.className = "apptoolbar-btn close";
    close.title = "Fermer et revenir au portfolio";
    close.setAttribute("aria-label", "Fermer");
    close.innerHTML = svg("close");
    close.onclick = function () {
      try { window.close(); } catch (e) {}
      setTimeout(function () {
        if (!window.closed) window.location.href = PORTFOLIO_URL;
      }, 150);
    };
    toolbar.appendChild(close);

    document.body.appendChild(toolbar);
  }

  function hide() {
    if (toolbar && toolbar.parentNode) toolbar.parentNode.removeChild(toolbar);
    toolbar = null;
    if (!revealBtn) {
      revealBtn = document.createElement("button");
      revealBtn.className = "apptoolbar-reveal";
      revealBtn.setAttribute("aria-label", "Afficher la barre d'outils");
      revealBtn.innerHTML = svg("download");
      revealBtn.onclick = function () {
        if (revealBtn && revealBtn.parentNode) revealBtn.parentNode.removeChild(revealBtn);
        revealBtn = null;
        build();
      };
      document.body.appendChild(revealBtn);
    }
  }

  function toggle() {
    if (toolbar) hide();
    else build();
  }

  // --- Modal d'installation in-app ---
  function buildStepElement(step) {
    var el = document.createElement("div");
    el.className = "apptoolbar-modal-step";

    var head = document.createElement("div");
    head.className = "apptoolbar-modal-stephead";

    var num = document.createElement("div");
    num.className = "apptoolbar-modal-stepnum";
    num.textContent = String(step.num);
    head.appendChild(num);

    var title = document.createElement("span");
    title.className = "apptoolbar-modal-steptitle";
    title.appendChild(document.createTextNode(step.title));
    if (step.icon) {
      var iconSpan = document.createElement("span");
      iconSpan.className = "apptoolbar-modal-stepicon";
      iconSpan.innerHTML = svg(step.icon);
      title.appendChild(iconSpan);
    }
    head.appendChild(title);

    el.appendChild(head);

    var detail = document.createElement("p");
    detail.className = "apptoolbar-modal-stepdetail";
    detail.textContent = step.detail;
    el.appendChild(detail);

    return el;
  }

  function showInstallModal() {
    if (modal) return; // déjà ouvert
    injectStyles();

    var browser = detectBrowser();
    var data = getInstallSteps(browser);

    var backdrop = document.createElement("div");
    backdrop.className = "apptoolbar-modal-backdrop";

    var dialog = document.createElement("div");
    dialog.className = "apptoolbar-modal";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "apptoolbar-modal-title");

    // Header (dégradé indigo → rose → ambre)
    var header = document.createElement("div");
    header.className = "apptoolbar-modal-header";

    var headertitle = document.createElement("div");
    headertitle.className = "apptoolbar-modal-headertitle";
    headertitle.innerHTML = svg("download");
    var headertext = document.createElement("div");
    headertext.className = "apptoolbar-modal-headertext";
    var h3 = document.createElement("h3");
    h3.id = "apptoolbar-modal-title";
    h3.textContent = "Installer l'application";
    var subtitle = document.createElement("p");
    subtitle.textContent = data.heading;
    headertext.appendChild(h3);
    headertext.appendChild(subtitle);
    headertitle.appendChild(headertext);
    header.appendChild(headertitle);

    var closeBtn = document.createElement("button");
    closeBtn.className = "apptoolbar-modal-close";
    closeBtn.setAttribute("aria-label", "Fermer");
    closeBtn.innerHTML = svg("close");
    closeBtn.onclick = closeInstallModal;
    header.appendChild(closeBtn);

    dialog.appendChild(header);

    // Contenu
    var content = document.createElement("div");
    content.className = "apptoolbar-modal-content";

    if (!data.supported) {
      var banner = document.createElement("div");
      banner.className = "apptoolbar-modal-banner";
      var bannerIcon = document.createElement("span");
      bannerIcon.innerHTML = svg("info");
      banner.appendChild(bannerIcon);
      var bannerText = document.createElement("p");
      bannerText.textContent =
        "Votre navigateur ne supporte pas l'installation PWA native. Suivez les étapes ci-dessous ou utilisez Chrome / Edge pour une expérience optimale.";
      banner.appendChild(bannerText);
      content.appendChild(banner);
    }

    var intro = document.createElement("p");
    intro.className = "apptoolbar-modal-intro";
    intro.textContent =
      "Aurora est 100% gratuite et fonctionne même sans internet après installation. Suivez ces étapes simples :";
    content.appendChild(intro);

    var stepsContainer = document.createElement("div");
    stepsContainer.className = "apptoolbar-modal-steps";
    for (var i = 0; i < data.steps.length; i++) {
      stepsContainer.appendChild(buildStepElement(data.steps[i]));
    }
    content.appendChild(stepsContainer);

    // Footer : navigateur détecté + bouton "J'ai compris"
    var footer = document.createElement("div");
    footer.className = "apptoolbar-modal-footer";
    var browserInfo = document.createElement("p");
    browserInfo.className = "apptoolbar-modal-browser";
    browserInfo.appendChild(document.createTextNode("Navigateur détecté : "));
    var browserSpan = document.createElement("span");
    browserSpan.textContent = browserLabel(browser);
    browserInfo.appendChild(browserSpan);
    footer.appendChild(browserInfo);

    var okBtn = document.createElement("button");
    okBtn.className = "apptoolbar-modal-ok";
    okBtn.textContent = "J'ai compris";
    okBtn.onclick = closeInstallModal;
    footer.appendChild(okBtn);

    content.appendChild(footer);
    dialog.appendChild(content);

    // Clic sur le backdrop ferme ; clic dans la dialog ne se propage pas
    backdrop.onclick = closeInstallModal;
    dialog.onclick = function (e) {
      if (e.stopPropagation) e.stopPropagation();
    };

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    modal = backdrop;

    // Focus initial sur le bouton de fermeture (accessibilité)
    try { closeBtn.focus(); } catch (e) {}
  }

  function closeInstallModal() {
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null;
  }

  // Échap : fermer le modal s'il est ouvert, sinon basculer la toolbar
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal) {
        closeInstallModal();
        return;
      }
      toggle();
    }
  });

  // Injection auto quand le DOM est prêt
  function init() {
    if (document.body) build();
    else document.addEventListener("DOMContentLoaded", build);
  }
  init();
})();
