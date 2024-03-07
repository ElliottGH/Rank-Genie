from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from flask_cors import CORS
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
from mysql.connector import Error
import mysql.connector
from os.path import join, dirname, realpath
from tempfile import NamedTemporaryFile

from sklearn.preprocessing import StandardScaler

import shutil
import pandas as pd
import os
import traceback
import joblib

from statics.model.genie import RandomForestGenie, XGBoostGenie

app = Flask(__name__)  # Create flask app
CORS(app)

app.config['DEBUG'] = True  # Enable Debug
UPLOAD_FOLDER = 'statics/uploads'  
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# Temporary - convert secret key from hex (we can store this in a config or env file later to make it more hidden)
app.secret_key = bytes.fromhex('5ea50d792c8454a7f52d129e9f987e88ae7f9e203e9fe9a3')

# Ensure the upload directory exists and just make the file if it doesn't
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

#Connects to the MySQL server
try:
    mydb = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="genie"
    )
    print("Connected to the database!")
except Error as e:
    print("Error connecting to MySQL database:", e)

myCursor = mydb.cursor()
myCursor.execute("SHOW DATABASES")

##IMPORTANT REMINDER TO FIX LATER
##this python/flask things sends to localhost on port 5000 where react is using port 3000

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="genie",
        buffered=True
    )

## Use registration data and payment data files (both) to train the model
@app.route('/train', methods=['POST'])
def train():
    # Make sure files are part of the request
    if 'regdata' not in request.files or 'paydata' not in request.files:
        return jsonify({'error': 'Missing one or more files'}), 400

    # Save temporary files and get paths
    file_regdata = request.files['regdata']
    file_paydata = request.files['paydata']
    temp_regdata = NamedTemporaryFile(delete=False)
    temp_paydata = NamedTemporaryFile(delete=False)
    file_regdata.save(temp_regdata.name)
    file_paydata.save(temp_paydata.name)

    try:
        # Model functions and stuff
        xgboostmodel = XGBoostGenie(temp_regdata.name, temp_paydata.name)
        randomforestmodel = RandomForestGenie(temp_regdata.name, temp_paydata.name)
        xgboostmodel.split_data()
        randomforestmodel.split_data()


        xgboostmodel.evaluate_model()
        randomforestmodel.evaluate_model()

        joblib.dump(xgboostmodel, 'statics/xgboost_model.pkl')    
        joblib.dump(randomforestmodel, 'statics/randomforest_model.pkl')

        # Cleanup temp files
        temp_regdata.close()
        os.unlink(temp_regdata.name)
        temp_paydata.close()
        os.unlink(temp_paydata.name)
        
        return jsonify({'message': 'Model trained successfully'}), 200
    except Exception as e:
        # Cleanup temp files
        temp_regdata.close()
        os.unlink(temp_regdata.name)
        temp_paydata.close()
        os.unlink(temp_paydata.name)
        app.logger.error('Failed to train model: {}'.format(e))
        return jsonify({'error': 'Failed to train model', 'details': str(e)}), 500


@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    try:
        # load model
        xgboost_model = joblib.load('statics/xgboost_model.pkl')

        data_to_predict = pd.read_csv(file_path)
        scaler = StandardScaler()
        x_standardized_data = scaler.fit_transform(data_to_predict)
        y_pred = xgboost_model.model.predict(x_standardized_data)
        os.remove(file_path)
        return jsonify({"prediction": y_pred.tolist()}), 200
    except FileNotFoundError:
        os.remove(file_path)
        return jsonify({"error": "Model file not found. Please train the model before attempting to predict."}), 500
    except Exception as e:
        os.remove(file_path)
        return jsonify({"error": str(e)}), 500


@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = "SELECT password FROM users WHERE username = %s"
        cursor.execute(query, (username,))
        user = cursor.fetchone()  # Use the correct cursor variable name

        if user:
            if check_password_hash(user[0], password):
                return jsonify({"message": "Login successful"}), 200
            else:
                return jsonify({"error": "Invalid credentials"}), 401
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except Error as e:
        print(f"Database error while logging in user {username}: {e}")
        traceback.print_exc()
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        print(f"General error while logging in user {username}: {e}")
        traceback.print_exc()
        return jsonify({"error": "An error occurred"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

@app.route('/logout')
def logout():
    session.pop('username', None)  # Remove the username from session
    return jsonify({"message": "Logged out"}), 200

     
@app.route("/back")
def backend():
    return {"backString": "Connected to Backend!"} 

#Root URL
@app.route('/')
def index():
    #Sets HTML template
    return "trying this out"


#I think this needs to be combined with the temporary backend in App.js to work properly.
#Parses the given CSV file
def parseCSV(filePath):
    # Use Pandas to parse the CSV file
    csvData = pd.read_csv(filePath)
    fileName = os.path.splitext(os.path.basename(filePath))[0].replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').replace('/', '_').replace(',', '')

    csvData.columns = [col.replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "").replace("/", "_").replace(",", "") for col in csvData.columns]

    conn = get_db_connection()  # Use the connection function
    cursor = conn.cursor()

    try:
        create_table_query = f"CREATE TABLE IF NOT EXISTS `{fileName}` ("
        for col in csvData.columns:
            create_table_query += f"`{col}` TEXT,"
        create_table_query = create_table_query.rstrip(',') + ");"
        cursor.execute(create_table_query)

        placeholders = ", ".join(["%s"] * len(csvData.columns))
        column_names = ", ".join([f"`{col}`" for col in csvData.columns])
        insert_query = f"INSERT INTO `{fileName}` ({column_names}) VALUES ({placeholders})"

        for index, row in csvData.iterrows():
            cursor.execute(insert_query, tuple(row))
        conn.commit()

    except Error as e:
        print("Database error:", e)
    except Exception as e:
        print("General error:", e)
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

# parseCSV("dataset.csv")

if __name__ == '__main__':
    app.logger.setLevel('DEBUG')
    app.run(port=5000,debug=True)

