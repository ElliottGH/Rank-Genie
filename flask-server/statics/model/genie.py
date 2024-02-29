import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import re
import xgboost as xgb

from abc import ABC

# Sklearn Libraries
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, Ridge, LogisticRegression, RidgeClassifierCV, RidgeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import make_scorer, mean_absolute_error, r2_score, mean_squared_error, accuracy_score, precision_score, confusion_matrix, roc_curve, roc_auc_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.decomposition import PCA

class DataParser():

    def __init__(self, reg_data, pay_data, ip_data, reg_drop_list):
       self.reg_data = reg_data
       self.pay_data = pay_data
       self.ip_data = ip_data
       self._synthesize_data(reg_drop_list)

    def _synthesize_data(self, reg_drop_list):

        # Clean Up User registration data
        self.reg_data['id'] = self.reg_data['CreatedDate']
        drop_list = reg_drop_list
        drop_list.append('CreatedDate')
        self.reg_data = self.reg_data.drop(drop_list, axis=1)
        # reg_data = reg_data.drop(['CreatedDate', 'Billing to IP Distance (Miles)', 'BillingAge', 'Billing Name to Reg Name Similarity', 'Campaign', 'utm_term', 'EmailAge', 'EmailVerification', 'ISPState', 'ISPCity', 'Tw_CallerType', 'Tw_Carrier', 'Tw_Type'], axis=1)
        self.reg_data['Registered_IP'] = self.reg_data['Registered_IP'].apply(lambda row: False if not self.is_valid_ip(row) else row)
        self.reg_data = self.reg_data[self.reg_data['Registered_IP'] != False].reset_index(drop=True)


        # Clean up Payment data
        self.pay_data.dropna(how='all', inplace=True)

        # Fixing variable types and remove invalud characters
        self.reg_data['id']= self.reg_data['id'].astype(int)
        self.pay_data['id']= self.pay_data['id'].astype(int)
        self.reg_data['RiskScore']= self.reg_data['RiskScore'].astype(float)

        self.merged_df = pd.merge(self.reg_data, self.pay_data, on='id', how='inner')
        #self.merged_df = pd.merge(self.merged_df, self.ip_data, on='id', how='inner')
        self.merged_df.rename(columns={'UserAgent': 'DeviceName'}, inplace=True)

    def get_amount_code(self, amount):
        encoded_values = {
        "0": 0,
        "Under $100": 0,
        "$101 - $200": 0,
        "$201 - $500": 0,
        "$501 - $999": 0,
        "$1000": 1,
        "$1001 - $1999": 1,
        "$2000": 1,
        "$2000+": 1

       }

        return encoded_values[amount]

    def dummy_encode(self, dummy_list):
         self.merged_df[dummy_list].apply(lambda col: col.fillna('Unknown'))
         self.merged_df = pd.get_dummies(self.merged_df, columns=dummy_list)


    def extract_device_name(self, cell_value):
        pattern = r'"deviceName":"(.*?)(?:"|$)'
        match = re.search(pattern, str(cell_value))
        return match.group(1).strip() if match else None


    def validate_ip_location(self, ip):
         try:
            ipwhois_result = IPWhois(ip).lookup_rdap()
            country = ipwhois_result.get('asn_country_code')
            return country
         except Exception as e:
            print(f"Error fetching data for IP {ip}: {e}")
            return None

    def replace_abbrev(self, abbrev):
      abbrev_to_country = json.load(country_abbrev)
      abv = str(abbrev)
      return abbrev_to_country.get(abv)

    def is_valid_ip(self, address):

        address = f"{address}"
        # Split the address into blocks
        blocks = address.split('.')

        # Check if there are exactly 4 blocks
        if len(blocks) != 4:
            return False

        for block in blocks:
            if not block.isdigit():
                return False

            # Check if the integer is in the valid range (0-255)
            num = int(block)
            if not (0 <= num <= 255):
                return False

            # Check if the block has the correct length (1, 2, or 3 digits)
            if len(block) < 1 or len(block) > 3:
                return False

            # Check for leading zeros in blocks with more than one digit
            if len(block) > 1 and block[0] == '0':
                return False

        return True

class Genie(ABC):

    def __init__(self, reg_csv_data, pay_csv_data):
      self.load_train_data(reg_csv_data, pay_csv_data)
      self.preprocess()

    def load_train_data(self, reg_csv_data, pay_csv_data):
      link_to_ipdata = None # Add a path to andrew's code

      regdf = pd.read_csv(reg_csv_data)
      paydf = pd.read_csv(pay_csv_data)
      #ip_data = pd.read_csv(link_to_ipdata)
      self.data = DataParser(regdf, paydf, None, ['CreatedDate', 'ISPCity','ISPCountryName', 'ExpectedVolumeFrequency', 'ISPName', 'utm_term', 'BillingAge', 'EmailVerification', 'Tw_Carrier'])

    def preprocess(self):
      self.data.merged_df['DeviceName'] = self.data.merged_df['DeviceName'].apply(self.data.extract_device_name)

      # binary encode Amount
      self.data.merged_df['Amount'].fillna("0", inplace=True)
      self.data.merged_df['Amount'] = self.data.merged_df['Amount'].apply(lambda x: self.data.get_amount_code(x))

      # categorize Joining Reasons
      self.data.merged_df['JoiningReason'].fillna("None", inplace=True)
      self.data.merged_df['JoiningReason'] = self.data.merged_df['JoiningReason'].apply(lambda x: x if x in ["Real Estate Wholesaler/Investor/REI", "Advertising/Marketing Agency", "Political", "Call Center/Market Research", "None"] else "Others")

      # Dummy Encode
      self.data.dummy_encode(['UserType', 'DeviceName', 'JoiningReason', 'ISPState', 'Campaign', 'Tw_CallerType', 'Tw_Type'])
      self.data.merged_df['EmailAge'].fillna('-1', inplace=True)
      self.data.merged_df['EmailAge'] = self.data.merged_df['EmailAge'].astype(int)
      self.data.merged_df['Billing to IP Distance (Miles)'].fillna('-1', inplace=True)
      self.data.merged_df['Billing to IP Distance (Miles)'] = self.data.merged_df['Billing to IP Distance (Miles)'].astype(int)

      self.dataframe = self.data.merged_df

    def split_data(self):
      y = self.dataframe['Amount']
      X = self.dataframe.drop(['Amount', 'Registered_IP', 'id'], axis=1)

      X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=1)

      self.X_train = X_train
      self.X_test = X_test
      self.y_train = y_train
      self.y_test = y_test

    def evaluate_model(self):
      scaler = StandardScaler()
      X_trainStan = scaler.fit_transform(self.X_train)
      X_testStan = scaler.transform(self.X_test)
      # fit the model on the training data
      self.model.fit(X_trainStan, self.y_train)

      # make predictions for training and test data
      yTrainPred = self.model.predict(X_trainStan)
      yTestPred = self.model.predict(X_testStan)

      # calculate R2 score for training and test data
      r2Train = r2_score(self.y_train, yTrainPred)
      r2Test = r2_score(self.y_test, yTestPred)

      # calculate MAE for training and test data
      MAE_Train = mean_absolute_error(self.y_train, yTrainPred)
      MAE_Test = mean_absolute_error(self.y_test, yTestPred)

      # accuracy
      accuracy_Train = accuracy_score(self.y_train, yTrainPred)
      accuracy_Test = accuracy_score(self.y_test, yTestPred)

      # precision
      precision_Train = precision_score(self.y_train, yTrainPred)
      precision_Test = precision_score(self.y_test, yTestPred)

      confusionMatrix = confusion_matrix(self.y_test, yTestPred)

      print("R2 Score (Training):", r2Train)
      print("R2 Score (Testing):", r2Test, "\n")

      print("MAE Score (Training):", MAE_Train)
      print("MAE Score (Testing):", MAE_Test, "\n")

      print("Accuracy Score (Training):", accuracy_Train)
      print("Accuracy Score (Testing):", accuracy_Test, "\n")

      print("Precision Score (Training):", precision_Train)
      print("Precision Score (Testing):", precision_Test, "\n")

      print("Confusion Matrix:\n", confusionMatrix, "\n")


class XGBoostGenie(Genie):

    def __init__(self, reg_csv_data, pay_csv_data):
      super().__init__(reg_csv_data, pay_csv_data)
      self.model = xgModel = xgb.XGBClassifier(objective ='binary:logistic', colsample_bytree = 0.3, learning_rate = 0.1,max_depth = 5, alpha = 10, n_estimators = 300)


class RandomForestGenie(Genie):

    def __init__(self, reg_csv_data, pay_csv_data):
      super().__init__(reg_csv_data, pay_csv_data)
      self.model = RandomForestClassifier(n_estimators=50, random_state=42)

class RidgeRegressionGenie(Genie):
    pass
