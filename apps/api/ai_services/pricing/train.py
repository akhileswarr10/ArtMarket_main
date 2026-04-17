import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import joblib
import pathlib

def train():
    # Synthetic data
    data = [
        {"medium": "Oil", "style": "Abstract", "dimensions_cm2": 5000, "artist_verified": 1, "artist_artwork_count": 10, "price": 1200},
        {"medium": "Digital", "style": "Contemporary", "dimensions_cm2": 1000, "artist_verified": 0, "artist_artwork_count": 2, "price": 100},
        {"medium": "Watercolor", "style": "Landscape", "dimensions_cm2": 2500, "artist_verified": 1, "artist_artwork_count": 4, "price": 450},
        {"medium": "Mixed Media", "style": "Modern", "dimensions_cm2": 4000, "artist_verified": 0, "artist_artwork_count": 5, "price": 800},
        {"medium": "Acrylic", "style": "Realism", "dimensions_cm2": 12000, "artist_verified": 1, "artist_artwork_count": 25, "price": 3500},
        {"medium": "Digital", "style": "Anime", "dimensions_cm2": 500, "artist_verified": 0, "artist_artwork_count": 1, "price": 50},
        {"medium": "Oil", "style": "Portrait", "dimensions_cm2": 3000, "artist_verified": 1, "artist_artwork_count": 50, "price": 2500},
    ]
    df = pd.DataFrame(data)

    X = df.drop(columns=["price"])
    y = df["price"]

    numeric_features = ["dimensions_cm2", "artist_verified", "artist_artwork_count"]
    categorical_features = ["medium", "style"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", GradientBoostingRegressor(random_state=42))
    ])

    pipeline.fit(X, y)

    model_path = pathlib.Path(__file__).parent / "model.joblib"
    joblib.dump(pipeline, model_path)
    print(f"Model trained and saved to {model_path}")

if __name__ == "__main__":
    train()
