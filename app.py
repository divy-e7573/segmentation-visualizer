from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def parse_segments(seg_str):
    # format: 0-100;1-200;2-150
    segments = {}
    if not seg_str.strip():
        return segments
    for part in seg_str.split(";"):
        if "-" not in part: continue
        sid, size = part.split("-")
        segments[int(sid.strip())] = int(size.strip())
    return segments


def simulate_segmentation(segments, seg_id, offset):
    event = {
        "segment": seg_id,
        "offset": offset,
        "status": "",
        "physical_address": None,
        "note": ""
    }

    if seg_id not in segments:
        event["status"] = "SEGMENT_NOT_FOUND"
        event["note"] = f"Segment {seg_id} does not exist"
        return event

    limit = segments[seg_id]
    if offset < 0 or offset >= limit:
        event["status"] = "OUT_OF_BOUNDS"
        event["note"] = f"Offset exceeds limit (limit = {limit})"
        return event

    # SIMPLE MAPPING: base address = sum of previous segment sizes
    base = 0
    for sid in sorted(segments.keys()):
        if sid == seg_id:
            break
        base += segments[sid]

    event["status"] = "SUCCESS"
    event["physical_address"] = base + offset
    event["note"] = f"Physical address = base ({base}) + offset ({offset})"

    return event


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/translate", methods=["POST"])
def translate():
    data = request.json
    segments = parse_segments(data["segments"])
    seg_id = int(data["seg_id"])
    offset = int(data["offset"])
    result = simulate_segmentation(segments, seg_id, offset)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
