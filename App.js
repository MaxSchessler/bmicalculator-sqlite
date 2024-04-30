// Written by Max Schessler on 4/30/24
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,

 } from 'react-native';

 import {
   useEffect,
  useState
 } from "react";

import * as SQLite from "expo-sqlite";

// open the sqlite database
const db = SQLite.openDatabase("bmiDB.db");

function insertBMI(height, weight, bmi, SetBMIHistory) {
  const date = new Date().toISOString();
  db.transaction(
    (tx) => {
      tx.executeSql("insert into bmi (height, weight, bmi, date) values (?, ?, ?, ?)",
       [height, weight, bmi, date]);
    },
    (err) => {alert(err.message)},
    null
  );
};

function getData(SetBMIHistory) {
  db.transaction((tx) => {
    tx.executeSql(
      "select * from bmi;",
      [],
      (_, {rows}) => SetBMIHistory(rows._array)
    );
  });
}

function createTable() {
  db.transaction((tx) => {
    tx.executeSql(
      "create table if not exists bmi (id integer primary key not null, height real, weight real, bmi real, date text);"
    );
  });
}

/* USED FOR DEV TESTING
function dropTable() {
  db.transaction((tx) => {
    tx.executeSql("drop table if exists bmi");
  },(err => {alert(err.message)}),
  );
};
*/

export default function App() {
  bmiAssesment = "Assessing your BMI\n\tUnderweight: less than 18.5\n\t" + 
  "Healthy: 18.5 to 24.0\n\tOverweight: 25.0 to 29.9\n\tObese: 30.0 to higher";
  const [Weight, SetWeight] = useState("");
  const [Height, SetHeight] = useState("");
  const [BMI, SetBMI] = useState(null);
  const [BMIHistory, SetBMIHistory] = useState([]); // list of json

  // when rendered - get the bmi history from database
  useEffect(() => {

    // drop table used for dev testing
    //dropTable(); 
    createTable();
    getData(SetBMIHistory);
  }, []);

  function Calculate() {
    try {
      if (Height === "" || Weight === "") {
        SetBMI("Not valid number.");
        return;
      }
      const height = parseFloat(Height);
      const weight = parseFloat(Weight);
      // every resource i have found says weight (lb) / [height (in)]2 x 703
      // however when i must have an error i cannot find because that means i am very 
      // underweight

      let bmi = (weight / (height * height)) * 703;
      console.log(bmi);

      insertBMI(height, weight, bmi.toFixed(2), SetBMIHistory); // insert the values into the table
      getData(SetBMIHistory); // this will render when BMIHistory state variable is updated.

      SetBMI("Body Mass Index is " + bmi.toFixed(2));
      SetHeight("");
      SetWeight("");
    } catch {
      SetBMI("Not valid number.");
      return;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.HeaderArea}>
        <Text style={styles.HeaderText}>BMI Calculator</Text>
      </View>
      <TextInput 
        style={styles.TextInput}
        onChangeText={SetWeight}
        value={Weight}
        placeholder='Weight in Pounds'
      />
      <TextInput 
        style={styles.TextInput}
        onChangeText={SetHeight}
        value={Height}
        placeholder='Height in Inches'
      />
      <Pressable
        style={styles.Button}
        onPress={Calculate}
      >
        <Text style={styles.ButtonText}>Compute BMI</Text>
      </Pressable>
      <View style={styles.BMIArea}>
        <Text style={styles.BMIText}>{BMI != null ? BMI : ""}</Text>
      </View>
      <View>
        <Text style={styles.sectionHeading}>{BMIHistory.length > 0 ? "BMI History (" + BMIHistory.length + ") " : null}</Text>
        {BMIHistory && Object.keys(BMIHistory).length > 0 
          ? Object.values(BMIHistory).map((bmi, index) => (
              <Text key={index} style={styles.BMIHistory}>
                {/* Render BMI object properties here 
                Height: {bmi.height}, Weight: {bmi.weight}, BMI: {bmi.bmi}, Date: {bmi.date}*/}
                {new Date(bmi.date).toISOString().split("T")[0]}: {bmi.bmi.toFixed(2)} (W:{bmi.weight}, H:{bmi.height})
              </Text>
            )) 
          : null
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },

  HeaderArea: {
    backgroundColor: "#f4511e",
    height: 120,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
  },

  HeaderText: {
    color: "white",
    paddingTop: 60,
    fontSize: 28,
    fontWeight: "bold",
  },

  TextInput: {
    height: 50,
    marginTop: 10,
    marginRight: 10,
    marginLeft: 10,
    padding: 10,
    borderRadius: 4,
    fontSize: 24,
    backgroundColor: "lightgray",
  },

  Button: {
    backgroundColor: "#34495e",
    height: 60,
    marginTop: 10,
    marginRight: 10,
    marginLeft: 10,
    padding: 10,
    borderRadius: 4,
    display: 'flex',
    justifyContent: "center",
    alignItems: "center",
  },

  ButtonText: {
    fontSize: 24,
    color: "white",
  },

  BMIArea: {
    paddingTop: 50,
    marginLeft: 20,
  }, 
  BMIText: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
  },

  BMIHistory: {
    fontSize: 20,
    marginLeft: 40
  },
  sectionHeading: {
    fontSize: 24,
    marginBottom: 8,
    marginLeft: 40
  },

});
