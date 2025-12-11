let pagingSim = null;
let pagingStep = -1;
let pagingPlay = null;

document.getElementById("runPage").addEventListener("click", runPaging);
document.getElementById("stepPage").addEventListener("click", stepPaging);
document.getElementById("playPage").addEventListener("click", togglePlayPaging);
document.getElementById("resetPage").addEventListener("click", resetPaging);

function runPaging(){
    stopPaging();
    pagingStep = -1;
    const payload = {
        pages: document.getElementById("pages").value,
        frames: document.getElementById("frames").value,
        algorithm: document.getElementById("algorithm").value
    };
    fetch("/simulate_paging", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
    }).then(r => r.json()).then(data => {
        pagingSim = data;
        document.getElementById("pageFaults").innerText = data.page_faults;
        buildPageFrames(data.events[0] ? data.events[0].frame_table.length : parseInt(payload.frames));
        document.getElementById("pageLog").innerHTML = "";
    });
}

function buildPageFrames(n){
    const fv = document.getElementById("pageFrames");
    fv.innerHTML = "";
    for(let i=0;i<n;i++){
        const d = document.createElement("div");
        d.className = "frame";
        d.id = "pframe-"+i;
        d.innerHTML = `<div class="title">Frame ${i}</div><div class="content">-</div>`;
        fv.appendChild(d);
    }
}

function stepPaging(){
    if(!pagingSim){ runPaging(); return; }
    if(pagingStep >= pagingSim.events.length - 1){ stopPaging(); return; }
    pagingStep++;
    renderPageEvent(pagingSim.events[pagingStep]);
}

function renderPageEvent(ev){
    for(let i=0;i<ev.frame_table.length;i++){
        const el = document.getElementById("pframe-"+i);
        if(!el) continue;
        el.querySelector(".content").innerText = ev.frame_table[i] === -1 ? "-" : ev.frame_table[i];
        el.classList.remove("hit","fault");
    }

    const logRow = document.createElement("div");
    logRow.className = "row";
    const tag = document.createElement("div");
    tag.className = "tag " + (ev.status === "HIT" ? "hit" : "fault");
    tag.innerText = ev.status;
    const txt = document.createElement("div");
    txt.innerText = `Step ${ev.step} — page: ${ev.page} ${ev.loaded ? '| loaded '+ev.loaded : ''} ${ev.evicted ? '| evicted '+ev.evicted : ''}`;
    logRow.appendChild(tag);
    logRow.appendChild(txt);
    const log = document.getElementById("pageLog");
    log.prepend(logRow);

    if(ev.status === "HIT"){
        highlightPageFrame(ev.page, "hit");
    } else {
        if(ev.loaded !== null && ev.loaded !== undefined){
            for(let i=0;i<ev.frame_table.length;i++){
                if(ev.frame_table[i] === ev.loaded) flashPageFrame(i, "fault");
            }
        }
    }
    document.getElementById("pageFaults").innerText = pagingSim.page_faults;
}

function highlightPageFrame(page, cls){
    for(let i=0;i<50;i++){
        const el = document.getElementById("pframe-"+i);
        if(!el) break;
        if(el.querySelector(".content").innerText == String(page)){
            el.classList.add(cls);
            setTimeout(()=>el.classList.remove(cls),700);
            break;
        }
    }
}

function flashPageFrame(i, cls){
    const el = document.getElementById("pframe-"+i);
    if(!el) return;
    el.classList.add(cls);
    setTimeout(()=>el.classList.remove(cls),700);
}

function togglePlayPaging(){
    if(pagingPlay){ stopPaging(); return; }
    pagingPlay = setInterval(()=>{
        if(!pagingSim) return;
        if(pagingStep >= pagingSim.events.length - 1){ stopPaging(); return; }
        stepPaging();
    },700);
    document.getElementById("playPage").innerText = "Pause";
}

function stopPaging(){
    if(pagingPlay){ clearInterval(pagingPlay); pagingPlay = null; document.getElementById("playPage").innerText = "Play"; }
}

function resetPaging(){
    stopPaging();
    pagingSim = null;
    pagingStep = -1;
    document.getElementById("pageFrames").innerHTML = "";
    document.getElementById("pageLog").innerHTML = "";
    document.getElementById("pageFaults").innerText = "0";
}
