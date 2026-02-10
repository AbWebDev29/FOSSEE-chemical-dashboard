# FOSSEE-chemical-dashboard

# 🧪 Chemical Equipment Dashboard

A sophisticated, full-stack monitoring dashboard for chemical plant equipment. This application features an elegant, high-performance UI with orbital background animations, real-time data analysis, and an automated desktop runner.



## ✨ Features

* **Orbital Motion UI:** A minimalist, "engineering chic" background featuring animated SVG grids and dynamic orbital glows that react to system health.
* **Data Analysis:** Upload CSV files to instantly calculate average flow rates, pressures, and equipment type distributions.
* **Interactive History:** View a log of previous analyses and "Restore" specific snapshots to the live dashboard.
* **Automated Desktop Runner:** A Python-based orchestration script to launch the backend, frontend, and a dedicated app-mode window with one command.
* **Report Generation:** Export analyzed data into professional PDF reports.

---

## 🚀 Getting Started

### Prerequisites
* **Python 3.10+**
* **Node.js & npm**
* **Google Chrome** (for Desktop App Mode)

### Installation

1. **Clone the repository:**
   bash
   git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
   cd YOUR_REPO_NAME

2. **Setup Backend:**
bash
cd my-awesome-project/chemical_backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate


3. **Setup Frontend:**
bash
cd ../  # Back to my-awesome-project
npm install

---

## 🖥️ Running the App

You don't need to manage multiple terminals. Simply run the desktop controller from the root directory:

```bash
python desktop.py

```

This script will:

1. Start the **Django REST API**.
2. Start the **React Dev Server**.
3. Launch the dashboard in a **standalone Chrome window** (no address bar).

---

## 📊 Data Format

The application expects a CSV file with the following columns:

* `Equipment Name`
* `Type` (e.g., Pump, Reactor, Valve)
* `Flowrate`
* `Pressure`
* `Temperature`

---

## 🛠️ Tech Stack

* **Frontend:** React, Chart.js, Axios
* **Backend:** Django, Django REST Framework, SQLite
* **Styling:** CSS3 (Glassmorphism & Orbital Animations)
* **Automation:** Python Subprocess API

```
