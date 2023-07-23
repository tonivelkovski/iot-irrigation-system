document.addEventListener("DOMContentLoaded", function () {
    let pageSize = 10;
    let currentPage = 1;
    const pageSizeSelect = document.getElementById("pageSizeSelect");

    pageSizeSelect.addEventListener("change", (event) => {
        pageSize = event.target.value;
        currentPage = 1;
        fetchData(currentPage, pageSize);
    });

    const fetchData = (page, size) => {
        fetch(`/allData?page=${page}&pageSize=${size}`)
            .then((response) => response.json())
            .then((data) => {
                updateTable(data.results);
                updatePagination(data.totalPages, page);
                currentPage = page;
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    const updateTable = (data) => {
        const tableBody = document.getElementById("data-body");
        tableBody.innerHTML = "";

        data.forEach((record) => {
            const row = document.createElement("tr");
            var date = new Date(record.save_time);

            row.innerHTML = ` <td>${record.air_temperature || "-"}</td>
            <td>${record.air_humidity || "-"}</td>
            <td>${record.tank_water_level || "-"}</td>
            <td>${record.soil_moisture || "-"}</td>
            <td>${date.toLocaleString("hr-HR") || "-"}</td> `;
            tableBody.appendChild(row);
        });
    };

    const updatePagination = (totalPages, currentPage) => {
        const pagination = document.getElementById("pagination");
        pagination.innerHTML = "";

        const hasData = totalPages > 0;
        const hasPrevPage = currentPage > 1;
        const hasNextPage = currentPage < totalPages;

        if (hasData && hasPrevPage) {
            const prevLink = document.createElement("a");
            prevLink.href = "#";
            prevLink.textContent = "Previous";
            prevLink.addEventListener("click", () => {
                currentPage--;
                fetchData(currentPage, pageSize);
            });
            pagination.appendChild(prevLink);
        }

        for (let i = 1; i <= totalPages; i++) {
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = i;

            if (i === currentPage) {
                link.classList.add("active");
            }

            link.addEventListener("click", () => {
                currentPage = i;
                fetchData(currentPage, pageSize);
            });

            pagination.appendChild(link);
        }

        if (hasData && hasNextPage) {
            const nextLink = document.createElement("a");
            nextLink.href = "#";
            nextLink.textContent = "Next";
            nextLink.addEventListener("click", () => {
                currentPage++;
                fetchData(currentPage, pageSize);
            });
            pagination.appendChild(nextLink);
        }

        const prevButton = document.getElementById("prevLink");
        const nextButton = document.getElementById("nextLink");
        if (prevButton) {
            prevButton.style.display = hasData && hasPrevPage ? "block" : "none";
        }
        if (nextButton) {
            nextButton.style.display = hasData && hasNextPage ? "block" : "none";
        }
    };

    const pollData = () => {
        setInterval(() => {
            fetchData(currentPage, pageSize);
        }, 5000);
    };

    fetchData(currentPage, pageSize);

    pollData();

    const deleteAllDataButton = document.getElementById("deleteAllData");
    const confirmationDialog = document.getElementById("confirmationDialog");
    const cancelButton = document.getElementById("cancelButton");
    const deleteConfirmationButton = document.getElementById("deleteButton");

    deleteAllDataButton.addEventListener("click", () => {
        confirmationDialog.style.display = "block";
        document.body.classList.add("dialog-open");
        handleEvent(true);
    });

    cancelButton.addEventListener("click", () => {
        confirmationDialog.style.display = "none";
        document.body.classList.remove("dialog-open");
        deleteConfirmationButton.removeEventListener("click", deleteAllDataHandler);
        deleteByDateConfirmation.removeEventListener("click", deleteByDateHandler);
    });

    const deleteByDate = document.getElementById("deleteByDate");
    deleteByDate.addEventListener("click", () => {
        const dateInput = document.getElementById("dateInputDelete");
        const selectedDate = new Date(dateInput.value);

        if (!selectedDate || isNaN(selectedDate)) {
            return;
        }

        confirmationDialog.style.display = "block";
        document.body.classList.add("dialog-open");
        handleEvent(false);
    });


    const deleteByDateConfirmation = document.getElementById("deleteButton");
    let deleteAllDataHandler;
    let deleteByDateHandler;

    function handleEvent(deleteAllData) {
        if (deleteAllData) {
            deleteConfirmationButton.removeEventListener("click", deleteByDateHandler);
            deleteAllDataHandler = () => {
                fetch(`/allData`, {
                    method: 'DELETE'
                })
                    .then((response) => {
                        if (response.ok) {
                            confirmationDialog.style.display = "none";
                            document.body.classList.remove("dialog-open");
                            fetchData(currentPage, pageSize);
                        }
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });
            };
            deleteConfirmationButton.addEventListener("click", deleteAllDataHandler);
        } else {
            deleteConfirmationButton.removeEventListener("click", deleteAllDataHandler);
            deleteByDateHandler = () => {
                const dateInput = document.getElementById("dateInputDelete");
                const selectedDate = new Date(dateInput.value);
                const formattedDate = selectedDate.toLocaleDateString('en-CA');

                fetch(`/deleteDataByDate?date=${formattedDate}`, {
                    method: 'DELETE'
                })
                    .then((response) => {
                        if (response.ok) {
                            confirmationDialog.style.display = "none";
                            document.body.classList.remove("dialog-open");
                            fetchData(currentPage, pageSize);
                        }
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });
            };
            deleteConfirmationButton.addEventListener("click", deleteByDateHandler);
        }
    }
});