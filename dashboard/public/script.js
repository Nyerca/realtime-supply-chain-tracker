/* react to menu click */
  document.addEventListener("DOMContentLoaded", function () {
  const socket = new WebSocket('ws://localhost:3000');
              socket.onmessage = function(event) {
                  const data = JSON.parse(event.data);
                  updateMachineData(data);
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
  });





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

/*
// Arama butonunu toggle etme
const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
    if (window.innerWidth < 768) {
        e.preventDefault();
        searchForm.classList.toggle('show');
        if (searchForm.classList.contains('show')) {
            searchButtonIcon.classList.replace('bx-search', 'bx-x');
        } else {
            searchButtonIcon.classList.replace('bx-x', 'bx-search');
        }
    }
})
*/

// Notification Menu Toggle
document.querySelector('.notification').addEventListener('click', function () {
    document.querySelector('.notification-menu').classList.toggle('show');
});

// Close menus if clicked outside
window.addEventListener('click', function (e) {
    if (!e.target.closest('.notification') && !e.target.closest('.profile')) {
        document.querySelector('.notification-menu').classList.remove('show');
    }
});

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



google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawCharts);
function drawCharts() {
  // BEGIN LINE GRAPH

const lineChart = new google.visualization.LineChart(document.getElementById('line-chart'));

  let options = {
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
      minValue: 0,
      maxValue: 50000,
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
  let dataPoints = [['Time', 'Page Views', 'Unique Views']];
  let firstDraw = true;

  function randomNumber(base, step) {
    return Math.floor((Math.random() * step) + base);
  }

  function addDataPoint() {
    const now = new Date();
    const pageViews = randomNumber(10000, 4000);
    const uniqueViews = randomNumber(5000, 4000);

    dataPoints.push([now, pageViews, uniqueViews]);

    // Remove data older than 60 seconds
    const cutoff = new Date(now.getTime() - 60000);
    dataPoints = [dataPoints[0]].concat(
      dataPoints.slice(1).filter(row => row[0] >= cutoff)
    );

    const dataTable = google.visualization.arrayToDataTable(dataPoints);

    // Disable startup animation after first draw
    if (!firstDraw) options.animation.startup = false;
    lineChart.draw(dataTable, options);
    firstDraw = false;


  }

  addDataPoint();
  setInterval(addDataPoint, 1000);









  // BEGIN PIE CHART

  // pie chart data
  var pieData = google.visualization.arrayToDataTable([
    ['Country', 'Page Hits'],
    ['USA',      7242],
    ['Canada',   4563],
    ['Mexico',   1345],
    ['Sweden',    946],
    ['Germany',  2150]
  ]);
  // pie chart options
  var pieOptions = {
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
  // draw pie chart
  var pieChart = new google.visualization.PieChart(document.getElementById('pie-chart'));
  pieChart.draw(pieData, pieOptions);

  function updatePieChart() {
  // Increment each value randomly for demonstration
  pieData.setValue(0, 1, pieData.getValue(0, 1) + Math.floor(Math.random() * 100)); // USA
  pieData.setValue(1, 1, pieData.getValue(1, 1) + Math.floor(Math.random() * 50));  // Canada
  pieData.setValue(2, 1, pieData.getValue(2, 1) + Math.floor(Math.random() * 30));  // Mexico
  pieData.setValue(3, 1, pieData.getValue(3, 1) + Math.floor(Math.random() * 20));  // Sweden
  pieData.setValue(4, 1, pieData.getValue(4, 1) + Math.floor(Math.random() * 40));  // Germany

  // Redraw the chart with updated data
  pieChart.draw(pieData, pieOptions);
}

// Set interval to update chart every second
setInterval(updatePieChart, 1000);
}