def preprocess(reg_data, pay_data):
    # Clean Up User registration data
    reg_data['id'] = reg_data['CreatedDate']
    reg_data = reg_data.drop(['CreatedDate', 'Billing to IP Distance (Miles)', 'BillingAge', 'Billing Name to Reg Name Similarity', 'Campaign', 'utm_term', 'EmailAge', 'ExpectedVolumeFrequency'], axis=1)
    reg_data['Registered_IP'] = reg_data['Registered_IP'].apply(lambda row: False if not is_valid_ip(row) else row)
    reg_data = reg_data[reg_data['Registered_IP'] != False].reset_index(drop=True)

    # dummy code UserType
    reg_data['UserType'].fillna('Unknown', inplace=True)
    reg_data = pd.get_dummies(reg_data, columns=['UserType'], prefix='UserType')

    # Clean up Payment data
    pay_data.dropna(how='all', inplace=True)

    # Fixing variable types
    reg_data['id']=reg_data['id'].astype(int)
    pay_data['id']=pay_data['id'].astype(int)

    merged_df = pd.merge(reg_data, pay_data, on='id', how='inner')

    merged_df.rename(columns={'UserAgent': 'DeviceName'}, inplace=True)


    def extract_device_name(cell_value):
        pattern = r'"deviceName":"(.*?)(?:"|$)'
        match = re.search(pattern, str(cell_value))
        return match.group(1).strip() if match else None


    merged_df['DeviceName'] = merged_df['DeviceName'].apply(extract_device_name)

    # dummy code DeviceName
    merged_df['DeviceName'].fillna('Unknown', inplace=True)
    merged_df = pd.get_dummies(merged_df, columns=['DeviceName'], prefix='DeviceName')

    # binary encode Amount
    merged_df['Amount'].fillna(0, inplace=True)
    merged_df['Amount'] = merged_df['Amount'].apply(lambda x: 0 if x == 0 else 1)

    # categorize Joining Reasons
    merged_df['JoiningReason'].fillna("None", inplace=True)
    merged_df['JoiningReason'] = merged_df['JoiningReason'].apply(lambda x: x if x in ["Real Estate Wholesaler/Investor/REI", "Advertising/Marketing Agency", "Political", "Call Center/Market Research", "None"] else "Others")

    # dummy code JoiningReason
    merged_df['JoiningReason'].fillna('Unknown', inplace=True)
    merged_df = pd.get_dummies(merged_df, columns=['JoiningReason'], prefix='JoiningReason')

    # dummy code ISPCountryName
    merged_df['ISPCountryName'].fillna('Unknown', inplace=True)
    merged_df = pd.get_dummies(merged_df, columns=['ISPCountryName'], prefix='ISPCountryName')

    return merged_df


# Using the risk score as the target variable
def configure_linear_model(df):
    y = df['Amount']
    X = df.drop(['Amount', 'Registered_IP', 'EmailVerification', 'ISPState', 'ISPCity', 'ISPName','Tw_CallerType', 'Tw_Carrier', 'Tw_Type', 'id'], axis=1)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=1)

    return X_train, X_test, y_train, y_test

#create pipeline that standardizes the features and fits a linear regression model
model = Pipeline([
    ('scaler', StandardScaler()),
    ('regressor', Ridge())
])

X_train, X_test, y_train, y_test = configure_linear_model(preprocessed_df)


#fit the model on the training data
model.fit(X_train, y_train)

#make predictions for training and test data
yTrainPred = model.predict(X_train)
yTestPred = model.predict(X_test)

#calculate training/test precision
#precisionTrain = precision_score(y_train, yTrainPred)
#precisionTest = accuracy_score(y_test, yTestPred)

#calculate training/test accuracy
#accuracyTrain = precision_score(y_train, yTrainPred)
#accuracyTest = accuracy_score(y_test, yTestPred)

#calculate R2 score for training and test data
r2Train = r2_score(y_train, yTrainPred)
r2Test = r2_score(y_test, yTestPred)

MAE_Train = mean_absolute_error(y_train, yTrainPred)
MAE_Test = mean_absolute_error(y_test, yTestPred)

#print("Training Precision:", precisionTrain)
#print("Testing Precision:", precisionTrain)

#print("\nTraining Accuracy:", accuracyTest)
#print("Testing Accuracy:", accuracyTest)

print("\nR2 Score (Training):", r2Train)
print("R2 Score (Testing):", r2Test)

print("\nMAE Score (Training):", MAE_Train)
print("MAE Score (Testing):", MAE_Test)

# print("Decision Tree Confusion Matrix:")
# print(confusion_matrix(y_test, yTestPred))
