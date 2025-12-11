function translateAddress() {
  console.log("translateAddress() called");
  const payload = {
    segments: document.getElementById("segments").value,
    seg_id: document.getElementById("seg_id").value,
    offset: document.getElementById("offset").value
  };
  renderSegmentTable(payload.segments);
  fetch("/translate", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => showOutput(data));
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

    if (data.status === "SUCCESS") {
        out.classList.add("success");
        out.innerHTML = `
            <b>✓ Success</b><br>
            Physical Address = <b>${data.physical_address}</b><br>
            ${data.note}
        `;
    } else {
        out.classList.add("error");
        out.innerHTML = `
            <b>✗ Error</b><br>
            ${data.note}
        `;
    }
}
