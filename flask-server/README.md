# Welcome to RankGenie

Improving revenue and product engagement is the main purpose of sales teams all around the world. These teams often spend time searching for strategies to best place their product in front of consumers. The main goal is converting these known consumers into paying customers; however, it tends to be unsuccessful. Attempting to fully utilize a business's pricing methods is one of the most difficult concepts to efficiently profit from, requiring the ability to identify and target a range of consumers and the possibility to convert them into paying customers. This capstone project, RankGenie, is an AI driven customer rating engine that ranks the companies clients based off of how they registered for the website and other significant information that was provided during the sign-up process. This will allow the organization to identify potential paying customers and invest their follow-ups on those customers over low-valued customers. It trains the model through the use of previously given historical data from a real-world organization to develop a system for ranking potential subscribers in the csv file provided by the website user.

# RankGenie Setup Guide for macOS

This guide provides step-by-step instructions for setting up a development environment on macOS, including installing Python, Pip, Homebrew, MySQL, and MySQL Workbench. Follow these steps carefully to ensure smooth installation and configuration.

## Step 1: Install Python

Make sure Python is installed on your system. If not, download and install it from the official [Python website](https://www.python.org/downloads/).

## Step 2: Install Pip

Pip should come bundled with Python. To verify the installation, open a terminal and run:

```pip --version```


If Pip is not installed or if you need to upgrade it, refer to the [official documentation](https://pip.pypa.io/en/stable/installation/).

## Step 3: Install Homebrew

Homebrew is a package manager for macOS. Follow the instructions in this [guide](https://mac.install.guide/homebrew/3#:~:text=Mac%20M1%2C%20M2%2C%20M3&text=Homebrew%20files%20are%20installed%20into,part%20of%20the%20default%20%24PATH%20.) to install Homebrew on your system.

## Step 4: Install Libraries using Pip

After installing Homebrew, you can use it to run the SQL service. First, install the required libraries using Pip:

```pip install mysql-connector-python```


## Step 5: Setup the MySQL Service

Follow these steps to set up the MySQL service using Homebrew:

1. Install MySQL: ```brew install mysql```

2. Check if MySQL service is running: ```brew services list```
   
   MySQL should be in this list, but if it's not running, start or restart it: ```brew services restart mysql``` or ```brew services start mysql```

3. Verify that the MySQL service is running properly.

## Step 6: Install MySQL Workbench and Test a Connection

Download and install MySQL Workbench from the [official website](https://www.mysql.com/products/workbench/).

When testing a connection, you may encounter password issues, as the initial password might be blank. To change the root password, follow these steps:

1. Open a terminal and log in to MySQL: ```mysql -u root -p```

2. When prompted, enter the initial password (which might be empty).

3. Change the root password: ```ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';```

4. Open MySql Workbench with your connection username:root password:root and run the following ```CreateRankGenie.sql```

Replace `'new_password'` with your desired password.

## Step 7: Install Node.js and React, run the application

To install Node.js and React, and run the frontend, follow these steps:

1. Install Node.js from the [official website](https://nodejs.org/).

2. Install React globally: ```npm install -g create-react-app```

3. Run the backend: ```python3 server.py```

4. Run the frontend: ```npm start```

That's it! You've successfully set up your development environment to run Rank Genie with Python, Pip, Homebrew, MySQL, and MySQL Workbench on macOS. 








