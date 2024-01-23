var map;

document.addEventListener('DOMContentLoaded', function() {
    map = L.map('map').setView([15.783471, -90.230759], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
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
            });
        });
    };

    reader.readAsArrayBuffer(input.files[0]);
}

function agregarMarcadorAlMapa(row) {
    var lat = row['Latitud'];
    var lng = row['Longitud'];

    // Construir el contenido del Popup
    var popupContent = '<b>Ruta:</b> ' + row['Ruta Nombre Corto'] + '<br>' +
                       '<b>Razón Social:</b> ' + row['Razon Social'] + '<br>' +
                       '<b>Nombre Dueño:</b> ' + row['Nombre dueño'] + '<br>' +
                       '<b>Region</b> ' + row['Region'] + '<br>' +
                       '<b>Teléfono:</b> ' + row['Teléfono'] + '<br>' +
                       '<b>Departamento:</b> ' + row['Departamento'] + '<br>' +
                       '<b>Municipio:</b> ' + row['Municipio'] 
                       
    // Añadir más campos aquí si tu Excel tiene más columnas
    try {
        L.marker([lat, lng]).addTo(map)
        .bindPopup(popupContent);
    } catch (error) {
        console.log(error);
    }
    
}

