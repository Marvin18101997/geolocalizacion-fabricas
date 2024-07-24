var map;
var cementoCounts = {
    'Cempro': 0,
    'Importados': 0,
    'Tolteca': 0,
    'Contrabando': 0,
    'Inactivo': 0
};

document.addEventListener('DOMContentLoaded', function() {
    map = L.map('map').setView([15.783471, -90.230759], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
});

function leerExcel(event) {
    var input = event.target;
    var reader = new FileReader();

    reader.onload = function() {
        var data = new Uint8Array(reader.result);
        var workbook = XLSX.read(data, {type: 'array'});

        workbook.SheetNames.forEach(function(sheetName) {
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            XL_row_object.forEach(function(row){
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
    var iconUrl;

    switch(cemento) {
        case 'Cempro':
            iconUrl = 'Img/Cempro.png';
            break;
        case 'Importados':
            iconUrl = 'Img/Importados.png';
            break;
        case 'Tolteca':
            iconUrl = 'Img/Tolteca.png';
            break;
        case 'Contrabando':
            iconUrl = 'Img/contrabando.png';
            break;
        case 'Inactivo':
            iconUrl = 'Img/inactivo.png';
            break;
        default:
            iconUrl = 'Img/contrabando.png'; // Default icon
    }

    var markerIcon = L.icon({
        iconUrl: iconUrl,
        iconSize: [25, 41], // size of the icon
        iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
        popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
        shadowSize: [41, 41] // size of the shadow
    });

    // Construir el contenido del Popup
    var popupContent = '<b>Razon Social</b> ' + row['R.S.'] + '<br>' +
                       '<b>¿Es ConstruBlock?</b> ' + row['¿Es constru?'] + '<br>' +
                       '<b>Cliente</b> ' + row['Cli'] + '<br>' +
                       '<b>Ejecutivo</b> ' + row['Eje'] + '<br>' +
                       '<b>Teléfono:</b> ' + row['Telefono'] + '<br>' +
                       '<b>Cemento:</b> ' + cemento + '<br>';

    try {
        L.marker([lat, lng], { icon: markerIcon }).addTo(map)
        .bindPopup(popupContent);
    } catch (error) {
        console.log(error);
    }
}

function contarCemento(cemento) {
    if (cementoCounts[cemento] !== undefined) {
        cementoCounts[cemento]++;
    }
}

function generarGrafica() {
    var ctx = document.getElementById('cementoChart').getContext('2d');
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
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function limpiar(){
    location.reload();
}