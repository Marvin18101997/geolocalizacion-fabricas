var map;
var cementoCounts = {
    'Cempro': 0,
    'Importados': 0,
    'Tolteca': 0,
    'Contrabando': 0,
    'Inactivo': 0
};
var markers = {
    'Cempro': [],
    'Importados': [],
    'Tolteca': [],
    'Contrabando': [],
    'Inactivo': []
};

document.addEventListener('DOMContentLoaded', function () {
    map = L.map('map').setView([15.783471, -90.230759], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
});

function leerExcel(event) {
    var input = event.target;
    var reader = new FileReader();

    reader.onload = function () {
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
    };

    reader.readAsArrayBuffer(input.files[0]);
}

function agregarMarcadorAlMapa(row) {
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
        default:
            markerColor = 'black'; // Default color in case no match
    }

    var markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${markerColor}; width:20px; height:20px; border-radius:50%;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    // Construir el contenido del Popup
    var popupContent = '<b>Razon Social</b> ' + row['R.S.'] + '<br>' +
        '<b>¿Es ConstruBlock?</b> ' + row['¿Es constru?'] + '<br>' +
        '<b>Cliente</b> ' + row['Cli'] + '<br>' +
        '<b>Ejecutivo</b> ' + row['Eje'] + '<br>' +
        '<b>Teléfono:</b> ' + row['Telefono'] + '<br>' +
        '<b>Cemento:</b> ' + cemento + '<br>';

    try {
        var marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map)
            .bindPopup(popupContent);

        // Añadir el marcador al grupo correspondiente
        markers[cemento].push(marker);
    } catch (error) {
        console.log('Error al leer la propiedad');

    }

}

function contarCemento(cemento) {
    if (cementoCounts[cemento] !== undefined) {
        cementoCounts[cemento]++;
    }
}

function generarGrafica() {
    var ctx = document.getElementById('cementoChart').getContext('2d');
    var total = Object.values(cementoCounts).reduce((sum, value) => sum + value, 0);

    var data = {
        labels: Object.keys(cementoCounts),
        datasets: [{
            data: Object.values(cementoCounts),
            backgroundColor: ['green', 'yellow', 'red', 'blue', 'gray']
        }]
    };

    new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
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
}

function toggleMarkers(cemento) {
    if (markers[cemento]) {
        markers[cemento].forEach(marker => {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            } else {
                map.addLayer(marker);
            }
        });
    }
}

function limpiar() {
    location.reload();
}
