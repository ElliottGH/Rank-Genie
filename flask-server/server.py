from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
import mysql.connector
from mysql.connector import Error
import pandas as pd
import os
from os.path import join, dirname, realpath
import traceback

from statics.model.genie import RandomForestGenie, XGBoostGenie

app = Flask(__name__)  # Create flask app
app.config['DEBUG'] = True  # Enable Debug
UPLOAD_FOLDER = 'statics/uploads'  
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# Temporary - convert secret key from hex (we can store this in a config or env file later to make it more hidden)
app.secret_key = bytes.fromhex('5ea50d792c8454a7f52d129e9f987e88ae7f9e203e9fe9a3')

global xgboostmodel, randomforestmodel

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
    xgboostmodel = XGBoostGenie('regdata', 'paydata')
    randomforestmodel = RandomForestGenie('regdata', 'paydata')

    xgboostmodel.preprocess()
    randomforestmodel.preprocess()


@app.route('/predict', methods=['POST'])
def predict():
    prediction = xgboostmodel.model.predict()


@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    conn = get_db_connection()
    cursor = conn.cursor()

    print(f"Attempting to log in user: {username}")  # Log the attempt

    try:
        query = "SELECT password FROM users WHERE username = %s"
        print(f"Executing query: {query} with username: {username}")  # Log the query and the username
        cursor.execute(query, (username,))
        user = cursor.fetchone()  # Use the correct cursor variable name

        if user:
            print(f"Fetched user hash for {username}: {user[0]}")  # Log fetched hash
            if check_password_hash(user[0], password):
                print(f"User {username} authenticated successfully")  # Log success
                return jsonify({"message": "Login successful"}), 200
            else:
                print(f"Password check failed for user {username}")  # Log failure
                return jsonify({"error": "Invalid credentials"}), 401
        else:
            print(f"User {username} not found in database")  # Log user not found
            return jsonify({"error": "Invalid credentials"}), 401
    except Error as e:
        print(f"Database error while logging in user {username}: {e}")
        traceback.print_exc()  # Print full traceback to understand the exception better
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        print(f"General error while logging in user {username}: {e}")
        traceback.print_exc()  # Print full traceback to understand the exception better
        return jsonify({"error": "An error occurred"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()
            print(f"Database connection closed for user {username}")

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
    # return render_template('index.html')
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
    app.run(port = 5000)

