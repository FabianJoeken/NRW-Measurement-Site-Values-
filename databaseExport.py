# Imports
import os
import pandas as pd
from sqlalchemy import create_engine

# Instantiate sqlachemy.create_engine object
engine = create_engine('postgresql://admin:admin@localhost:5432/elwas')
print("connecting to database...")

# iterate over measurementpoints
allPointsInfo = []
allMeasurements = []
print("collecting data to write...")
for mps in os.listdir('./messstellen'):
    if os.path.exists(os.path.join(os.getcwd(), './messstellen/' + mps + '/measurementsInfo.csv')):
        # read 'measurementInfo.csv'
        df = pd.read_csv('./messstellen/' + mps + '/measurementsInfo.csv')
        # insert LGD-Nummer so it can be used as primary key
        lgdAppend = []
        for row in df.iterrows():
            lgdAppend.append(mps)
        df.insert(0, "LGD-Nummer", lgdAppend, True)
        # collect all dataframes to join them later on and then write to database
        allPointsInfo.append(df)
        # iterate over single measured data
        for date in os.listdir('./messstellen/' + mps + '/messdaten'):
            dateAppend = []
            lgdAppend = []
            df = pd.read_csv('./messstellen/' + mps + '/messdaten/' + date)
            # append date and LGD-Nummer for identification
            for row in df.iterrows():
                dateAppend.append(date.split(".csv")[0])
                lgdAppend.append(mps)
            df.insert(0, "LGD-Nummer", lgdAppend, True)
            df.insert(1, "Datum der Probenahme", dateAppend, True)
            # collect all dataframes to join them later on and then write to database
            allMeasurements.append(df)

print("writing measurementPoints to database...")
#write list with measurementpointsInfo
dataToWrite = pd.read_csv('./data/messstellen.csv')
dataToWrite.to_sql('measurementPoints', engine, index=False, if_exists='replace')
# write all measurementInfos to database
print("writing measurementsInfo to database...")
dataToWrite = pd.concat(allPointsInfo)
dataToWrite.to_sql('measurementsInfo', engine, index=False, if_exists='replace')
# write all Measurements to database
print("writing measurements to database...")
dataToWrite = pd.concat(allMeasurements)
dataToWrite.to_sql('measurements', engine, index=False, if_exists='replace')

print("dataupload finished!")
