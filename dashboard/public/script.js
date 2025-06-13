google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawCharts);
const socket = new WebSocket('ws://localhost:3000');

let pieChart, pieData, pieOptions;
let lineChart, lineData, lineOptions;
let firstDraw = true;
function updatePieChart(fr,de,es,us,it) {
      pieData.setValue(0, 1, fr);
      pieData.setValue(1, 1, de);
      pieData.setValue(2, 1, es);
      pieData.setValue(3, 1, us);
      pieData.setValue(4, 1, it);

      pieChart.draw(pieData, pieOptions);
  }

function updateLineChart(food,medicine,service,equipment)  {

    const values = lineData.slice(1).flatMap(row => row.slice(1));
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Optional buffer
    const buffer = (max - min) * 0.1 || 10;
    lineOptions.vAxis.maxValue = Math.ceil(max + buffer);


    const now = new Date();

    lineData.push([now, food,medicine,service,equipment]);

    // Remove data older than 60 seconds
    const cutoff = new Date(now.getTime() - 60000);
    lineData = [lineData[0]].concat(
      lineData.slice(1).filter(row => row[0] >= cutoff)
    );

    const dataTable = google.visualization.arrayToDataTable(lineData);

    // Disable startup animation after first draw
    if (!firstDraw) lineOptions.animation.startup = false;
    lineChart.draw(dataTable, lineOptions);
    firstDraw = false;
}

let ordersUsers;
let filteredResults;
let isSearching = false;
let searchTerm;



function fillOrders() {
    const num_projects = document.getElementById("num_projects");
    if (num_projects) num_projects.textContent = "| " + filteredResults.length + " Projects";

    const container = document.getElementById("order_rows");
    container.innerHTML = ""; // Clear previous content

    filteredResults.forEach(order => {
        const tr = document.createElement("tr");

        const statusClass =
            order.status === "Pending"
                ? "status-orange"
                : order.status === "Shipped"
                ? "status-blue"
                : order.status === "Received"
                ? "status-green"
                : "";

        tr.innerHTML = `
            <td>
                <p>${order.orderId}</p>
            </td>
            <td>
                <p>${new Date(order.createdOn).toLocaleString()}</p>
            </td>
            <td class="member">
                <figure><img src="${order.png}" /></figure>
                <div class="member-info">
                    <p>${order.email}</p>
                </div>
            </td>
            <td>
                <p>$${order.totalOrderAmount}</p>
            </td>
            <td class="status">
                    <span class="status-text ${statusClass}">${order.status}</span>
                </td>
        `;

        if (order.status === "Pending" || order.status === "Shipped") {
            const td = document.createElement("td");
            const button = document.createElement("button");

            button.type = "submit";
            button.className = "search-btn blue_button";

            let newStatus;
            if (order.status === "Pending") {
                button.id = "ship_button";
                button.textContent = "Ship to customer";
                newStatus = "Shipped";
            } else if (order.status === "Shipped") {
                button.id = "delivered_button";
                button.textContent = "Delivered to customer";
                newStatus = "Received";
            }

            // Send message over socket on click
            button.addEventListener("click", () => {
                const message = {
                    orderId: order.orderId,
                    newStatus: newStatus
                };
                socket.send(JSON.stringify(message));
            });

            td.appendChild(button);
            tr.appendChild(td);
        }

        container.appendChild(tr);
    });
}

function runFiltering() {
              if (isSearching) {
                filteredResults = ordersUsers.filter(order => {
                                return (
                                  order.orderId.toLowerCase().includes(searchTerm) ||
                                  order.createdOn.toLowerCase().includes(searchTerm) ||
                                  order.totalOrderAmount.toString().includes(searchTerm) ||
                                  order.status.toLowerCase().includes(searchTerm) ||
                                  order.email.toLowerCase().includes(searchTerm)
                                );
                              });

              } else {
              filteredResults = ordersUsers;
              }

console.log("applyed filter: " + filteredResults);

              fillOrders();
}

function drawCharts() {
    lineChart = new google.visualization.LineChart(document.getElementById('line-chart'));
    lineOptions = {
    backgroundColor: 'transparent',
    colors: ['cornflowerblue', 'tomato'],
    fontName: 'Open Sans',
    focusTarget: 'category',
    chartArea: {
      left: 50,
      top: 10,
      width: '100%',
      height: '70%'
    },
    hAxis: {
      textStyle: { fontSize: 11 },
      format: 'HH:mm:ss',
      baselineColor: 'transparent',
      gridlines: { color: 'transparent' }
    },
    vAxis: {
      baselineColor: '#DDD',
      gridlines: { color: '#DDD', count: 4 },
      textStyle: { fontSize: 11 }
    },
	legend: 'none',
    animation: {
      duration: 500,
      easing: 'out',
      startup: true  // Only true for first draw
    }
  };
    lineData = [['Time', 'Food', 'Medicine', 'Service', 'Equipment']];

    pieData = google.visualization.arrayToDataTable([
        ['Country', '# Orders'],
        ['FR',      0],
        ['DE',   0],
        ['ES',   0],
        ['US',    0],
        ['IT',  0]
    ]);
   pieOptions = {
  backgroundColor: 'transparent',
  pieHole: 0.4,
  colors: ["cornflowerblue", "olivedrab", "orange", "tomato", "crimson", "purple", "turquoise", "forestgreen", "navy", "gray"],
  pieSliceText: 'value',
  tooltip: {
    text: 'percentage'
  },
  fontName: 'Open Sans',
  chartArea: {
      left: 50,
    width: '100%',
    height: '94%'
  },
  legend: {
    textStyle: {
      fontSize: 13
    }
  },
  animation: {
    duration: 500, // Adjust duration for visibility
    easing: 'out' // Choose 'linear', 'inAndOut', etc. for different effects
  }
};
   pieChart = new google.visualization.PieChart(document.getElementById('pie-chart'));
   pieChart.draw(pieData, pieOptions);
}



  document.addEventListener("DOMContentLoaded", function () {

    function updateProgressBar(value, progressBarClass, progressValueId) {
    const progressBar = document.querySelector(progressBarClass);
    const progressValueText = document.getElementById(progressValueId);

    // Show actual value, even over 100
    progressBar.style.width = value + '%';
    progressBar.setAttribute('aria-valuenow', value);
    progressValueText.textContent = value + '%';

    // Remove previous color classes
    progressBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');
    progressValueText.classList.remove('text-danger', 'text-warning', 'text-success');

    // Add color based on value
    if (value < 60) {
      progressBar.classList.add('bg-danger');
      progressValueText.classList.add('text-danger');
    } else if (value < 100) {
      progressBar.classList.add('bg-warning');
      progressValueText.classList.add('text-warning');
    } else {
      progressBar.classList.add('bg-success');
      progressValueText.classList.add('text-success');
    }
  }
    const progressDataIncome = {value: 0};
    const progressDataCustomers = {value: 0};
    // Initial render
    updateProgressBar(progressDataIncome.value, '.progress-bar-income', 'progress_value_income');
    updateProgressBar(progressDataCustomers.value, '.progress-bar-customers', 'progress_value_customers');

    const targetIncome = 50000
    const targetCustomers = 40


    socket.onmessage = function(event) {
      const data = JSON.parse(event.data);
      console.log(data)


        const newOrders = document.getElementById('new_orders');
        if (newOrders) newOrders.textContent = data.orderCount;

        const totalCustomers = document.getElementById('total_customers');
        if (totalCustomers) totalCustomers.textContent = data.userCount;

        const totalAmount = document.getElementById('total_amount');
        if (totalAmount) totalAmount.textContent = data.totalOrderAmount + ".00 €";




        const pendingOrders = document.getElementById('pending_orders');
        if(pendingOrders) pendingOrders.textContent = data.statusCounts.Pending;
        const shippedOrders = document.getElementById('shipped_orders');
        if(shippedOrders) shippedOrders.textContent = data.statusCounts.Shipped;
        const receivedOrders = document.getElementById('received_orders');
        if(receivedOrders) receivedOrders.textContent = data.statusCounts.Received;


        progressDataIncome.value = Math.round((data.totalOrderAmount/targetIncome)*100);
        progressDataCustomers.value = Math.round((data.userCount/targetCustomers)*100);

        updateProgressBar(progressDataIncome.value, '.progress-bar-income', 'progress_value_income');
        updateProgressBar(progressDataCustomers.value, '.progress-bar-customers', 'progress_value_customers');

        const countryCounts = data.ordersByCountry.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});
        updatePieChart(
          countryCounts.FR || 0, //is missing, it falls back to 0
          countryCounts.DE || 0,
          countryCounts.ES || 0,
          countryCounts.US || 0,
          countryCounts.IT || 0
        );

        const firstKey = Object.keys(data.item_revenues)[0];
        const firstValue = data.item_revenues[firstKey] || {};
        const secondKey = Object.keys(data.item_revenues)[1];
        const secondValue = data.item_revenues[secondKey] || {};
        const thirdKey = Object.keys(data.item_revenues)[2];
        const thirdValue = data.item_revenues[thirdKey] || {};



        const firstItem = document.getElementById('first_item');
        const firstQuantity = document.getElementById('first_quantity');
        if (firstItem) firstItem.textContent = firstKey;
        if (firstQuantity) firstQuantity.textContent = firstValue.quantity;
        const secondItem = document.getElementById('second_item');
        const secondQuantity = document.getElementById('second_quantity');
        if (secondItem) secondItem.textContent = secondKey;
        if (secondQuantity) secondQuantity.textContent = secondValue.quantity;
        const thirdItem = document.getElementById('third_item');
        const thirdQuantity = document.getElementById('third_quantity');
        if (thirdItem) thirdItem.textContent = thirdKey;
        if (thirdQuantity) thirdQuantity.textContent = thirdValue.quantity;

        updateLineChart(
          data.item_revenues['Food']?.totalRevenue || 0,
          data.item_revenues['Medicine']?.totalRevenue || 0,
          data.item_revenues['Service']?.totalRevenue || 0,
          data.item_revenues['Equipment']?.totalRevenue || 0
        );

        ordersUsers = data.ordersUsers
        runFiltering()
    };

    const sections = document.querySelectorAll("main > [id]");
    const menuItems = document.querySelectorAll(".side-menu a");

    function showSection(id) {
      sections.forEach(section => {
        if (section.id === id) {
          section.style.display = "block";
        } else {
          section.style.display = "none";
        }
      });
    }

    // Initially show only dashboard
    showSection("dashboard");

    menuItems.forEach(item => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        const text = this.querySelector(".text").innerText.toLowerCase();
        showSection(text);
      });
    });


    const searchBtn = document.getElementById('search_btn');
    const searchInput = document.getElementById('search_input');
    searchBtn.addEventListener("click", function (e) {
            e.preventDefault();
                searchTerm = searchInput.value.trim().toLowerCase();
                console.log("searchTerm: " + searchTerm);
              if (!searchTerm) {
                isSearching = false;
              } else {isSearching = true;}
                runFiltering();
          });

 });




/* MENU HANDLING */
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

allSideMenu.forEach(item => {
    const li = item.parentElement;

    item.addEventListener('click', function () {
        allSideMenu.forEach(i => {
            i.parentElement.classList.remove('active');
        })
        li.classList.add('active');
    })
});

// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

// Sidebar toggle işlemi
menuBar.addEventListener('click', function () {
    sidebar.classList.toggle('hide');
});

// Sayfa yüklendiğinde ve boyut değişimlerinde sidebar durumunu ayarlama
function adjustSidebar() {
    if (window.innerWidth <= 576) {
        sidebar.classList.add('hide');  // 576px ve altı için sidebar gizli
        sidebar.classList.remove('show');
    } else {
        sidebar.classList.remove('hide');  // 576px'den büyükse sidebar görünür
        sidebar.classList.add('show');
    }
}

// Sayfa yüklendiğinde ve pencere boyutu değiştiğinde sidebar durumunu ayarlama
window.addEventListener('load', adjustSidebar);
window.addEventListener('resize', adjustSidebar);



// Menülerin açılıp kapanması için fonksiyon
    function toggleMenu(menuId) {
      var menu = document.getElementById(menuId);
      var allMenus = document.querySelectorAll('.menu');

      // Diğer tüm menüleri kapat
      allMenus.forEach(function(m) {
        if (m !== menu) {
          m.style.display = 'none';
        }
      });

      // Tıklanan menü varsa aç, yoksa kapat
      if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
      } else {
        menu.style.display = 'none';
      }
    }

    // Başlangıçta tüm menüleri kapalı tut
    document.addEventListener("DOMContentLoaded", function() {
      var allMenus = document.querySelectorAll('.menu');
      allMenus.forEach(function(menu) {
        menu.style.display = 'none';
      });
    });



