document.addEventListener('DOMContentLoaded', function () {

    function fetchedData() {
        fetch('/fetchLatestData', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
        
                document.getElementById('temperature').textContent = data.air_temperature || '-';
                document.getElementById('humidity').textContent = data.air_humidity || '-';
                updateTextValueColor('water-level', data.tank_water_level);
                updateTextValueColor('moisture', data.soil_moisture);
                let date = new Date(data.save_time);
                document.getElementById('save-time').textContent = date.toLocaleString('hr-HR') || '-';
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    fetchedData();
    setInterval(fetchedData, 10000);

    function updateTextValueColor(elementId, value) {
        const element = document.getElementById(elementId);

        if (value < 30) {
            element.style.color = 'red';
        } else if (value >= 30 && value <= 60) {
            element.style.color = 'yellow';
        } else {
            element.style.color = 'green';
        }

        element.textContent = value || '-';
    }
    
    const bestDataButton = document.getElementById("bestData");
    const worstDataButton = document.getElementById("worstData");
    const resultContainer = document.getElementById("resultContainer");

    bestDataButton.addEventListener("click", fetchData.bind(null, "best"));
    worstDataButton.addEventListener("click", fetchData.bind(null, "worst"));

    function fetchData(type) {
        const dateInput = document.getElementById("dateInput").value;
        const dataSelect = document.getElementById("dataSelect").value;

        fetch(`/fetchFilteredData?type=${type}&date=${dateInput}&data=${dataSelect}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.length > 0) {
                    if (type === "best") {
                        displayResult(data[0], true);
                    } else {
                        displayResult(data[data.length - 1], false);
                    }
                } else {
                    displayResult(null, null);
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    function displayResult(result, flag) {
        if (result && flag == true) {
            let date = new Date(result.save_time);

            resultContainer.innerHTML = `
          <p><b>Best data for selected date:</b></p>
          <p>Air temperature: ${result.air_temperature}</p>
          <p>Air humidity: ${result.air_humidity}</p>
          <p>Tank water level: ${result.tank_water_level}</p>
          <p>Soil moisture: ${result.soil_moisture}</p>
          <p>Save time: ${date.toLocaleString("hr-HR")}</p> `;

        } else if (result && flag == false) {
            let date = new Date(result.save_time);

            resultContainer.innerHTML = `
          <p><b>Worst data for selected date:</b></p>
          <p>Air temperature: ${result.air_temperature}</p>
          <p>Air humidity: ${result.air_humidity}</p>
          <p>Tank water level: ${result.tank_water_level}</p>
          <p>Soil moisture: ${result.soil_moisture}</p>
          <p>Save time: ${date.toLocaleString("hr-HR")}</p> `;
        } else {
            resultContainer.innerHTML = "<p><b>There is no data for the selected date and type.</b></p>";
        }
    }
});

const turnOnButton = document.getElementById("turnOn");
const turnOffButton = document.getElementById("turnOff");

turnOnButton.addEventListener("click", () => {
    fetch("http://irrigation-system.local:80/turnOn", { method: "POST" })
        .then(response => {
            if (response.ok) {
                console.log("Signal successfully sent to ESP32 to turn on.");
            } else {
                console.error("Error sending signal to ESP32.");
            }
        })
        .catch(error => {
            console.error("Error sending signal to ESP32:", error);
        });
});

turnOffButton.addEventListener("click", () => {
    fetch("http://irrigation-system.local:80/turnOff", { method: "POST" })
        .then(response => {
            if (response.ok) {
                console.log("Signal successfully sent to ESP32 to turn off.");
            } else {
                console.error("Error sending signal to ESP32.");
            }
        })
        .catch(error => {
            console.error("Error sending signal to ESP32:", error);
        });
});

const sendFetchDurationButton = document.getElementById("sendFetchDuration");
const durationBetweenFetches = document.getElementById("durationBetweenFetches");

sendFetchDurationButton.addEventListener("click", () => {
    const fetchDurationValue = durationBetweenFetches.value;    
    const url = "http://irrigation-system.local:80/" + fetchDurationValue;
    
    fetch(url, { method: "POST" })
        .then(response => {
            if (response.ok) {
                console.log("Signal successfully sent to ESP32 with values for fetching.");
                durationBetweenFetches.value = "";
            } else {
                console.error("Error sending signal to ESP32.");
            }
        })
        .catch(error => {
            console.error("Error sending signal to ESP32:", error);
        });
});