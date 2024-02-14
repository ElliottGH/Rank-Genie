from flask import Flask, render_template, request, redirect, url_for #pip install Flask

#Library to connect MySQL db and insert csv file data
import mysql.connector #pip install mysql-connector-python
from mysql.connector import Error
import pandas as pd #pip install pandas

import os
from os.path import join, dirname, realpath

#Creating flask app
app = Flask(__name__)

#Enables debugging mode
app.config['DEBUG'] = True

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

for x in myCursor:
     print(x)

##IMPORTANT REMINDER TO FIX LATER
##this python/flask things sends to localhost on port 5000 where react is using port 3000
     
@app.route("/back")
def backend():
    return {"backString": "Connected to Backend!"} 

#Root URL
@app.route('/')
def index():
    #Sets HTML template
    # return render_template('index.html')
    return "trying this out"

#@app.route is the same as fetch("") in js
#Gets the uploaded files
@app.route('/fileUpload', methods = ['POST'])
def uploadFiles():
    uploaded_File = request.files['file']  #Gets the uploaded file
    if uploaded_File.filename != '':
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_File.filename)
        uploaded_File.save(file_path) #set file path
    parseCSV(file_path)

    return redirect(url_for('index'))

#Will upload the csv files into the 'uploads' folder
UPLOAD_FOLDER = 'statics/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

#I think this needs to be combined with the temporary backend in App.js to work properly.
#Parses the given CSV file
def parseCSV(filePath):
    # Use Pandas to parse the CSV file
    csvData = pd.read_csv(filePath)
    fileName = os.path.basename(filePath)
    # Sanitize column names by removing special characters and spaces
    csvData.columns = [col.replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "").replace("/", "_").replace(",", "") for col in csvData.columns]

    # Create the table if it doesn't exist
    create_table_query = f"CREATE TABLE IF NOT EXISTS {fileName} ("
    for col in csvData.columns:
        create_table_query += f"`{col}` TEXT,"  # Use backticks to escape column names
    create_table_query = create_table_query[:-1]  # remove the last comma
    create_table_query += ")"
    myCursor.execute(create_table_query)
    mydb.commit()

    # Insert data into the table
    for index, row in csvData.iterrows():
        insert_query = f"INSERT INTO {fileName} ({', '.join(csvData.columns)}) VALUES ({', '.join(['%s']*len(row))})"
        myCursor.execute(insert_query, tuple(row))
    mydb.commit()
def parseCSV(filePath):
    # Use Pandas to parse the CSV file
    csvData = pd.read_csv(filePath)
    fileName = os.path.splitext(os.path.basename(filePath))[0]
    print("Filename:", fileName)  # Print filename for debugging purposes

    # Sanitize column names by replacing special characters and spaces
    csvData.columns = [col.replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "").replace("/", "_").replace(",", "") for col in csvData.columns]

    # Create the table if it doesn't exist
    create_table_query = f"CREATE TABLE IF NOT EXISTS {fileName} ("
    for col in csvData.columns:
        create_table_query += f"`{col}` TEXT,"  # Use backticks to escape column names
    create_table_query = create_table_query[:-1]  # remove the last comma
    create_table_query += ")"
    myCursor.execute(create_table_query)
    mydb.commit()

    # Insert data into the table
    for index, row in csvData.iterrows():
        insert_query = f"INSERT INTO {fileName} ({', '.join(csvData.columns)}) VALUES ({', '.join(['%s']*len(row))})"
        myCursor.execute(insert_query, tuple(row))
    mydb.commit()


parseCSV("dataset.csv")

if __name__ == '__main__':
    app.run(port = 5000)