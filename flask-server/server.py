from flask import Flask, render_template, request, redirect, url_for #pip install Flask

#Library to connect MySQL db and insert csv file data
import mysql.connector #pip install sql.connector
import pandas as pd #pip install pandas

import os
from os.path import join, dirname, realpath

#Creating flask app
app = Flask(__name__)

#Enables debugging mode
app.config['DEBUG'] = True

#Connects to the MySQL server
mydb = mysql.connector.connect(
    host = "localhost",
    username = "root",
    password = "",
    database = "exceldb"
)

myCursor = mydb.cursor()
myCursor.execute("SHOW DATABASES")

##IMPORTANT REMINDER TO FIX LATER
##this python/flask things sends to localhost on port 5000 where react is using port 3000

@app.route("/back")
def backend():
    return {"backString": "Connected to Backend!"} 

#Root URL
@app.route('/')
def index():
    #Sets HTML template
    return render_template('index.html')

#Gets the uploaded files
@app.route('/', methods = ['POST'])
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
      # CVS Column Names
      col_names = ['']
      # Use Pandas to parse the CSV file
      csvData = pd.read_csv(filePath,names=col_names, header=None)
      # Loop through the Rows
      for i,row in csvData.iterrows():
             sql = "INSERT INTO addresses ( , ) VALUES (%s, %s, %s, %s, %s, %s)"
             value = (row[''],row[''],str(row['']))
             myCursor.execute(sql, value, if_exists='append')
             mydb.commit()
             print(i,row[''])

if __name__ == '__main__':
    app.run(debug=True)