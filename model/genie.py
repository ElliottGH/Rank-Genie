

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