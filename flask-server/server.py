from flask import Flask

app = Flask(__name__)

##IMPORTANT REMINDER TO FIX LATER
##this python/flask things sends to localhost on port 5000 where react is using port 3000

if __name__ == '__main__':
    app.run(debug=True)

