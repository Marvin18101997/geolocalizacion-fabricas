/************** Sección de Marcadores y Gráfica de Pastel **************/
var map;
var cementoCounts = {
  'Cempro': 0,
  'Importados': 0,
  'Tolteca': 0,
  'Contrabando': 0,
  'Inactivo': 0,
  'Cerrado': 0
};
var markers = {
  'Cempro': [],
  'Importados': [],
  'Tolteca': [],
  'Contrabando': [],
  'Inactivo': [],
  'Cerrado': []
};

document.addEventListener('DOMContentLoaded', function () {
  try {
    // Inicializamos el mapa en el div con id "map"
    map = L.map('map').setView([15.783471, -90.230759], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
  } catch (e) {
    console.error("Error inicializando el mapa:", e);
  }
});

function leerExcel(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = new Uint8Array(reader.result);
      var workbook = XLSX.read(data, { type: 'array' });
      workbook.SheetNames.forEach(function (sheetName) {
        var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        XL_row_object.forEach(function (row) {
          agregarMarcadorAlMapa(row);
          contarCemento(row['Clasificacion']);
        });
      });
      generarGrafica();
    } catch (err) {
      console.error("Error leyendo el archivo Excel de marcadores:", err);
    }
  };
  reader.readAsArrayBuffer(input.files[0]);
}

function agregarMarcadorAlMapa(row) {
  try {
    var lat = row['Latitud'];
    var lng = row['Longitud'];
    var cemento = row['Clasificacion'];
    var markerColor;
    switch (cemento) {
      case 'Cempro':
        markerColor = 'green';
        break;
      case 'Importados':
        markerColor = 'yellow';
        break;
      case 'Tolteca':
        markerColor = 'red';
        break;
      case 'Contrabando':
        markerColor = 'blue';
        break;
      case 'Inactivo':
        markerColor = 'gray';
        break;
      case 'Cerrado':
        markerColor = 'black';
        break;
      default:
        markerColor = 'black';
    }
    var markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color:${markerColor}; width:20px; height:20px; border-radius:50%;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    var popupContent = '<b>Razon Social:</b> ' + row['R.S.'] + '<br>' +
      '<b>¿Es ConstruBlock?:</b> ' + row['¿Es constru?'] + '<br>' +
      '<b>Cliente:</b> ' + row['Cli'] + '<br>' +
      '<b>Ejecutivo:</b> ' + row['Eje'] + '<br>' +
      '<b>Teléfono:</b> ' + row['Telefono'] + '<br>' +
      '<b>Cemento:</b> ' + cemento + '<br>';
    var marker = L.marker([lat, lng], { icon: markerIcon }).bindPopup(popupContent);
    // Si el checkbox correspondiente está marcado, se añade el marcador al mapa
    if (document.getElementById(getCheckboxId(cemento)).checked) {
      marker.addTo(map);
    }
    markers[cemento].push(marker);
  } catch (err) {
    console.error("Error agregando marcador:", err, row);
  }
}

function contarCemento(cemento) {
  if (cementoCounts[cemento] !== undefined) {
    cementoCounts[cemento]++;
  }
}

function generarGrafica() {
  try {
    var ctx = document.getElementById('cementoChart').getContext('2d');
    var total = Object.values(cementoCounts).reduce((sum, value) => sum + value, 0);
    var data = {
      labels: Object.keys(cementoCounts),
      datasets: [{
        data: Object.values(cementoCounts),
        backgroundColor: ['green', 'yellow', 'red', 'blue', 'gray', 'black']
      }]
    };
    new Chart(ctx, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                var value = tooltipItem.raw;
                var percentage = ((value / total) * 100).toFixed(2);
                return `${tooltipItem.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Error generando la gráfica de pastel:", err);
  }
}

function getCheckboxId(category) {
  switch (category) {
    case 'Cempro': return 'chkCempro';
    case 'Importados': return 'chkImportados';
    case 'Tolteca': return 'chkTolteca';
    case 'Contrabando': return 'chkContrabando';
    case 'Inactivo': return 'chkInactivo';
    case 'Cerrado': return 'chkCerrado';
    default: return '';
  }
}

function handleCheckboxChange(checkbox, category) {
  markers[category].forEach(marker => {
    if (checkbox.checked) {
      if (!map.hasLayer(marker)) {
        marker.addTo(map);
      }
    } else {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    }
  });
}

function limpiar() {
  location.reload();
}

/************** Sección para Gráfica de Barras (Excel Pivot – Municipios) **************/
var barChartPivot; // Variable global para almacenar la gráfica de barras

function leerExcelPivot(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = new Uint8Array(reader.result);
      var workbook = XLSX.read(data, { type: 'array' });
      var sheetName = "Municipios"; // Usamos la hoja "Municipios"
      if (!workbook.Sheets[sheetName]) {
        alert("La hoja 'Municipios' no se encontró en el archivo.");
        return;
      }
      // Convertimos la hoja en un arreglo de objetos
      var rows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
      console.log("Filas leídas del Excel Pivot (Municipios):", rows);

      var labels = [];   // Etiqueta para cada barra: Municipio (porcentaje)
      var values = [];   // Valor numérico (porcentaje * 10)
      var colors = [];   // Se asigna azul a todos (ya que solo trabajamos con Municipios)
      rows.forEach(function (row) {
        // Omitir la cabecera (se supone que la cabecera tiene "__EMPTY" igual a "Ejecutivo" o "Municipio")
        if (row["__EMPTY"] === "Ejecutivo" || row["__EMPTY"] === "Municipio") {
          return;
        }
        var municipio = row["__EMPTY"].toString().trim();
        // Se asume que el porcentaje está en la columna "__EMPTY_14"
        var percStr = row["__EMPTY_14"].toString().replace("%", "").trim();
        percStr = percStr.replace(",", "."); // Reemplazamos la coma por punto
        var perc = parseFloat(percStr);
        if (isNaN(perc)) {
          perc = 0;
        }
        // Multiplicamos por 10 para que la gráfica se ubique en el rango 0–10
        var percValue = perc * 100;
        console.log("Municipio:", municipio, "Porcentaje escalado (x10):", percValue);
        var label = municipio + " (" + percValue.toFixed(2) + "%)";
        labels.push(label);
        values.push(percValue);
        colors.push("blue");
      });
      console.log("Etiquetas:", labels);
      console.log("Valores:", values);
      console.log("Colores:", colors);
      generarBarChartPivot(labels, values, colors);
    } catch (err) {
      console.error("Error leyendo el archivo Excel Pivot (Municipios):", err);
    }
  };
  reader.readAsArrayBuffer(input.files[0]);
}

function generarBarChartPivot(labels, values, colors) {
  try {
    var ctx = document.getElementById('barChartPivot').getContext('2d');
    if (barChartPivot) {
      barChartPivot.destroy();
    }
    barChartPivot = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Porcentaje (%)',
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(function () {
            return "rgba(54, 162, 235, 1)";
          }),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            title: { display: true, text: 'Porcentaje (%)' }
          },
          x: {
            title: { display: true, text: 'Municipios y %' }
          }
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Ventas por Municipio' }
        }
      }
    });
  } catch (err) {
    console.error("Error generando la gráfica de barras pivot (Municipios):", err);
  }
}

function limpiarPivot() {
  if (barChartPivot) {
    barChartPivot.destroy();
    barChartPivot = null;
  }
  document.getElementById('input-excel-pivot').value = "";
}
