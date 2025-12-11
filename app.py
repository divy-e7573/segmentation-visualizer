from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_folder="static", template_folder="templates")

PAGE_SIZE = 100

# -------------------------
# Helper parsers (unchanged)
# -------------------------
def parse_segments(seg_str):
    segs = {}
    if not seg_str.strip():
        return segs
    for part in seg_str.split(";"):
        if "-" not in part:
            continue
        sid, size = part.split("-")
        segs[int(sid.strip())] = int(size.strip())
    return segs

def parse_addresses(addr_str):
    res = []
    for token in addr_str.split():
        if ":" not in token:
            continue
        s, off = token.split(":")
        res.append((int(s.strip()), int(off.strip())))
    return res

# -------------------------------------
# Persistent state for segmented paging
# -------------------------------------
# These globals hold the current memory state for segmented paging.
seg_state = {
    "frames": None,
    "algorithm": None,
    "segments_def": None,      # raw segments string to detect change
    "segments": None,          # parsed segments dict
    "frame_table": None,       # list storing (seg,page) or None
    "queue": None,             # FIFO queue list
    "last_used": None,         # dict for LRU timestamps
    "time": 0,
    "page_faults": 0
}

def reset_seg_state(frames, algorithm, segments_str, segments_dict):
    seg_state["frames"] = frames
    seg_state["algorithm"] = algorithm
    seg_state["segments_def"] = segments_str
    seg_state["segments"] = segments_dict
    seg_state["frame_table"] = [None] * frames
    seg_state["queue"] = []
    seg_state["last_used"] = {}
    seg_state["time"] = 0
    seg_state["page_faults"] = 0

# -------------------------------------
# Process a single segmented address (persistent)
# -------------------------------------
def process_single_segmented_address(seg, offset, frames, algorithm, segments_str):
    """
    Uses/updates seg_state to process a single (seg,offset) access,
    returning a single event dict to send back to frontend.
    """
    # If state is uninitialized or config changed -> reset
    parsed_segments = parse_segments(segments_str)
    if (seg_state["frames"] != frames or
        seg_state["algorithm"] != algorithm or
        seg_state["segments_def"] != segments_str or
        seg_state["segments"] is None):
        reset_seg_state(frames, algorithm, segments_str, parsed_segments)

    # short names
    frame_table = seg_state["frame_table"]
    queue = seg_state["queue"]
    last_used = seg_state["last_used"]
    time = seg_state["time"]
    page_faults = seg_state["page_faults"]

    ev = {
        "step": time + 1,
        "seg": seg,
        "offset": offset,
        "status": None,
        "loaded": None,
        "evicted": None,
        "frame_table": None,
        "physical_address": None,
        "note": None,
    }

    # validate segment
    segments = seg_state["segments"]
    if seg not in segments:
        ev["status"] = "SEG_FAULT"
        ev["note"] = f"Segment {seg} not found"
        return ev  # note: do not increment time or mutate state

    seg_size = segments[seg]
    if offset < 0 or offset >= seg_size:
        ev["status"] = "OUT_OF_BOUNDS"
        ev["note"] = f"Offset {offset} out of bounds for segment {seg} (size {seg_size})"
        return ev

    # compute page within segment
    page_in_seg = offset // PAGE_SIZE
    offset_in_page = offset % PAGE_SIZE
    seg_page = (seg, page_in_seg)

    # helper find
    def find_frame(seg_page):
        for i, val in enumerate(frame_table):
            if val == seg_page:
                return i
        return -1

    fidx = find_frame(seg_page)
    if fidx != -1:
        # HIT
        ev["status"] = "HIT"
        ev["physical_address"] = fidx * PAGE_SIZE + offset_in_page
        last_used[seg_page] = time
    else:
        # PAGE FAULT
        ev["status"] = "PAGE_FAULT"
        page_faults += 1

        if None in frame_table:
            idx = frame_table.index(None)
            frame_table[idx] = seg_page
            queue.append(seg_page)
            last_used[seg_page] = time
            ev["loaded"] = seg_page
            ev["evicted"] = None
            ev["physical_address"] = idx * PAGE_SIZE + offset_in_page
        else:
            # replacement
            if algorithm == "FIFO":
                victim = queue.pop(0)
            else:  # LRU
                victim = min(last_used, key=last_used.get)

            v_idx = frame_table.index(victim)
            frame_table[v_idx] = seg_page
            ev["evicted"] = victim
            ev["loaded"] = seg_page
            ev["physical_address"] = v_idx * PAGE_SIZE + offset_in_page

            try:
                last_used.pop(victim)
            except KeyError:
                pass
            queue.append(seg_page)
            last_used[seg_page] = time

    # update event and global time/page_faults
    ev["frame_table"] = [f"{v[0]}:{v[1]}" if v is not None else "-" for v in frame_table]
    seg_state["time"] = time + 1
    seg_state["page_faults"] = page_faults

    return ev

# -------------------------
# Existing non-persistent simulator (used by /simulate_paging)
# -------------------------
def simulate_paging_from_pages(page_list, frames, algorithm):
    frame_table = [-1] * frames
    queue = []
    last_used = {}
    time = 0
    page_faults = 0
    events = []

    for step, page in enumerate(page_list):
        ev = {"step": step + 1, "page": page, "status": None, "loaded": None, "evicted": None, "frame_table": None}
        if page in frame_table:
            ev["status"] = "HIT"
            last_used[page] = time
        else:
            ev["status"] = "FAULT"
            page_faults += 1
            if -1 in frame_table:
                idx = frame_table.index(-1)
                frame_table[idx] = page
                queue.append(page)
                last_used[page] = time
                ev["loaded"] = page
                ev["evicted"] = None
            else:
                if algorithm == "FIFO":
                    evict = queue.pop(0)
                else:
                    evict = min(last_used, key=last_used.get)
                idx = frame_table.index(evict)
                frame_table[idx] = page
                ev["evicted"] = evict
                ev["loaded"] = page
                try:
                    last_used.pop(evict)
                except KeyError:
                    pass
                queue.append(page)
                last_used[page] = time

        ev["frame_table"] = frame_table.copy()
        events.append(ev)
        time += 1

    return {"events": events, "page_faults": page_faults}


# -------------------------
# Routes
# -------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/paging")
def paging_page():
    return render_template("paging.html")

@app.route("/translate", methods=["POST"])
def translate():
    """
    Now this route processes a single segmented access per request,
    using persistent state so repeated accesses may be HITs.
    Payload expected:
      { "segments": "0-120;1-200", "addresses": "1:40", "frames": 3, "algorithm": "LRU" }
    """
    payload = request.json or {}
    seg_str = payload.get("segments", "")
    addr_str = payload.get("addresses", "")
    frames = int(payload.get("frames", 3))
    algorithm = payload.get("algorithm", "FIFO")

    # parse only the first address (we expect single access per call)
    addresses = parse_addresses(addr_str)
    if not addresses:
        return jsonify({"error": "No addresses provided"}), 400

    seg, offset = addresses[0]

    ev = process_single_segmented_address(seg, offset, frames, algorithm, seg_str)

    # Also include current page_faults and page_size for frontend convenience
    response = {
        "events": [ev],
        "page_faults": seg_state["page_faults"],
        "page_size": PAGE_SIZE
    }
    return jsonify(response)

@app.route("/simulate_paging", methods=["POST"])
def simulate_paging_route():
    payload = request.json or {}
    pages_raw = payload.get("pages", "")
    frames = int(payload.get("frames", 3))
    algorithm = payload.get("algorithm", "FIFO")
    page_list = []
    for token in pages_raw.split():
        try:
            page_list.append(int(token))
        except:
            pass
    result = simulate_paging_from_pages(page_list, frames, algorithm)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
