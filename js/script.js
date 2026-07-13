/* ARBOR EDITORA — interações do layout
   Aprimoramento progressivo: sem JavaScript a página continua legível
   (primeiro player visível, ficha padrão preenchida, acordeões nativos). */
(function () {
  "use strict";
  var d = document;
  d.documentElement.classList.add("js");
  var reduzMov = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Barra de progresso, botão topo e scrollspy (1x por quadro) ---- */
  var progresso = d.getElementById("progresso");
  var btnTopo = d.getElementById("btn-topo");
  var nav = d.getElementById("nav-secoes");
  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
  var alvos = links.map(function (a) {
    return d.getElementById(a.getAttribute("href").slice(1));
  });
  var linkAtivo = null;
  var agendado = false;

  function aoRolar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      var max = d.documentElement.scrollHeight - innerHeight;
      progresso.style.width = (max > 0 ? Math.min(scrollY / max, 1) * 100 : 0) + "%";
      btnTopo.classList.toggle("visivel", scrollY > 480);
      marcarSecaoAtiva();
    });
  }

  function marcarSecaoAtiva() {
    var atual = null;
    for (var i = 0; i < alvos.length; i++) {
      if (alvos[i] && alvos[i].getBoundingClientRect().top <= 120) atual = links[i];
    }
    if (atual === linkAtivo) return;
    links.forEach(function (a) { a.classList.toggle("ativa", a === atual); });
    linkAtivo = atual;
    if (atual && nav.scrollWidth > nav.clientWidth + 4) {
      nav.scrollTo({
        left: atual.parentElement.offsetLeft - nav.clientWidth / 2 + atual.offsetWidth / 2,
        behavior: reduzMov ? "auto" : "smooth"
      });
    }
  }

  addEventListener("scroll", aoRolar, { passive: true });
  addEventListener("resize", aoRolar, { passive: true });
  btnTopo.addEventListener("click", function () {
    scrollTo({ top: 0, behavior: reduzMov ? "auto" : "smooth" });
  });
  aoRolar();

  /* ---- Revelação das seções ao entrar na tela ---- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (ent) {
        if (!ent.isIntersecting) return;
        ent.target.classList.add("vis");
        io.unobserve(ent.target);
      });
    }, { threshold: 0.1 });
    d.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    d.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("vis"); });
  }

  /* ---- Hero: frase digitada em loop ---- */
  var frases = ["pesquisa o mercado.", "planeja com dados.", "publica com excelência."];
  var typingEl = d.getElementById("typing");
  if (reduzMov) {
    typingEl.textContent = frases[0];
  } else {
    var fi = 0, ci = 0, apagando = false;
    (function tick() {
      var f = frases[fi];
      typingEl.textContent = f.slice(0, ci);
      if (!apagando) {
        ci++;
        if (ci > f.length) { apagando = true; setTimeout(tick, 1800); return; }
      } else {
        ci--;
        if (ci === 0) { apagando = false; fi = (fi + 1) % frases.length; }
      }
      setTimeout(tick, apagando ? 28 : 55);
    })();
  }

  /* ---- Contagem animada de valores monetários ---- */
  function animarValor(el) {
    if (reduzMov) return;
    var original = el.dataset.alvo || el.textContent;
    var m = original.match(/\d{1,3}(?:\.\d{3})*(?:,\d+)?/);
    if (!m) { el.textContent = original; return; }
    var alvoNum = parseFloat(m[0].replace(/\./g, "").replace(",", "."));
    var centavos = m[0].indexOf(",") >= 0;
    var inicio = performance.now(), dur = 800;
    function quadro(t) {
      var p = Math.min((t - inicio) / dur, 1);
      var suave = 1 - Math.pow(1 - p, 3);
      var atual = (alvoNum * suave).toLocaleString("pt-BR", {
        minimumFractionDigits: centavos ? 2 : 0,
        maximumFractionDigits: centavos ? 2 : 0
      });
      el.textContent = p < 1 ? original.replace(m[0], atual) : original;
      if (p < 1) requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }
  if ("IntersectionObserver" in window) {
    var ioNum = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (ent) {
        if (!ent.isIntersecting) return;
        ioNum.unobserve(ent.target);
        animarValor(ent.target);
      });
    }, { threshold: 0.6 });
    d.querySelectorAll(".resultado .valor, .auto-painel .total b").forEach(function (el) {
      ioNum.observe(el);
    });
  }

  /* ---- Pesquisa de mercado: abas dos players ---- */
  var modos = [].slice.call(d.querySelectorAll("#mercado .modo"));
  var paineis = [].slice.call(d.querySelectorAll("#mercado .player-painel"));
  var playerTag = d.getElementById("player-tag");
  modos.forEach(function (b, i) {
    b.addEventListener("click", function () {
      modos.forEach(function (x) { x.classList.remove("ativo"); x.setAttribute("aria-selected", "false"); });
      paineis.forEach(function (p) { p.classList.remove("ativo"); });
      b.classList.add("ativo");
      b.setAttribute("aria-selected", "true");
      paineis[i].classList.add("ativo");
      playerTag.textContent = "Player " + (i + 1) + "/5 · " + b.querySelector("strong").textContent.replace("Editora ", "");
    });
  });

  /* ---- Coautoria: slider de autoras ---- */
  var range = d.getElementById("nivel-autoras");
  if (range) {
    var VALOR_AUTORA = 3600;
    range.addEventListener("input", function () {
      var n = +range.value;
      d.getElementById("qtd-autoras").textContent = n;
      d.getElementById("stat-autoras").textContent = n;
      d.getElementById("lote-total").textContent =
        "R$ " + (n * VALOR_AUTORA).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    });
  }

  /* ---- Cartas que viram (implementação) ---- */
  d.querySelectorAll(".carta").forEach(function (c) {
    c.addEventListener("click", function () { c.classList.toggle("virada"); });
  });

  /* ---- Simulador de orçamentos: 10 propostas reais (lote 145012) ---- */
  var CAPA_DC = "31x21cm, 4x0 cores em Couche Fosco FSC 300g. Arte Fornecida pelo Cliente. Prova Digital Konica Minolta.";
  var CAPA_CD_CTP = "Revest. Capa: 25x35cm, 4x1 cores, Tinta Escala em Couche Fosco FSC LD 170g. Arte Fornecida pelo Cliente. CTP Incluso. Prova Digital Konica Minolta.";
  var CAPA_CD = "Revest. Capa: 25x35cm, 4x1 cores em Couche Fosco FSC LD 170g. Arte Fornecida pelo Cliente. Prova Digital Konica Minolta.";
  function mioloSimples(p) { return p + " pgs, 15x21cm, 1 cor em Off Set Alto Alvura Suzano 75g. Prova Digital Konica Minolta."; }
  function mioloCTP(p) { return p + " pgs, 15x21cm, 1 cor, Preto em Off Set Alto Alvura Suzano 75g. CTP Incluso. Prova Digital Konica Minolta."; }
  function lombDC(mm) { return mm + "mm, Laminado Fosco, Nº lados 1(Capa), Vinco(Capa), Intercalação(Miolo), Colagem PUR, FRETE, FOB (Destinatário)."; }
  function lombDCAuto(mm) { return mm + "mm, Laminado Fosco, Nº lados 1(Capa), Vinco(Capa), Dobradeira Automática, Intercalação, Colagem Dorso Hot Melt, Colagem PUR, FRETE, FOB (Destinatário)."; }
  function lombCD(mm, acab) { return mm + "mm, " + acab + ", Nº lados 1(Revest. Capa), Capa Dura(Revest. Capa), Dobradeira Automática(Papelão), Intercalação(Papelão), Colagem PUR, FRETE, FOB (Destinatário)."; }

  var ORCAMENTOS = {
    "dorso-10-100":  { n: "145012.01", unit: "R$ 100,00", total: "R$ 1.000,00", capa: CAPA_DC, miolo: mioloSimples(100), lomb: lombDC(4) },
    "dorso-10-200":  { n: "145012.02", unit: "R$ 140,00", total: "R$ 1.400,00", capa: CAPA_DC, miolo: mioloSimples(200), lomb: lombDC(8) },
    "dorso-50-100":  { n: "145012.03", unit: "R$ 51,40",  total: "R$ 2.570,00", capa: CAPA_DC, miolo: mioloCTP(100), lomb: lombDCAuto(4) },
    "dorso-50-200":  { n: "145012.04", unit: "R$ 69,00",  total: "R$ 3.450,00", capa: CAPA_DC, miolo: mioloCTP(200), lomb: lombDCAuto(8) },
    "dorso-100-100": { n: "145012.05", unit: "R$ 30,95",  total: "R$ 3.095,00", capa: CAPA_DC, miolo: mioloCTP(100), lomb: lombDCAuto(4) },
    "dorso-100-200": { n: "145012.06", unit: "R$ 44,00",  total: "R$ 4.400,00", capa: CAPA_DC, miolo: mioloCTP(200), lomb: lombDCAuto(8) },
    "dura-200-100":  { n: "145012.07", unit: "R$ 30,85",  total: "R$ 6.170,00", capa: CAPA_CD_CTP, miolo: mioloCTP(100), lomb: lombCD(6, "Laminação Alto Brilho") },
    "dura-100-100":  { n: "145012.08", unit: "R$ 42,70",  total: "R$ 4.270,00", capa: CAPA_CD_CTP, miolo: mioloCTP(100), lomb: lombCD(6, "Laminado Fosco") },
    "dura-50-100":   { n: "145012.09", unit: "R$ 64,00",  total: "R$ 3.200,00", capa: CAPA_CD, miolo: mioloCTP(100), lomb: lombCD(6, "Laminação Alto Brilho") },
    "dura-50-200":   { n: "145012.10", unit: "R$ 89,00",  total: "R$ 4.450,00", capa: CAPA_CD, miolo: mioloCTP(200), lomb: lombCD(9, "Laminação Alto Brilho") }
  };

  var escAcab = d.getElementById("esc-acab");
  if (escAcab) {
    var escUn = d.getElementById("esc-un");
    var escPg = d.getElementById("esc-pg");
    var sel = { acab: "dorso", un: "50", pg: "100" };

    function opcoes(grupo) { return [].slice.call(grupo.querySelectorAll("button")); }
    function existe(acab, un, pg) { return !!ORCAMENTOS[acab + "-" + un + "-" + pg]; }
    function temAlguma(acab, un) {
      return ["100", "200"].some(function (pg) { return existe(acab, un, pg); });
    }

    function atualizarDisponibilidade() {
      opcoes(escUn).forEach(function (b) { b.disabled = !temAlguma(sel.acab, b.dataset.v); });
      if (!temAlguma(sel.acab, sel.un)) {
        sel.un = opcoes(escUn).filter(function (b) { return !b.disabled; })[0].dataset.v;
      }
      opcoes(escPg).forEach(function (b) { b.disabled = !existe(sel.acab, sel.un, b.dataset.v); });
      if (!existe(sel.acab, sel.un, sel.pg)) {
        sel.pg = opcoes(escPg).filter(function (b) { return !b.disabled; })[0].dataset.v;
      }
      [[escAcab, "acab"], [escUn, "un"], [escPg, "pg"]].forEach(function (par) {
        opcoes(par[0]).forEach(function (b) { b.classList.toggle("ativo", b.dataset.v === sel[par[1]]); });
      });
    }

    function renderFicha() {
      var o = ORCAMENTOS[sel.acab + "-" + sel.un + "-" + sel.pg];
      d.getElementById("orc-proposta").textContent = "Proposta Nº " + o.n;
      d.getElementById("orc-capa").textContent = o.capa;
      d.getElementById("orc-miolo").textContent = o.miolo;
      d.getElementById("orc-lombada").textContent = o.lomb;
      var unit = d.getElementById("orc-unit"), total = d.getElementById("orc-total");
      unit.dataset.alvo = o.unit; unit.textContent = o.unit;
      total.dataset.alvo = o.total; total.textContent = o.total;
      animarValor(unit); animarValor(total);
    }

    [[escAcab, "acab"], [escUn, "un"], [escPg, "pg"]].forEach(function (par) {
      par[0].addEventListener("click", function (ev) {
        var b = ev.target.closest("button");
        if (!b || b.disabled) return;
        sel[par[1]] = b.dataset.v;
        atualizarDisponibilidade();
        renderFicha();
      });
    });
    atualizarDisponibilidade();
  }

  /* ---- Modal de Pesquisa de Salários ---- */
  var btnAbrirModal = d.getElementById("btn-abrir-pesquisa");
  var btnFecharModal = d.getElementById("btn-fechar-modal");
  var modalPesquisa = d.getElementById("modal-pesquisa");

  if (btnAbrirModal && btnFecharModal && modalPesquisa) {
    var abrirModal = function () {
      modalPesquisa.classList.add("ativo");
      modalPesquisa.setAttribute("aria-hidden", "false");
      d.body.classList.add("modal-aberto");
      btnFecharModal.focus();
    };

    var fecharModal = function () {
      modalPesquisa.classList.remove("ativo");
      modalPesquisa.setAttribute("aria-hidden", "true");
      d.body.classList.remove("modal-aberto");
      btnAbrirModal.focus();
    };

    btnAbrirModal.addEventListener("click", abrirModal);
    btnFecharModal.addEventListener("click", fecharModal);

    modalPesquisa.addEventListener("click", function (ev) {
      if (ev.target === modalPesquisa) {
        fecharModal();
      }
    });

    addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && modalPesquisa.classList.contains("ativo")) {
        fecharModal();
      }
    });
  }

  /* ---- Efeito de Partículas no Hero ---- */
  var canvas = d.getElementById("hero-particles");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var particulas = [];
    var qtd = 60;
    
    var ajustarTamanho = function () {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    ajustarTamanho();
    addEventListener("resize", ajustarTamanho);

    var Cores = ["rgba(130, 10, 209, 0.45)", "rgba(0, 255, 206, 0.4)", "rgba(154, 24, 232, 0.3)"];

    for (var i = 0; i < qtd; i++) {
      particulas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        cor: Cores[Math.floor(Math.random() * Cores.length)]
      });
    }

    var animar = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (var i = 0; i < qtd; i++) {
        var p = particulas[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.cor;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        for (var j = i + 1; j < qtd; j++) {
          var p2 = particulas[j];
          var dx = p.x - p2.x;
          var dy = p.y - p2.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "rgba(205, 189, 228, " + (1 - dist / 100) * 0.12 + ")";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animar);
    };

    if (!reduzMov) {
      animar();
    }
  }

  /* ---- Modal Visualizador de Imagens (Lightbox) ---- */
  var modalImagem = d.getElementById("modal-imagem");
  var modalImgSrc = d.getElementById("modal-imagem-src");
  var modalImgTitulo = d.getElementById("modal-imagem-titulo");
  var btnFecharImg = d.getElementById("btn-fechar-modal-imagem");
  var cardsVariantes = d.querySelectorAll(".variante-card");

  if (modalImagem && modalImgSrc && modalImgTitulo && btnFecharImg) {
    var abrirImgModal = function (src, titulo) {
      modalImgSrc.src = src;
      modalImgTitulo.textContent = titulo;
      modalImagem.classList.add("ativo");
      modalImagem.setAttribute("aria-hidden", "false");
      d.body.classList.add("modal-aberto");
      btnFecharImg.focus();
    };

    var fecharImgModal = function () {
      modalImagem.classList.remove("ativo");
      modalImagem.setAttribute("aria-hidden", "true");
      d.body.classList.remove("modal-aberto");
      modalImgSrc.src = "";
    };

    cardsVariantes.forEach(function (card) {
      card.addEventListener("click", function () {
        var src = card.getAttribute("data-img");
        var titulo = card.getAttribute("data-titulo");
        abrirImgModal(src, titulo);
      });
    });

    btnFecharImg.addEventListener("click", fecharImgModal);

    modalImagem.addEventListener("click", function (ev) {
      if (ev.target === modalImagem) {
        fecharImgModal();
      }
    });

    addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && modalImagem.classList.contains("ativo")) {
        fecharImgModal();
      }
    });
  }
})();
