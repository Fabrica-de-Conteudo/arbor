/* Aprimoramento progressivo: a página funciona 100% sem JavaScript.
   Aqui entram apenas scrollspy, animações de rolagem e microinterações. */
(function () {
  "use strict";
  var d = document;
  d.documentElement.classList.add("js");
  var reduzMov = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var topo = d.getElementById("topo");
  var progresso = d.getElementById("progresso-leitura");
  var btnTopo = d.getElementById("btn-topo");
  var nav = d.getElementById("nav-secoes");
  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
  var alvos = links.map(function (a) {
    return d.getElementById(a.getAttribute("href").slice(1));
  });
  var linkAtivo = null;

  /* ---- Barra de progresso, header compacto, botão topo e scrollspy ---- */
  var agendado = false;
  function aoRolar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      var max = d.documentElement.scrollHeight - innerHeight;
      progresso.style.transform = "scaleX(" + (max > 0 ? Math.min(scrollY / max, 1) : 0) + ")";
      topo.classList.toggle("rolou", scrollY > 12);
      btnTopo.classList.toggle("visivel", scrollY > 480);
      marcarSecaoAtiva();
    });
  }

  function marcarSecaoAtiva() {
    var ref = topo.offsetHeight + 80;
    var atual = null;
    for (var i = 0; i < alvos.length; i++) {
      if (alvos[i] && alvos[i].getBoundingClientRect().top <= ref) atual = links[i];
    }
    if (atual === linkAtivo) return;
    links.forEach(function (a) { a.classList.toggle("ativa", a === atual); });
    linkAtivo = atual;
    if (atual) {
      nav.scrollTo({
        left: atual.offsetLeft - nav.clientWidth / 2 + atual.offsetWidth / 2,
        behavior: reduzMov ? "auto" : "smooth"
      });
    }
  }

  function medirNav() {
    nav.classList.toggle("rolavel", nav.scrollWidth > nav.clientWidth + 4);
  }

  addEventListener("scroll", aoRolar, { passive: true });
  addEventListener("resize", function () { medirNav(); aoRolar(); }, { passive: true });
  btnTopo.addEventListener("click", function () {
    scrollTo({ top: 0, behavior: reduzMov ? "auto" : "smooth" });
  });
  medirNav();
  aoRolar();

  /* ---- Revelação escalonada dos blocos ao entrar na tela ---- */
  if (!reduzMov && "IntersectionObserver" in window) {
    d.querySelectorAll(
      "main > section:not(#hero):not(#guias):not(.atalhos), main > .duas-colunas > section"
    ).forEach(function (el) { el.setAttribute("data-rev", ""); });
    d.querySelectorAll(
      ".atalhos > .atalho, #guias > .guia, .pills > .pill, .orc-pills > .orc-pill, " +
      ".col-pills > .col-pill, .checklist > li, .etapas > li"
    ).forEach(function (el) { el.setAttribute("data-rev", "item"); });

    var io = new IntersectionObserver(function (entradas) {
      var vez = 0;
      entradas.forEach(function (ent) {
        if (!ent.isIntersecting) return;
        var el = ent.target;
        io.unobserve(el);
        var atraso = Math.min(vez++ * 70, 420);
        el.style.transitionDelay = atraso + "ms";
        el.classList.add("visivel");
        /* depois de revelado, devolve o elemento ao estado normal
           para os hovers voltarem à velocidade original */
        setTimeout(function () {
          el.removeAttribute("data-rev");
          el.classList.remove("visivel");
          el.style.transitionDelay = "";
        }, atraso + 850);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    d.querySelectorAll("[data-rev]").forEach(function (el) { io.observe(el); });
  }

  /* ---- Contagem animada de valores monetários ---- */
  function animarValor(el) {
    if (reduzMov) return;
    var original = el.dataset.original || el.textContent;
    el.dataset.original = original;
    var m = original.match(/\d{1,3}(?:\.\d{3})*(?:,\d+)?/);
    if (!m) return;
    var alvoNum = parseFloat(m[0].replace(/\./g, "").replace(",", "."));
    var centavos = m[0].indexOf(",") >= 0;
    var inicio = performance.now(), dur = 900;
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
    d.querySelectorAll(".resultado .valor, .stat .destaque").forEach(function (el) {
      ioNum.observe(el);
    });
  }

  /* ---- Abas: recentra a pílula escolhida e anima os valores da ficha ---- */
  function centrarRotulo(input, suave) {
    var rotulo = d.querySelector('label[for="' + input.id + '"]');
    if (!rotulo) return;
    var trilho = rotulo.parentElement;
    if (trilho.scrollWidth > trilho.clientWidth + 4) {
      trilho.scrollTo({
        left: rotulo.offsetLeft - trilho.clientWidth / 2 + rotulo.offsetWidth / 2,
        behavior: suave && !reduzMov ? "smooth" : "auto"
      });
    }
  }
  d.querySelectorAll(".abas").forEach(function (abas) {
    var inputs = [].slice.call(abas.children).filter(function (el) {
      return el.tagName === "INPUT";
    });
    var paineis = abas.querySelector(".paineis");
    abas.addEventListener("change", function (ev) {
      centrarRotulo(ev.target, true);
      var painel = paineis && paineis.children[inputs.indexOf(ev.target)];
      if (painel) painel.querySelectorAll(".valor").forEach(animarValor);
    });
  });
  d.querySelectorAll(".abas > input:checked").forEach(function (input) {
    centrarRotulo(input, false);
  });

  /* ---- Brilho que acompanha o cursor nos cartões e fundo global ---- */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var bgCanvas = d.getElementById("bg-canvas");
    d.addEventListener("pointermove", function (ev) {
      if (bgCanvas && !reduzMov) {
        bgCanvas.style.setProperty("--mx", ev.clientX + "px");
        bgCanvas.style.setProperty("--my", ev.clientY + "px");
      }
      var carta = ev.target.closest && ev.target.closest(".atalho, .pill, .orc-pill, .guia, .painel, .box");
      if (!carta) return;
      var r = carta.getBoundingClientRect();
      carta.style.setProperty("--mx", (ev.clientX - r.left) + "px");
      carta.style.setProperty("--my", (ev.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---- Variável global de scroll para efeitos Parallax ---- */
  if (!reduzMov) {
    window.addEventListener("scroll", function() {
      d.documentElement.style.setProperty("--scrollY", window.scrollY + "px");
    }, { passive: true });
    d.documentElement.style.setProperty("--scrollY", window.scrollY + "px");
  }

  /* ---- Sistema de Partículas Reativas ---- */
  if (!reduzMov) {
    var canvas = d.getElementById("particulas");
    if (canvas) {
      var ctx = canvas.getContext("2d");
      var particulas = [];
      var numParticulas = 60;
      var cw = window.innerWidth;
      var ch = window.innerHeight;
      var mx = cw/2, my = ch/2;
      
      canvas.width = cw;
      canvas.height = ch;

      window.addEventListener("resize", function() {
        cw = window.innerWidth;
        ch = window.innerHeight;
        canvas.width = cw;
        canvas.height = ch;
      });

      d.addEventListener("pointermove", function(e) {
        mx = e.clientX;
        my = e.clientY;
      }, { passive: true });

      for (var i = 0; i < numParticulas; i++) {
        particulas.push({
          x: Math.random() * cw,
          y: Math.random() * ch * 2, // Maior área para permitir scroll sem ficar vazio
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 2 + 1,
          cor: Math.random() > 0.5 ? "rgba(130, 10, 209, 0.25)" : "rgba(0, 190, 152, 0.3)"
        });
      }

      function animarParticulas() {
        ctx.clearRect(0, 0, cw, ch);
        var scrollY = window.scrollY;
        var parallaxFactor = 0.3;
        
        for (var i = 0; i < numParticulas; i++) {
          var p = particulas[i];
          p.x += p.vx;
          p.y += p.vy;

          var renderY = p.y - (scrollY * parallaxFactor);
          
          // Recicla partículas fora da tela
          if (p.x < -10) p.x = cw + 10;
          if (p.x > cw + 10) p.x = -10;
          if (renderY < -10) p.y += ch + 20;
          if (renderY > ch + 10) p.y -= ch + 20;

          // Reação suave ao mouse (repulsão)
          var renderYAtual = p.y - (scrollY * parallaxFactor);
          var dx = mx - p.x;
          var dy = my - renderYAtual;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            var force = (120 - dist) / 120;
            p.x -= (dx / dist) * force * 2.5;
            p.y -= (dy / dist) * force * 2.5;
          }

          ctx.fillStyle = p.cor;
          ctx.beginPath();
          ctx.arc(p.x, renderYAtual, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        requestAnimationFrame(animarParticulas);
      }
      requestAnimationFrame(animarParticulas);
    }
  }
})();
