function inviaRichiesta(method, url, parameters = "", async=true, fun=function(){}) {
    let contentType;
    // in caso di chiamate get passiamo i parametri in urlencoded
    if (method.toUpperCase() == "GET")
        contentType = "application/x-www-form-urlencoded; charset=UTF-8";
    else {
        contentType = "application/json;charset=utf-8";
        parameters = JSON.stringify(parameters); //serializzo i parametri
    }

    return $.ajax({
        "url": url, //default: currentPage
        "type": method,
        "data": parameters,
        "contentType": contentType,
        "async":async,
        "dataType": "json", //formato in cui $.ajax restituisce i dati al chiamante
        "timeout": 500000,
        "success":fun
    });
}

function errore(jqXHR, testStatus, strError) {
    if (jqXHR.status == 0)
        console.log("Connection refused or Server timeout");
    else if (jqXHR.status == 200)
        console.log("Errore Formattazione dati\n" + strError);
    else
        console.log("Server Error: " + jqXHR.status + " - " + jqXHR.responseText);
}
