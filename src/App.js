import "./App.css";
//test another comment
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [data, setData] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const fetchStations = async () => {
    try {
      const response = await fetch("https://luftdaten.berlin.de/api/stations");
      const jsonData = await response.json();
      return jsonData;
    } catch (error) {
      console.error("Error fetching station data:", error);
      return [];
    }
  };

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

  if (loading) {
    return <div>Loading...</div>;
  }

  const stationCodeToNameMap = createStationCodeToNameMap(stations);

  //Function for handling the most polluted keiz text
  const findMostPollutedKeiz = (data) => {
    let mostPollutedKeiz = "";
    let pollutants = new Map(); // Use a Map to store unique pollutants and their values

    data.forEach((stationData) => {
      stationData.data.forEach((measurement) => {
        const currentMax = pollutants.get(measurement.component);
        if (!currentMax || measurement.value > currentMax) {
          pollutants.set(measurement.component, measurement.value);
          if (measurement.component === "lqi") {
            mostPollutedKeiz = stationData.station;
          }
        }
      });
    });

    return { mostPollutedKeiz, pollutants };
  };

  const { mostPollutedKeiz, pollutants } = findMostPollutedKeiz(data);
  const currentDate = dateFormatter.format(new Date());
  const mostPollutedStationName =
    stationCodeToNameMap[mostPollutedKeiz] || mostPollutedKeiz;

  const sortedPollutants = Array.from(pollutants.entries())
    .sort((a, b) => b[1] - a[1]) // Sort pollutants by descending values
    .slice(0, 2); // Get the top 2 pollutants

  const pollutantsString = sortedPollutants
    .map(([component, value]) => `${component} (level ${value})`)
    .join(", ");

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
                    <Legend />
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
