import pandas as pd

def process_csv(file):
    # Read the CSV
    df = pd.read_csv(file)
    
    # Clean column names (removes hidden spaces or tabs)
    df.columns = [c.strip() for c in df.columns]
    
    # Required Columns: Equipment Name, Type, Flowrate, Pressure, Temperature
    
    summary = {
        "total_count": len(df),
        "analytics": {
            "avg_flowrate": float(df['Flowrate'].mean()) if 'Flowrate' in df else 0,
            "avg_pressure": float(df['Pressure'].mean()) if 'Pressure' in df else 0,
            "avg_temp": float(df['Temperature'].mean()) if 'Temperature' in df else 0,
        },
        "type_distribution": df['Type'].value_counts().to_dict() if 'Type' in df else {},
        "data": df.to_dict(orient='records')
    }
    return summary