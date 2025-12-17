from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <--- IMPORT THIS
from pydantic import BaseModel
import joblib
import pandas as pd
import shap
import uvicorn
import os

app = FastAPI(title="PredictMaint API with SHAP")

# --- NEW: CORS CONFIGURATION ---
# This reads the ALLOWED_ORIGINS variable from docker-compose
# If it can't find it, it defaults to allowing localhost:5173
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,    # Allows the frontend to talk to backend
    allow_credentials=True,
    allow_methods=["*"],      # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],      # Allows all headers
)
# -------------------------------

# Load the full Pipeline
pipeline = joblib.load('predict_maint_model.joblib')
preprocessor = pipeline.named_steps['preprocessor']
classifier = pipeline.named_steps['classifier']
explainer = shap.TreeExplainer(classifier)

class MachineData(BaseModel):
    Type: str
    Air_Temp: float
    Process_Temp: float
    Rotational_Speed: int
    Torque: float
    Tool_Wear: int

@app.post("/predict")
def predict_failure(data: MachineData):
    try:
        input_df = pd.DataFrame([data.dict()])
        processed_data = preprocessor.transform(input_df)
        
        probability = classifier.predict_proba(processed_data)[0][1]
        prediction = classifier.predict(processed_data)[0]
        
        # SHAP Explainability
        shap_vals = explainer.shap_values(processed_data)
        if isinstance(shap_vals, list):
            failure_shap_values = shap_vals[1][0] 
        else:
            failure_shap_values = shap_vals[0][..., 1]

        feature_names = preprocessor.get_feature_names_out()
        feature_importance = dict(zip(feature_names, failure_shap_values))
        top_factor = max(feature_importance, key=lambda k: feature_importance[k])
        top_score = feature_importance[top_factor]
        clean_factor_name = top_factor.replace('num__', '').replace('cat__', '')

        return {
            "risk_score": float(probability),
            "will_fail": bool(prediction),
            "status": "CRITICAL" if probability > 0.7 else "NORMAL",
            "explanation": {
                "top_factor": clean_factor_name,
                "impact_score": float(top_score),
                "human_readable": f"Risk increased primarily due to {clean_factor_name}"
            }
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)