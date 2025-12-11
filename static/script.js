// Replace your existing translateAddress() with this
function translateAddress() {
  console.log("translateAddress() called");

  const segInput = document.getElementById("segments").value;
  const segId = document.getElementById("seg_id").value;
  const offsetVal = document.getElementById("offset").value;

  const payload = {
    segments: segInput,
    addresses: `${segId}:${offsetVal}`,
    frames: 1,
    algorithm: "FIFO"
  };

  renderSegmentTable(payload.segments);

  fetch("/translate", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error("Server returned " + res.status);
    return res.json();
  })
  .then(data => {
    console.log("Backend response:", data);

    if (data.events && data.events.length > 0) {
      const ev = data.events[0];
      // Compose a rich info object for showOutput
      const rich = {
        rawEvent: ev,
        page_size: data.page_size || 100,
        segments_raw: segInput
      };
      showOutput(rich);
    } else {
      showOutput({
        error: true,
        message: "Invalid response from backend.",
        raw: data
      });
    }
  })
  .catch(err => {
    console.error(err);
    showOutput({
      error: true,
      message: "Server error: " + err.message
    });
  });
}

window.translateAddress = translateAddress;



// Render segment table
function renderSegmentTable(segStr) {
    const tableDiv = document.getElementById("table");
    tableDiv.innerHTML = "";

    const parts = segStr.split(";");

    parts.forEach((s, i) => {
        if (!s.includes("-")) return;
        const [id, size] = s.split("-");
        const div = document.createElement("div");
        div.className = "segment-box";
        div.innerHTML = `
            <b>Segment ${id.trim()}</b><br>
            Size: ${size.trim()} bytes
        `;
        div.style.borderLeft = `4px solid hsl(${i * 60}, 70%, 60%)`;
        tableDiv.appendChild(div);
    });
}


// Output handler
function showOutput(data) {
  const out = document.getElementById("output");
  out.classList.remove("success", "error");
  out.innerHTML = "";

  // error path
  if (data && data.error) {
    out.classList.add("error");
    out.innerHTML = `<b>✗ Error</b><br>${data.message || "Unknown error."}`;
    return;
  }

  const ev = data.rawEvent || {};
  const page_size = data.page_size || 100;
  const segsRaw = data.segments_raw || document.getElementById("segments").value;

  // parse segments string into map {id: size}
  function parseSegmentsJS(str) {
    const map = {};
    if (!str) return map;
    str.split(";").forEach(part => {
      if (!part.includes("-")) return;
      const [id, size] = part.split("-");
      const iid = parseInt(id.trim());
      const s = parseInt(size.trim());
      if (!isNaN(iid) && !isNaN(s)) map[iid] = s;
    });
    return map;
  }

  const segments = parseSegmentsJS(segsRaw);

  // compute base for this segment (sum of sizes of seg ids < ev.seg)
  let base = 0;
  if (ev.seg !== undefined && ev.seg !== null) {
    const segIdNum = Number(ev.seg);
    Object.keys(segments).map(k => Number(k)).sort((a,b)=>a-b).forEach(id => {
      if (id < segIdNum) base += segments[id];
    });
  }

  // segmentation-level values
  const segId = ev.seg ?? document.getElementById("seg_id").value;
  const offset = (ev.offset !== undefined && ev.offset !== null) ? Number(ev.offset) : Number(document.getElementById("offset").value);
  const segmentedAddress = base + offset;

  // paging-level values
  const page_in_seg = Math.floor(offset / page_size);
  const offset_in_page = offset % page_size;

  // find frame index in frame_table (frame_table entries are strings like "seg:page" or "-" )
  let frame_index = null;
  if (Array.isArray(ev.frame_table)) {
    const targetStr = `${segId}:${page_in_seg}`;
    for (let i = 0; i < ev.frame_table.length; i++) {
      if (String(ev.frame_table[i]) === targetStr) {
        frame_index = i;
        break;
      }
    }
    // fallback: check loaded if frame not found
    if (frame_index === null && ev.loaded) {
      // ev.loaded could be [seg,page] or "seg:page"
      let loadedStr = null;
      if (Array.isArray(ev.loaded) && ev.loaded.length >= 2) loadedStr = `${ev.loaded[0]}:${ev.loaded[1]}`;
      else if (typeof ev.loaded === "string") loadedStr = ev.loaded;
      if (loadedStr) {
        frame_index = ev.frame_table.indexOf(loadedStr);
        if (frame_index === -1) frame_index = null;
      }
    }
  }

  const final_physical = (ev.physical_address !== undefined && ev.physical_address !== null) ? ev.physical_address : null;

  // Build HTML with step-by-step breakdown
  const lines = [];

  // Header: status
  const status = ev.status || "UNKNOWN";
  if (status === "HIT" || status === "SUCCESS") {
    out.classList.add("success");
    lines.push(`<div class="big"><b>✓ Success</b></div>`);
  } else if (status === "PAGE_FAULT") {
    out.classList.add("error");
    lines.push(`<div class="big">⚠ Page Fault</div>`);
  } else if (status === "SEG_FAULT" || status === "OUT_OF_BOUNDS") {
    out.classList.add("error");
    lines.push(`<div class="big">✗ Segmentation Fault</div>`);
  } else {
    out.classList.add("error");
    lines.push(`<div class="big">Status: ${status}</div>`);
  }

  // Segmentation breakdown
  lines.push(`<div style="margin-top:8px"><b>Segmentation translation</b></div>`);
  lines.push(`<div>Segment: <b>${segId}</b></div>`);
  lines.push(`<div>Offset: <b>${offset}</b></div>`);
  // show base only if available
  if (Object.keys(segments).length > 0) {
    lines.push(`<div>Base (sum of previous segments): <b>${base}</b></div>`);
    lines.push(`<div>Segmented address (base + offset) = <b>${segmentedAddress}</b></div>`);
  } else {
    lines.push(`<div>Segments not provided or unparsable for base calculation.</div>`);
  }

  // Paging breakdown
  lines.push(`<div style="margin-top:8px"><b>Paging translation</b></div>`);
  lines.push(`<div>Page size = <b>${page_size}</b></div>`);
  lines.push(`<div>Page number (within segment) = <b>${page_in_seg}</b></div>`);
  lines.push(`<div>Offset within page = <b>${offset_in_page}</b></div>`);
  if (frame_index !== null) {
    lines.push(`<div>Frame index = <b>${frame_index}</b></div>`);
  } else {
    lines.push(`<div>Frame index = <b>Not yet assigned / not found in frame table</b></div>`);
  }

  // Loaded / evicted info
  if (ev.loaded) {
    let loadedStr = Array.isArray(ev.loaded) ? `${ev.loaded[0]}:${ev.loaded[1]}` : String(ev.loaded);
    lines.push(`<div>Loaded page = <b>${loadedStr}</b></div>`);
  }
  if (ev.evicted) {
    let evictedStr = Array.isArray(ev.evicted) ? `${ev.evicted[0]}:${ev.evicted[1]}` : String(ev.evicted);
    lines.push(`<div>Evicted page = <b>${evictedStr}</b></div>`);
  }

  // final physical
  if (final_physical !== null) {
    lines.push(`<div style="margin-top:8px"><b>Final physical address = ${final_physical}</b></div>`);
  } else {
    lines.push(`<div style="margin-top:8px"><b>Final physical address not available</b></div>`);
  }

  // extra note if present
  if (ev.note) {
    lines.push(`<div style="margin-top:6px;color:#ddd">${ev.note}</div>`);
  }

  // put it all together
  out.innerHTML = lines.join("");
}