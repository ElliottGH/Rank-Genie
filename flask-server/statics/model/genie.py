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

        self.merged_df = pd.merge(self.reg_data, self.pay_data, on='id', how='left')
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

      ### DELETE THIS AFTER ###
      X_train.to_csv("Output.csv", index = None)

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
      self.model = xgb.XGBClassifier(objective ='binary:logistic', n_estimators = 300)


class RandomForestGenie(Genie):

    def __init__(self, reg_csv_data, pay_csv_data):
      super().__init__(reg_csv_data, pay_csv_data)
      self.model = RandomForestClassifier(n_estimators=50, random_state=42)

class RidgeRegressionGenie(Genie):
    pass

class DetectVPN():
  #import requests
  #from ipwhois import IPWhois
  def getIpLocation(ip):
    #res = DbIpCity.get(ip, api_key="free")
    #response = requests.get(f'https://ipapi.co/{ip}/json/').json()
    return #res.country
  
  def get_country_from_ip(ip):
        try:
            #ipwhois_result = IPWhois(ip).lookup_rdap()
            #country = ipwhois_result.get('asn_country_code')
            return #country
        except Exception as e:
            print(f"Error fetching data for IP {ip}: {e}")
            return None

  def replace_abbrev(abbrev):
    abbrev_to_country = {
    "AD": "Andorra",
    "AE": "United Arab Emirates",
    "AF": "Afghanistan",
    "AG": "Antigua and Barbuda",
    "AI": "Anguilla",
    "AL": "Albania",
    "AM": "Armenia",
    "AO": "Angola",
    "AQ": "Antarctica",
    "AR": "Argentina",
    "AS": "American Samoa",
    "AT": "Austria",
    "AU": "Australia",
    "AW": "Aruba",
    "AX": "Åland Islands",
    "AZ": "Azerbaijan",
    "BA": "Bosnia and Herzegovina",
    "BB": "Barbados",
    "BD": "Bangladesh",
    "BE": "Belgium",
    "BF": "Burkina Faso",
    "BG": "Bulgaria",
    "BH": "Bahrain",
    "BI": "Burundi",
    "BJ": "Benin",
    "BL": "Saint Barthélemy",
    "BM": "Bermuda",
    "BN": "Brunei Darussalam",
    "BO": "Bolivia",
    "BQ": "Bonaire",
    "BR": "Brazil",
    "BS": "Bahamas",
    "BT": "Bhutan",
    "BV": "Bouvet Island",
    "BW": "Botswana",
    "BY": "Belarus",
    "BZ": "Belize",
    "CA": "Canada",
    "CC": "Cocos Islands",
    "CD": "Congo",
    "CF": "Central African Republic",
    "CG": "Congo",
    "CH": "Switzerland",
    "CI": "Côte d'Ivoire",
    "CK": "Cook Islands",
    "CL": "Chile",
    "CM": "Cameroon",
    "CN": "China",
    "CO": "Colombia",
    "CR": "Costa Rica",
    "CU": "Cuba",
    "CV": "Cabo Verde",
    "CW": "Curaçao",
    "CX": "Christmas Island",
    "CY": "Cyprus",
    "CZ": "Czechia",
    "DE": "Germany",
    "DJ": "Djibouti",
    "DK": "Denmark",
    "DM": "Dominica",
    "DO": "Dominican Republic",
    "DZ": "Algeria",
    "EC": "Ecuador",
    "EE": "Estonia",
    "EG": "Egypt",
    "EH": "Western Sahara",
    "ER": "Eritrea",
    "ES": "Spain",
    "ET": "Ethiopia",
    "FI": "Finland",
    "FJ": "Fiji",
    "FK": "Falkland Islands",
    "FM": "Micronesia",
    "FO": "Faroe Islands",
    "FR": "France",
    "GA": "Gabon",
    "GB": "United Kingdom of Great Britain and Northern Ireland",
    "GD": "Grenada",
    "GE": "Georgia",
    "GF": "French Guiana",
    "GG": "Guernsey",
    "GH": "Ghana",
    "GI": "Gibraltar",
    "GL": "Greenland",
    "GM": "Gambia",
    "GN": "Guinea",
    "GP": "Guadeloupe",
    "GQ": "Equatorial Guinea",
    "GR": "Greece",
    "GS": "South Georgia and the South Sandwich Islands",
    "GT": "Guatemala",
    "GU": "Guam",
    "GW": "Guinea-Bissau",
    "GY": "Guyana",
    "HK": "Hong Kong",
    "HM": "Heard Island and McDonald Islands",
    "HN": "Honduras",
    "HR": "Croatia",
    "HT": "Haiti",
    "HU": "Hungary",
    "ID": "Indonesia",
    "IE": "Ireland",
    "IL": "Israel",
    "IM": "Isle of Man",
    "IN": "India",
    "IO": "British Indian Ocean Territory",
    "IQ": "Iraq",
    "IR": "Iran",
    "IS": "Iceland",
    "IT": "Italy",
    "JE": "Jersey",
    "JM": "Jamaica",
    "JO": "Jordan",
    "JP": "Japan",
    "KE": "Kenya",
    "KG": "Kyrgyzstan",
    "KH": "Cambodia",
    "KI": "Kiribati",
    "KM": "Comoros",
    "KN": "Saint Kitts and Nevis",
    "KP": "Korea (Democratic People's Republic of)",
    "KR": "Korea, Republic of",
    "KW": "Kuwait",
    "KY": "Cayman Islands",
    "KZ": "Kazakhstan",
    "LA": "Lao People's Democratic Republic",
    "LB": "Lebanon",
    "LC": "Saint Lucia",
    "LI": "Liechtenstein",
    "LK": "Sri Lanka",
    "LR": "Liberia",
    "LS": "Lesotho",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "LV": "Latvia",
    "LY": "Libya",
    "MA": "Morocco",
    "MC": "Monaco",
    "MD": "Moldova",
    "ME": "Montenegro",
    "MF": "Saint Martin",
    "MG": "Madagascar",
    "MH": "Marshall Islands",
    "MK": "North Macedonia",
    "ML": "Mali",
    "MM": "Myanmar",
    "MN": "Mongolia",
    "MO": "Macao",
    "MP": "Northern Mariana Islands",
    "MQ": "Martinique",
    "MR": "Mauritania",
    "MS": "Montserrat",
    "MT": "Malta",
    "MU": "Mauritius",
    "MV": "Maldives",
    "MW": "Malawi",
    "MX": "Mexico",
    "MY": "Malaysia",
    "MZ": "Mozambique",
    "NA": "Namibia",
    "NC": "New Caledonia",
    "NE": "Niger",
    "NF": "Norfolk Island",
    "NG": "Nigeria",
    "NI": "Nicaragua",
    "NL": "Netherlands",
    "NO": "Norway",
    "NP": "Nepal",
    "NR": "Nauru",
    "NU": "Niue",
    "NZ": "New Zealand",
    "OM": "Oman",
    "PA": "Panama",
    "PE": "Peru",
    "PF": "French Polynesia",
    "PG": "Papua New Guinea",
    "PH": "Philippines",
    "PK": "Pakistan",
    "PL": "Poland",
    "PM": "Saint Pierre and Miquelon",
    "PN": "Pitcairn",
    "PR": "Puerto Rico",
    "PS": "Palestine",
    "PT": "Portugal",
    "PW": "Palau",
    "PY": "Paraguay",
    "QA": "Qatar",
    "RE": "Réunion",
    "RO": "Romania",
    "RS": "Serbia",
    "RU": "Russian Federation",
    "RW": "Rwanda",
    "SA": "Saudi Arabia",
    "SB": "Solomon Islands",
    "SC": "Seychelles",
    "SD": "Sudan",
    "SE": "Sweden",
    "SG": "Singapore",
    "SH": "Saint Helena, Ascension and Tristan da Cunha",
    "SI": "Slovenia",
    "SJ": "Svalbard and Jan Mayen",
    "SK": "Slovakia",
    "SL": "Sierra Leone",
    "SM": "San Marino",
    "SN": "Senegal",
    "SO": "Somalia",
    "SR": "Suriname",
    "SS": "South Sudan",
    "ST": "Sao Tome and Principe",
    "SV": "El Salvador",
    "SX": "Sint Maarten (Dutch part)",
    "SY": "Syrian Arab Republic",
    "SZ": "Eswatini",
    "TC": "Turks and Caicos Islands",
    "TD": "Chad",
    "TF": "French Southern Territories",
    "TG": "Togo",
    "TH": "Thailand",
    "TJ": "Tajikistan",
    "TK": "Tokelau",
    "TL": "Timor-Leste",
    "TM": "Turkmenistan",
    "TN": "Tunisia",
    "TO": "Tonga",
    "TR": "Turkey",
    "TT": "Trinidad and Tobago",
    "TV": "Tuvalu",
    "TW": "Taiwan, Province of China",
    "TZ": "Tanzania, United Republic of",
    "UA": "Ukraine",
    "UG": "Uganda",
    "UM": "United States Minor Outlying Islands",
    "US": "United States",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VA": "Holy See",
    "VC": "Saint Vincent and the Grenadines",
    "VE": "Venezuela",
    "VG": "Virgin Islands (British)",
    "VI": "Virgin Islands (U.S.)",
    "VN": "Viet Nam",
    "VU": "Vanuatu",
    "WF": "Wallis and Futuna",
    "WS": "Samoa",
    "YE": "Yemen",
    "YT": "Mayotte",
    "ZA": "South Africa",
    "ZM": "Zambia",
    "ZW": "Zimbabwe"
    }
    
    abv = str(abbrev)
    return abbrev_to_country.get(abv)
  #new_df['Registered_IP'] = new_df['Registered_IP'].apply(replace_abbrev)
  #new_df.head()
  #new_df.to_csv("country_with_ID.csv", index=None)
pass