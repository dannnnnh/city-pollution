import "./App.css";
//test another coom
import React, { useState, useEffect } from "react";

//Import  all needed components for recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {

  //This is for the graph data
  const [data, setData] = useState([]);

  //Station names to replace the station codes
  const [stations, setStations] = useState([]);

  //Loading state (text)
  const [loading, setLoading] = useState(true);

  //Date formatter to human format (day, month, year)
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });


  //Function for fetching the stations data
  const fetchStations = async () => {
    try {
      const response = await fetch("https://luftdaten.berlin.de/api/stations");

      //convert the response to json
      const jsonData = await response.json();
      return jsonData;

      //catch any errors
    } catch (error) {
      console.error("Error fetching station data:", error);
      return [];
    }
  };


  //Function for creating a map of station codes to station names
  const createStationCodeToNameMap = (stations) => {
    const stationCodeToNameMap = {};

    stations.forEach((station) => {
      const stationNameWithoutCode = station.name.replace(/^\d+\s/, "");
      stationCodeToNameMap[station.code] = stationNameWithoutCode;
    });

    return stationCodeToNameMap;
  };

  //Loadfing the main data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const stationData = await fetchStations();
        setStations(stationData);

        const response = await fetch(
          "https://luftdaten.berlin.de/api/lqis/data"
        );
        const jsonData = await response.json();
        setData(jsonData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  //If loading is true, show loading text
  if (loading) {
    return <div>Loading...</div>;
  }

  //Create a map of station codes to station names
  const stationCodeToNameMap = createStationCodeToNameMap(stations);

  //Function for handling the most polluted keiz text
  const findMostPollutedKeiz = (data) => {

    //Set the most polluted keiz to empty string
    let mostPollutedKeiz = "";
    let pollutants = new Map(); // Use a Map to store unique pollutants and their values

    //Loop through the data
    data.forEach((stationData) => {
      //Loop through the station data
      stationData.data.forEach((measurement) => {

        //If the current measurement is greater than the current max, set the current max to the current measurement
        const currentMax = pollutants.get(measurement.component);
        if (!currentMax || measurement.value > currentMax) {

          //Set the most polluted keiz to the current station
          pollutants.set(measurement.component, measurement.value);

          //if the measurement is lqi, set the most polluted keiz to the current station
          if (measurement.component === "lqi") {
            mostPollutedKeiz = stationData.station;
          }
        }
      });
    });

    return { mostPollutedKeiz, pollutants };
  };


  //Get the most polluted keiz and pollutants
  const { mostPollutedKeiz, pollutants } = findMostPollutedKeiz(data);

  //Format the date
  const currentDate = dateFormatter.format(new Date());

  //Get the most polluted keiz name
  const mostPollutedStationName =
    stationCodeToNameMap[mostPollutedKeiz] || mostPollutedKeiz;

  //Get the top 2 pollutants
  const sortedPollutants = Array.from(pollutants.entries())
    .sort((a, b) => b[1] - a[1]) // Sort pollutants by descending values
    .slice(0, 2); // Get the top 2 pollutants

  //Create a string of the pollutants
  const pollutantsString = sortedPollutants
    .map(([component, value]) => `${component} (level ${value})`)
    .join(" and ");

  return (
    <div className="App">
      <div style={{ margin: "16px" }}>
        <h1 style={{ paddingTop: "48px", marginBottom: "16px" }}>
          💨 Berlin pollution data
        </h1>
        <p style={{ marginBottom: "8px" }}>
          Real time pollution level from around the city.
        </p>
        <div style={{ margin: "32px" }}>
          <h3 style={{ lineHeight: "48px" }}>
            On{" "}
            <span
              style={{
                color: "white",
                backgroundColor: "blue",
                padding: "7px",
                borderRadius: "4px",
                margin: "2px",
              }}
            >
              {currentDate}
            </span>
            , the most polluted keiz in Berlin is{" "}
            <span
              style={{
                color: "white",
                backgroundColor: "blue",
                padding: "7px",
                borderRadius: "4px",
                margin: "2px",
              }}
            >
              {mostPollutedStationName}
            </span>{" "}
            with the most amount of{" "}
            <span
              style={{
                color: "white",
                backgroundColor: "blue",
                padding: "7px",
                borderRadius: "4px",
                margin: "2px",
              }}
            >
              {pollutantsString}
            </span>
            .
          </h3>

          <p>Interpretation of data (Adding soon)</p>
        </div>
      </div>
      <div
        style={{
          margin: "4px",
          width: "100%",
          display: "flex",
          justifyContent: "center", // Add this line to center the charts
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
       
        {data.map((stationData, index) => {
          const chartData = stationData.data;
          const firstMeasurement = stationData.data[0];
          return (
            <div
              key={index}
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "1px",
                margin: "16px",
              }}
            >
              <h3 style={{ marginTop: "24px" }}>
                {stationCodeToNameMap[stationData.station] ||
                  stationData.station}
              </h3>
              {firstMeasurement && (
                <p style={{ marginTop: "24px" }}>
                  {dateFormatter.format(new Date(firstMeasurement.datetime))}
                </p>
              )}
              <div
                style={{
                  minWidth: "300px",
                  height: 250,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    // Remove the width property
                    height={250}
                    margin={{
                      top: 12,
                      right: 30,
                      left: 20,
                      bottom: 12,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="component" />
                    <YAxis />
                    <Tooltip />

                    <Bar dataKey="value" fill="blue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
