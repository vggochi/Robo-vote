(() => {
  const candidates = [
    {id:"01",name:"Luna Martins",role:"Inovação & Projetos",initials:"LM",color:"#69e2e9",bio:"Quer transformar ideias em protótipos que resolvem problemas reais da escola.",proposals:["Oficinas abertas de Arduino e sensores","Feira mensal de protótipos","Mentoria para novos integrantes"]},
    {id:"02",name:"Theo Almeida",role:"Robótica Competitiva",initials:"TA",color:"#b8ff5c",bio:"Acredita que trabalho em equipe e desafios práticos fazem a robótica evoluir.",proposals:["Equipe para torneios de robótica","Treinos semanais de programação","Biblioteca compartilhada de componentes"]},
    {id:"03",name:"Maya Costa",role:"Tecnologia para Todos",initials:"MC",color:"#ffb454",bio:"Defende um clube criativo, acessível e conectado às necessidades da comunidade.",proposals:["Projetos de acessibilidade com tecnologia","Campanha de reaproveitamento eletrônico","Encontros de criação colaborativa"]}
  ];
  const $ = (s) => document.querySelector(s);
  const grid = $("#candidate-grid"), results = $("#results-list"), dialog = $("#vote-dialog");
  let chosen = null, toastTimer;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function toast(message) {
    const el = $("#toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }
  function renderCandidates() {
    grid.innerHTML = candidates.map(c => `
      <article class="candidate-card">
        <div class="candidate-top"><span class="candidate-code">CANDIDATURA / ${c.id}</span><span class="candidate-code">RV.2026</span></div>
        <div class="candidate-avatar" style="--avatar:${c.color}">${c.initials}</div>
        <h3>${c.name}</h3><div class="candidate-role">${c.role}</div>
        <p class="candidate-bio">${c.bio}</p><div class="proposal-label">PRINCIPAIS PROPOSTAS</div>
        <ul class="proposal-list">${c.proposals.map(p=>`<li>${p}</li>`).join("")}</ul>
        <button class="button primary vote-button" data-id="${c.id}">Escolher candidatura <span>→</span></button>
      </article>`).join("");
    $("#candidate-count").textContent = String(candidates.length).padStart(2,"0");
  }
  async function renderStats() {
    const votes = await RoboDB.allVotes();
    const pending = await RoboDB.getPending();
    $("#vote-count").textContent = String(votes.length).padStart(2,"0");
    $("#pending-count").textContent = String(pending.length).padStart(2,"0");
    renderResults(votes);
  }
  function renderResults(votes) {
    const counts = candidates.map(c => ({...c,count:votes.filter(v=>v.candidateId===c.id).length}));
    const max = Math.max(1, ...counts.map(c=>c.count));
    results.innerHTML = counts.map((c,i)=>`
      <div class="result-row">
        <div class="result-rank">0${i+1}</div>
        <div class="result-name">${c.name}<div class="result-role">${c.role}</div></div>
        <div class="result-track" aria-label="${c.count} votos"><div class="result-fill" style="width:${c.count/max*100}%;background:${c.color}"></div></div>
        <div class="result-value">${c.count} voto${c.count===1?"":"s"}</div>
      </div>`).join("");
  }
  function updateConnection() {
    const online = navigator.onLine;
    const pill = $("#connection-pill");
    pill.classList.toggle("offline", !online);
    pill.innerHTML = `<i></i><span>${online ? "Conexão disponível" : "Modo offline"}</span>`;
    $("#sync-title").textContent = online ? "Conexão disponível para tentar sincronizar" : "Você está trabalhando offline";
    $("#sync-description").textContent = online
      ? "As operações pendentes serão processadas na simulação local."
      : "Suas operações ficam guardadas neste dispositivo até uma nova tentativa.";
  }
  grid.addEventListener("click", e => {
    const button = e.target.closest("[data-id]");
    if (!button) return;
    chosen = candidates.find(c => c.id === button.dataset.id);
    $("#dialog-candidate").textContent = `${chosen.name} — ${chosen.role}`;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else if (confirm(`Confirmar escolha por ${chosen.name}?`)) saveVote();
  });
  $("#cancel-vote").addEventListener("click", () => dialog.close());
  $("#confirm-vote").addEventListener("click", async () => { dialog.close(); await saveVote(); });

  async function saveVote() {
    if (!chosen) return;
    const record = {
      id: (crypto.randomUUID ? crypto.randomUUID() : `vote-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      candidateId: chosen.id,
      candidateName: chosen.name,
      createdAt: new Date().toISOString(),
      status: "pending",
      educationalDemo: true
    };
    await RoboDB.addPending(record);
    toast(navigator.onLine
      ? "Escolha guardada. Tentando processar a simulação..."
      : "Escolha guardada offline e marcada como pendente.");
    await renderStats();
    if (navigator.onLine) await syncPending();
  }
  async function syncPending() {
    if (!navigator.onLine) { toast("Sem conexão. As operações continuam pendentes."); return; }
    const pending = await RoboDB.getPending();
    if (!pending.length) { toast("Não há operações pendentes."); return; }
    // SIMULAÇÃO DIDÁTICA: marca localmente como sincronizado; não envia para servidor.
    for (const record of pending) {
      await RoboDB.markSynced({...record,status:"synced",syncedAt:new Date().toISOString()});
    }
    await renderStats();
    toast(`${pending.length} operação(ões) processada(s) na simulação local.`);
    $("#sync-title").textContent = "Fila local processada";
    $("#sync-description").textContent = "A demonstração marcou as operações como sincronizadas neste navegador; nenhum servidor foi contatado.";
  }
  $("#sync-btn").addEventListener("click", syncPending);
  window.addEventListener("online", () => { updateConnection(); syncPending(); });
  window.addEventListener("offline", updateConnection);

  $("#notify-btn").addEventListener("click", async () => {
    if (!("Notification" in window)) { toast("Este navegador não oferece notificações."); return; }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { toast("Permissão de notificação não concedida."); return; }
      const options = {body:"A central ROBO VOTE está pronta. Confira as propostas dos candidatos.",icon:"/assets/logo.svg",tag:"robo-vote-demo"};
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("Atualização da eleição simulada", options);
      } else new Notification("Atualização da eleição simulada", options);
      toast("Notificação demonstrativa enviada.");
    } catch { toast("Não foi possível exibir a notificação neste ambiente."); }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.info("[ROBO VOTE] Service Worker registrado:", registration.scope);
        if ("sync" in registration) {
          try { const pending = await RoboDB.getPending(); if (pending.length) await registration.sync.register("sincronizar-votos"); } catch (e) { console.info("Background Sync indisponível:", e.message); }
        }
      } catch (error) { console.error("Falha ao registrar Service Worker:", error); }
    });
  }
  renderCandidates();
  updateConnection();
  renderStats();
})();