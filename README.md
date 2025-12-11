🧠 Dynamic Memory Management Visualizer
Segmentation + Paging + Page Fault Simulation (Flask + JavaScript)

This project is an interactive operating system memory management visualizer that demonstrates:

Segmentation

Paging

Segmented Paging

Page Fault Handling

Demand Paging Behavior (FIFO / LRU)

Step-by-step Physical Address Translation

It provides an easy-to-use graphical interface for entering virtual addresses and instantly seeing how an OS converts them into physical addresses — including detailed breakdowns explaining each step.

🚀 Features
🔹 1. Segmentation

User enters segments using the format:
0-120;1-200;2-150

Calculates:

Segment base

Offset validation

Logical → physical translation (segmentation stage)

🔹 2. Segmented Paging (Full OS Simulation)

The tool now supports realistic OS paging behavior, including:

Page number calculation

Offset within a page

Frame selection

Page loading into frames

Persistent memory frames (no reset between translations)

Page replacement (FIFO / LRU — configurable)

Accurate physical address computation:

physical = frame_index * page_size + offset_in_page

🔹 3. Page Fault + HIT Visualization

Each address translation produces:

HIT

PAGE_FAULT

Optional: SEG_FAULT or OUT_OF_BOUNDS

The UI displays:

Loaded page

Evicted page (if any)

Updated frame table

Final physical address

Step-by-step educational explanation

🎓 Educational Step-By-Step Breakdown

For each translation, the UI shows:

✔ Segmentation Analysis
Segment ID: 1
Offset: 40
Base = 120 (sum of all previous segments)
Segmented Address = 120 + 40 = 160

✔ Paging Analysis
Page Size: 100
Page Number = 0
Offset-in-page = 40
Frame Index = 0
Final Physical Address = 0 * 100 + 40 = 40

✔ Status
PAGE FAULT (page was not in memory, loaded into frame 0)


or

HIT (page already in memory)

🖥️ Tech Stack
Backend (Python)

Flask

Persistent paging memory state

FIFO / LRU replacement logic

Segmentation + paging translation engine

Frontend

HTML, CSS, JavaScript

Dynamic UI updates

Interactive visualization of:

Segment table

Frame table

Page loading/unloading

📂 Project Structure
segmentation_visualizer/
│ app.py
│ README.md
│
├── static/
│     ├── script.js
│     ├── paging.js
│     └── style.css
│
└── templates/
      ├── index.html
      └── paging.html

▶️ How to Run
1. Install dependencies

(No external libraries required unless you add graphing.)

2. Start the Flask server
python app.py

3. Open in browser
http://127.0.0.1:5000/

🧪 Usage Example

Enter:

Segments: 0-120;1-200;2-150
Segment Number: 1
Offset: 40


Output shows:

Segmentation base calculation

Paging-level breakdown

Page fault/hit

Final physical address

Loaded/evicted pages

Updated frame table

📝 Future Enhancements

Visual memory frame grid

Page replacement animations

TLB simulation

Graphs (page faults vs frames)

Exportable logs for teaching

Dark/light themes

🎯 Purpose

This tool is designed for:

Operating Systems university projects

Classroom demonstrations

Students learning segmentation & paging

Visual learners who need step-by-step explanations

🙌 Acknowledgements

Thanks to OS teaching principles on segmentation, paging, and virtual memory systems.
Designed for educational clarity and simplicity.
