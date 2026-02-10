import sys
import requests
from PyQt5.QtWidgets import (QApplication, QMainWindow, QPushButton, 
                             QVBoxLayout, QWidget, QFileDialog, QLabel, QMessageBox)
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas

class ChemicalApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Chemical Equipment Analyzer - Desktop")
        self.setGeometry(100, 100, 800, 700)

        self.layout = QVBoxLayout()
        self.label = QLabel("Upload a CSV to begin analysis")
        self.layout.addWidget(self.label)

        # Action Buttons
        self.upload_btn = QPushButton("1. Upload & Analyze CSV")
        self.upload_btn.clicked.connect(self.upload_and_visualize)
        self.layout.addWidget(self.upload_btn)

        self.pdf_btn = QPushButton("2. Download PDF Report")
        self.pdf_btn.setEnabled(False)  # Disable until an upload happens
        self.pdf_btn.clicked.connect(self.download_pdf)
        self.layout.addWidget(self.pdf_btn)

        self.canvas = None
        container = QWidget()
        container.setLayout(self.layout)
        self.setCentralWidget(container)

    def upload_and_visualize(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Open CSV", "", "CSV Files (*.csv)")
        if file_path:
            with open(file_path, 'rb') as f:
                try:
                    response = requests.post("http://127.0.0.1:8000/api/upload/", files={'file': f})
                    if response.status_code == 201:
                        self.render_chart(response.json())
                        self.pdf_btn.setEnabled(True)  # Enable PDF button
                        QMessageBox.information(self, "Success", "Analysis Complete!")
                except Exception as e:
                    QMessageBox.critical(self, "Error", f"Connection failed: {e}")

    def render_chart(self, data):
        if self.canvas:
            self.layout.removeWidget(self.canvas)
        fig, ax = plt.subplots(figsize=(5, 4))
        dist = data['type_distribution']
        ax.pie(dist.values(), labels=dist.keys(), autopct='%1.1f%%')
        self.canvas = FigureCanvas(fig)
        self.layout.addWidget(self.canvas)

    def download_pdf(self):
        # 1. Ask user where to save the file
        save_path, _ = QFileDialog.getSaveFileName(self, "Save Report", "Equipment_Report.pdf", "PDF Files (*.pdf)")
        
        if save_path:
            try:
                # 2. Call the Django PDF endpoint
                response = requests.get("http://127.0.0.1:8000/api/export-pdf/", stream=True)
                if response.status_code == 200:
                    with open(save_path, 'wb') as f:
                        f.write(response.content)
                    QMessageBox.information(self, "Saved", f"Report saved to:\n{save_path}")
                else:
                    QMessageBox.warning(self, "Error", "Could not generate PDF from server.")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Download failed: {e}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = ChemicalApp()
    window.show()
    sys.exit(app.exec_())