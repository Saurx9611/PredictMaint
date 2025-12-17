import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler,OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.compose import ColumnTransformer
import joblib
from sklearn.metrics import classification_report

pd.set_option('display.max_columns', None)

df=pd.read_csv('ai4i2020.csv')

# print(df.head())

df.columns = ['UDI', 'Product_ID', 'Type', 'Air_Temp', 'Process_Temp','Rotational_Speed', 'Torque', 'Tool_Wear', 'Machine_Failure','TWF', 'HDF', 'PWF', 'OSF', 'RNF']
X = df[['Type', 'Air_Temp', 'Process_Temp', 'Rotational_Speed', 'Torque', 'Tool_Wear']]
y = df['Machine_Failure']

X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=0.3,random_state=42)

num_features=['Air_Temp', 'Process_Temp', 'Rotational_Speed', 'Torque', 'Tool_Wear']
cat_features=['Type']

prepro = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), num_features),
        ('cat', OneHotEncoder(), cat_features)
    ])

md = Pipeline(steps=[
    ('preprocessor', prepro),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

md.fit(X_train,y_train)

# print(md.score(X_test,y_test))
joblib.dump(md, 'predict_maint_model.joblib')
