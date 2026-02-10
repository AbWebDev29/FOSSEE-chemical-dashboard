from django.db import models

class EquipmentDataset(models.Model):
    file_name = models.CharField(max_length=255)
    data_json = models.JSONField() 
    # Add these if they are missing:
    type_distribution = models.JSONField(default=dict) 
    avg_flowrate = models.FloatField(default=0.0)
    # Ensure these match your existing fields:
    total_count = models.IntegerField()
    avg_temp = models.FloatField()
    avg_pressure = models.FloatField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.file_name