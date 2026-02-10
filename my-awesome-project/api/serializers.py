from rest_framework import serializers
from .models import EquipmentDataset

class EquipmentDatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentDataset
        # Make sure ALL these fields are listed so React can see them
        fields = [
            'id', 
            'file_name', 
            'data_json', 
            'type_distribution', 
            'total_count', 
            'avg_temp', 
            'avg_flowrate', 
            'avg_pressure', 
            'uploaded_at'
        ]