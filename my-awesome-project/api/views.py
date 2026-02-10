from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from io import BytesIO
from reportlab.pdfgen import canvas
import json # Added to handle dictionary/list conversion

from .models import EquipmentDataset
from .serializers import EquipmentDatasetSerializer
from .utils import process_csv

class EquipmentUploadView(APIView):
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            analysis = process_csv(file)
            stats = analysis.get('analytics', {})
            
            # FIXED: Save avg_flowrate and full data_json
            # Ensure your Model has a field for avg_flowrate!
            dataset = EquipmentDataset.objects.create(
                file_name=file.name,
                data_json=analysis.get('data', []), # Full list of rows
                type_distribution=analysis.get('type_distribution', {}), # For the chart
                total_count=analysis.get('total_count', 0),
                avg_temp=stats.get('avg_temp', 0),
                avg_flowrate=stats.get('avg_flowrate', 0), # MISSING IN PREVIOUS
                avg_pressure=stats.get('avg_pressure', 0)
            )
            
            if EquipmentDataset.objects.count() > 5:
                EquipmentDataset.objects.all().order_by('uploaded_at').first().delete()

            return Response(analysis, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"DEBUG Error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class HistoryView(APIView):
    def get(self, request):
        # Latest first
        datasets = EquipmentDataset.objects.all().order_by('-uploaded_at')[:5]
        serializer = EquipmentDatasetSerializer(datasets, many=True)
        return Response(serializer.data)

class ExportPDFView(APIView):
    def get(self, request):
        latest = EquipmentDataset.objects.order_by('-uploaded_at').first()
        if not latest:
            return Response({"error": "No data found"}, status=404)

        buffer = BytesIO()
        p = canvas.Canvas(buffer)
        
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, "Chemical Equipment Parameter Report")
        
        p.setFont("Helvetica", 12)
        p.drawString(100, 770, f"File Name: {latest.file_name}")
        p.drawString(100, 750, f"Total Count: {latest.total_count}")
        p.drawString(100, 730, f"Average Temperature: {latest.avg_temp:.2f} C")
        # Added Flowrate to PDF
        p.drawString(100, 710, f"Average Flowrate: {latest.avg_flowrate:.2f} m3/h")
        p.drawString(100, 690, f"Average Pressure: {latest.avg_pressure:.2f} bar")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')