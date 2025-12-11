📘 Segmentation Address Translation Visualizer

A clean, interactive web-based segmentation simulator for Operating Systems labs and academic demonstrations.

📌 Overview

This project is a lightweight, browser-based visualization tool that demonstrates segmentation memory management in Operating Systems. It converts logical addresses (segment number + offset) into physical addresses using a base–limit model, while validating segmentation faults, offset violations, and segment boundaries.

It is designed for students, instructors, and OS lab submissions, offering a simple but modern UI using Flask + HTML/CSS/JS.

The goal is to make the core OS memory translation mechanism visual, intuitive, and interactive.

The repository includes:

A complete Segmentation Engine (base–limit arithmetic + validation)

A minimal Flask backend for API handling

A responsive and modern front-end UI

Real-time visualization of segment tables

Highlighted error/success messages

Smooth animations for better understanding

🚀 Features
🔹 Segmentation Engine (Core Logic)

Converts logical address → physical address

Performs base–limit validation

Detects segmentation faults

Detects offset-out-of-bound errors

Computes base address automatically from segment sizes

Example behavior:

Input: Segment 1, Offset 40

If Segment 1 has base 120 → PA = 120 + 40

🔹 Dynamic Segment Table Visualization

Each segment is displayed with:

Segment ID

Allocated size

Color-coded borders

Rows animate on update to give a clean visual feel

🔹 Error & Success Feedback

Each translation attempt generates one of:

SUCCESS → Valid address

SEGMENT_NOT_FOUND → Invalid segment ID

OUT_OF_BOUNDS → Offset > segment size

SEGMENTATION_FAULT (if extension added)

Messages appear in a highlighted output panel for clarity.

🔹 Modern Web UI

Built using:

HTML5

CSS3 (Dark theme, neon borders, smooth animations)

JavaScript for dynamic updates

Flask backend for processing

UI includes:

Input panel

Segment table panel

Output response panel

Responsive layout

🧩 System Architecture
Segmentation-Visualizer/
│
├── app.py                     → Flask backend & Segmentation engine
│
├── static/
│   ├── style.css              → Modern UI styling (dark + neon)
│   └── script.js              → Frontend logic & animations
│
├── templates/
│   └── index.html             → Main interface
│
└── README.md                  → Documentation

Core Workflow

User enters segments (id-size;id-size;...).

User specifies logical address (segment number + offset).

Frontend sends request → /translate API.

Backend validates segment + offset.

SUCCESS → Physical address returned.

FAIL → Error message generated.

Frontend visualizes segment table + output.

📥 Installation
1️⃣ Backend Setup
python -m venv venv
venv\Scripts\activate      # Windows
pip install flask

2️⃣ Run Project
python app.py

3️⃣ View in Browser

Open:

http://127.0.0.1:5000/

▶️ Usage
Step 1 — Enter the segment table

Format:

0-120;1-200;2-150

Step 2 — Enter logical address

Segment Number:

1


Offset:

40

Step 3 — Click Translate Address

The output will display:

Physical Address

Base calculation

Validation details

Segment table updates in real-time with animations.

🎯 Purpose

This tool is ideal for:

Operating Systems lab assignments

Academic assessments

Visualizing segmentation

Teaching address translation

Demonstrating base–limit checks

Explaining segmentation faults

Its design emphasizes clarity, step-by-step evaluation, and simplicity, making it perfect for students and instructors.

📎 Future Improvements

Planned enhancements include:

Memory allocation strategies (First Fit, Best Fit, Worst Fit)

Fragmentation visualization

Segmented + Paging hybrid mode

Dark/light mode toggle

Exportable visualization screenshots

Full GUI version (Tkinter / React)

🙌 Acknowledgements

Developed as part of an Operating Systems project exploring segmentation and memory management.
Inspired by classical OS textbooks and academic tools focused on clarity and educational value.
