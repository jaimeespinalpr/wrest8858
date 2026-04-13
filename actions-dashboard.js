(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    owner: $("owner"),
    repo: $("repo"),
    ref: $("ref"),
    token: $("token"),
    rememberToken: $("rememberToken"),
    toggleToken: $("toggleToken"),
    loadBtn: $("loadBtn"),
    runsBtn: $("runsBtn"),
    busy: $("busy"),
    rateNote: $("rateNote"),
    errorBox: $("errorBox"),
    wfTbody: $("wfTbody"),
    wfCount: $("wfCount"),
    runTbody: $("runTbody"),
    runCount: $("runCount"),
  };

  const LS_KEY = "gh_actions_dashboard_v1";

  function setBusy(message) {
    els.busy.textContent = message || "";
  }

  function showError(message) {
    els.errorBox.style.display = message ? "block" : "none";
    els.errorBox.textContent = message || "";
  }

  function loadPersisted() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }

  function persist(partial) {
    const current = loadPersisted();
    const next = { ...current, ...partial };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  function parseRepoFromLocation() {
    const params = new URLSearchParams(location.search);
    const owner = params.get("owner") || "";
    const repo = params.get("repo") || "";
    const ref = params.get("ref") || "";
    return { owner, repo, ref };
  }

  function getConfig() {
    return {
      owner: (els.owner.value || "").trim(),
      repo: (els.repo.value || "").trim(),
      ref: (els.ref.value || "").trim() || "main",
      token: (els.token.value || "").trim(),
    };
  }

  async function apiRequest(path, { method = "GET", token, body } = {}) {
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers["Content-Type"] = "application/json";

    const res = await fetch(`https://api.github.com${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const rateLimit = {
      limit: res.headers.get("x-ratelimit-limit"),
      remaining: res.headers.get("x-ratelimit-remaining"),
      reset: res.headers.get("x-ratelimit-reset"),
    };
    updateRateNote(rateLimit);

    if (res.status === 204) return { ok: true, status: 204, data: null };

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text || null;
    }

    if (!res.ok) {
      const message =
        (data && data.message) ||
        (typeof data === "string" ? data : "") ||
        `Error HTTP ${res.status}`;
      throw new Error(message);
    }
    return { ok: true, status: res.status, data };
  }

  function updateRateNote({ limit, remaining, reset }) {
    if (!limit || !remaining) {
      els.rateNote.textContent = "";
      return;
    }
    const resetText = reset
      ? ` · reset ${new Date(Number(reset) * 1000).toLocaleTimeString()}`
      : "";
    els.rateNote.textContent = `rate ${remaining}/${limit}${resetText}`;
  }

  function clearTables() {
    els.wfTbody.innerHTML = "";
    els.runTbody.innerHTML = "";
    els.wfCount.textContent = "";
    els.runCount.textContent = "";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  function pill(text) {
    const span = document.createElement("span");
    span.className = "ghad-pill";
    span.textContent = text;
    return span;
  }

  function link(href, text) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.className = "ghad-link";
    a.textContent = text;
    return a;
  }

  function button(text, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghad-btn";
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    return btn;
  }

  async function loadWorkflows() {
    showError("");
    clearTables();

    const { owner, repo, token } = getConfig();
    if (!owner || !repo) {
      showError("Completa Owner y Repo.");
      return;
    }

    setBusy("Cargando workflows…");
    try {
      const { data } = await apiRequest(`/repos/${owner}/${repo}/actions/workflows?per_page=100`, {
        token,
      });
      const workflows = (data && data.workflows) || [];
      els.wfCount.textContent = `${workflows.length}`;

      for (const wf of workflows) {
        const tr = document.createElement("tr");

        const tdName = document.createElement("td");
        const nameLine = document.createElement("div");
        nameLine.appendChild(link(wf.html_url, wf.name || "(sin nombre)"));
        const metaLine = document.createElement("div");
        metaLine.className = "ghad-note ghad-muted";
        metaLine.textContent = `${wf.path} · id ${wf.id} · ${wf.state}`;
        tdName.appendChild(nameLine);
        tdName.appendChild(metaLine);

        const tdActions = document.createElement("td");
        tdActions.className = "ghad-right";

        const runBtn = button("Run", async () => {
          await dispatchWorkflow(wf.id);
        });
        runBtn.title = "Disparar workflow_dispatch";

        const viewRunsBtn = button("Runs", async () => {
          await loadRuns({ workflowId: wf.id });
        });

        tdActions.appendChild(viewRunsBtn);
        tdActions.appendChild(runBtn);

        tr.appendChild(tdName);
        tr.appendChild(tdActions);
        els.wfTbody.appendChild(tr);
      }

      if (!workflows.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 2;
        td.className = "ghad-muted";
        td.textContent = "No se encontraron workflows.";
        tr.appendChild(td);
        els.wfTbody.appendChild(tr);
      }
    } catch (err) {
      showError(String(err && err.message ? err.message : err));
    } finally {
      setBusy("");
    }
  }

  async function dispatchWorkflow(workflowId) {
    showError("");
    const { owner, repo, ref, token } = getConfig();
    if (!owner || !repo) {
      showError("Completa Owner y Repo.");
      return;
    }
    if (!token) {
      showError("Para ejecutar necesitas un Token.");
      return;
    }
    if (!ref) {
      showError("Completa Ref (branch/tag).");
      return;
    }

    setBusy("Ejecutando workflow…");
    try {
      await apiRequest(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
        method: "POST",
        token,
        body: { ref },
      });
      await loadRuns();
    } catch (err) {
      showError(String(err && err.message ? err.message : err));
    } finally {
      setBusy("");
    }
  }

  async function loadRuns({ workflowId } = {}) {
    showError("");
    els.runTbody.innerHTML = "";
    els.runCount.textContent = "";

    const { owner, repo, token } = getConfig();
    if (!owner || !repo) {
      showError("Completa Owner y Repo.");
      return;
    }

    setBusy("Cargando runs…");
    try {
      const path = workflowId
        ? `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=20`
        : `/repos/${owner}/${repo}/actions/runs?per_page=20`;
      const { data } = await apiRequest(path, { token });
      const runs = (data && data.workflow_runs) || [];
      els.runCount.textContent = `${runs.length}`;

      for (const run of runs) {
        const tr = document.createElement("tr");

        const tdWf = document.createElement("td");
        const title = document.createElement("div");
        title.appendChild(link(run.html_url, run.name || run.display_title || "Run"));
        const sub = document.createElement("div");
        sub.className = "ghad-note ghad-muted";
        sub.textContent = `${run.head_branch || ""}${run.event ? ` · ${run.event}` : ""} · ${fmtDate(
          run.created_at
        )}`;
        tdWf.appendChild(title);
        tdWf.appendChild(sub);

        const tdStatus = document.createElement("td");
        tdStatus.appendChild(pill(`${run.status || "?"}${run.conclusion ? ` · ${run.conclusion}` : ""}`));

        const tdLink = document.createElement("td");
        tdLink.className = "ghad-right";
        tdLink.appendChild(link(run.html_url, "Abrir"));

        tr.appendChild(tdWf);
        tr.appendChild(tdStatus);
        tr.appendChild(tdLink);
        els.runTbody.appendChild(tr);
      }

      if (!runs.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 3;
        td.className = "ghad-muted";
        td.textContent = "No hay runs recientes.";
        tr.appendChild(td);
        els.runTbody.appendChild(tr);
      }
    } catch (err) {
      showError(String(err && err.message ? err.message : err));
    } finally {
      setBusy("");
    }
  }

  function setupPersistence() {
    const persisted = loadPersisted();
    const fromUrl = parseRepoFromLocation();

    const initialOwner = fromUrl.owner || persisted.owner || "jaimeespinalpr";
    const initialRepo = fromUrl.repo || persisted.repo || "";
    const initialRef = fromUrl.ref || persisted.ref || "main";

    els.owner.value = initialOwner;
    els.repo.value = initialRepo;
    els.ref.value = initialRef;

    if (persisted.rememberToken && persisted.token) {
      els.rememberToken.checked = true;
      els.token.value = persisted.token;
    }

    const persistBasics = () => {
      persist({
        owner: (els.owner.value || "").trim(),
        repo: (els.repo.value || "").trim(),
        ref: (els.ref.value || "").trim(),
      });
    };

    els.owner.addEventListener("input", persistBasics);
    els.repo.addEventListener("input", persistBasics);
    els.ref.addEventListener("input", persistBasics);

    const persistToken = () => {
      const remember = !!els.rememberToken.checked;
      persist({
        rememberToken: remember,
        token: remember ? (els.token.value || "").trim() : "",
      });
    };
    els.rememberToken.addEventListener("change", persistToken);
    els.token.addEventListener("input", () => {
      if (els.rememberToken.checked) persistToken();
    });
  }

  function setupUI() {
    els.toggleToken.addEventListener("click", () => {
      const next = els.token.type === "password" ? "text" : "password";
      els.token.type = next;
      els.toggleToken.textContent = next === "text" ? "Ocultar" : "Mostrar";
    });

    els.loadBtn.addEventListener("click", loadWorkflows);
    els.runsBtn.addEventListener("click", () => loadRuns());

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") loadWorkflows();
    });
  }

  setupPersistence();
  setupUI();

  // Preload runs if repo is present.
  const cfg = getConfig();
  if (cfg.owner && cfg.repo) loadRuns().catch(() => {});
})();

