$(document).ready(function() {

    //recupero la struttura html del template
    var template_html = $("#film-tv-template").html();
    //preparo la funzione al fine di utilizzare il template con handlebars
    var template_function = Handlebars.compile(template_html);

    //recupero la struttura html per inserire la bandiera del template
    var template_bandiera = $("#bandiera-template").html();
    //preparo la funzione al fine di utilizzare il template con handlebars
    var template_bandiera_function = Handlebars.compile(template_bandiera);

    //recupero la struttura html per inserire il titolo per genere del template
    var template_general_title = $("#title-film-tv-template").html();
    //preparo la funzione al fine di utilizzare il template con handlebars
    var template_general_title_function = Handlebars.compile(template_general_title);
    // al click sul button effettuo la ricerca
    $("#search-button").click(ricerca);

    //al premere del pulsante invio effettuo la ricerca
    $("#header-right input").keypress(function() {
        if (event.which == 13) {
            ricerca();
            //disattivo il focus sull'input una volta effettuata la ricerca
            $("#header-right input").blur();
        }
    })

//*****************FUNZIONI*******************//
//*******************************************//
    function ricerca() {
        //designo la variabile del valore dell'input
        var input_ricerca = $("#header-right input").val().trim();
        //se il valore dell'input è diverso da stringa vuota effettuo la ricerca
        if (input_ricerca.length > 1) {
            //resetto l'input e svuoto la pagina
            reset();
            //designo l' array contenente i valori dell "URL" ovvero delle ricerche possibili
            tipo_ricerca = ["movie", "tv"];
            //url base
            var url = "https://api.themoviedb.org/3/search/";
            //effettuo la chiamata ajax per i film
            chiamata_ajax(url,input_ricerca,tipo_ricerca[0]);
            //effettuo la chiamata ajax per le serie tv
            chiamata_ajax(url,input_ricerca,tipo_ricerca[1]);
        }
    }

    function reset() {
        //svuoto il valore dell'input
        $("#header-right input").val("");
        //rimuovo il valore del h2
        $("#film-tv-container .titolo-ricerca").remove();
        //rimuovo i film visualizzati in pagina
        $("#film-tv-container .flip-card").remove();
    }

    function chiamata_ajax(url,valore_input,tipo) {
        //variabile per l'url serie
        var url = url + tipo;
        $.ajax({
            "url": url,
            "method": "GET",
            "data": {
                "api_key": "0d50f7bd14a0021b20cb277c8174b873",
                "language":"it",
                "query": valore_input
            },
            "success": function(data) {
                //setto i titoli del container alla chiamata ajax
                titles_set(tipo,data,valore_input);
                //gestisco i dati con la seguente funzione
                gestione_dati(data,tipo);
            },
            "error": function() {
                alert("Si è verificato un errore");
            }
        })
    }

    function gestione_dati(data,tipo) {
        //seleziono l'array "results" dato dall'API
        var risultati = data.results;
        //creo un ciclo for per scorrere i film all'interno dell'array "results"
        for (var i = 0; i < data.results.length; i++) {
            //seleziono il film corrente
            var elemento_corrente = risultati[i];
            //aggiungo i film risultanti dalla ricerca in pagina
            aggiungi_film(elemento_corrente,tipo);
        }
    }

    function aggiungi_film(elemento_corrente,tipo) {
        //creo l'oggetto per popolare il template
        var context = {
            "img-album" : img(elemento_corrente.poster_path),
            "titolo" : no_title_repeat(elemento_corrente,tipo),
            "titolo_org" : title_org(elemento_corrente, tipo),
            "lingua" : flag(elemento_corrente.original_language),
            "voto" : star(voto_transform(elemento_corrente.vote_average)),
            "overview" : overview(elemento_corrente.overview)
        }
        //inserisco le proprietà dell'oggetto nella funzione di Handlebars
        var html_finale = template_function(context);
        //inserisco i valori in html
        $("#film-tv-container").append(html_finale);

        //evito di inserire in pagina elementi con testo vuoto
        noempty();
    }

    function star(voto_transform) {
        //desgigno la variabile stella
        var voto_finale = "";
        //se la variabile è vuota stampo le bandiere
        if (voto_transform != 0) {
            //stampo le bandiere
            for (var i = 0; i < 5; i++) {
                //se la i = al numero compreso nel voto, stampo la stella piena
                if (i < voto_transform) {
                    voto_finale += "<i class='fas fa-star'></i>";
                } else {
                    //altrimenti una stella vuota
                    voto_finale += "<i class='far fa-star'></i>";
                }
            }
        } else {
            voto_finale = "<span>0</span>";
        }
        return voto_finale
    }

    function voto_transform(voto) {
        //trasformo il valore "voto" dell oggetto in un numero intero da 1 a 5(arrotondo per eccesso)
        var voto_transform = Math.ceil(voto / 2);
        return voto_transform
    }

    function flag(lingua) {
        //definisco un array di bandiere disponibili in locale
        var bandiere_in_datab = ["de", "en", "es", "fr", "fr", "it"];
        //controllo se alla lingua corrisponde una bandiera salvata in locale
        if (bandiere_in_datab.includes(lingua)) {
            //costruisco la funzione handlebars con l'oggettoe
            var bandiera = {"bandiera" : lingua};
            var html_finale = template_bandiera_function(bandiera);
            //non c'è bisogno di fare un else in quanto se si entra nella condizione il return chiude la funzione
            return html_finale
        }
        return lingua
    }

    function no_title_repeat(elemento_corrente,tipo) {
        //creo una variabile titolo vuota
        var titolo = "";
        //se sto cercando un film o una serie TV ed il titolo è diverso dal titolo originale entro nella condizione
        if (tipo == tipo_ricerca[0] && elemento_corrente.title != elemento_corrente.original_title) {
            titolo = elemento_corrente.title;
        } else if (tipo == tipo_ricerca[1] && elemento_corrente.name != elemento_corrente.original_name) {
            titolo = elemento_corrente.name;
        }
        return titolo
    }

    function titles_set(tipo,data,input) {
        //aggiungo classe active all'elemento che stampa il valore della ricerca e gli inserisco il valore dell'input
        if (data.results.length != 0) {
            $(".messaggio_ricerca").addClass("active").text("Risultati ricerca per: '" + input + "'");
        } else {
            $(".messaggio_ricerca").addClass("active").text("Ci dispiace, ma non abbiamo riscontri per il titolo: '" + input + "'");
        }

        //setto il titolo che indica il genere delle card
        if (data.results.length > 0) {
            //aggiungo il titolo con il tipo di ricerca effettuata
            if (tipo == tipo_ricerca[0]) {
                var titolo_ricerca = "Film";
            } else {
                var titolo_ricerca = "Serie TV";
            }
            var placeholder = {
                "titolo_ricerca" : titolo_ricerca,
                "quantità_risultati" : data.results.length
            }

            //preparo la funzione handlebars
            var html_finale = template_general_title_function(placeholder);

            //stampo in pagina quanto formulato
            $("#film-tv-container").append(html_finale);
        }
    }

    function title_org(elemento_corrente, tipo) {
        //setto il titolo da visualizzare dato che le due chiamate ajax hanno una chiave diversa per il titolo originale
        var titolo_org;
        if (tipo == tipo_ricerca[0]) {
            titolo_org = elemento_corrente.original_title;
        } else {
            titolo_org = elemento_corrente.original_name;
        }
        return titolo_org;
    }

    function img(poster_path) {
        //designo una variabile con l'immagine in caso di valore nullo
        var img_finale = "img/img_null.png"
        //se il valore dell' api non è nullo stampo l'immagine dell'api
        if (poster_path != null) {
            //costruisco l'utl
            var url_iniziale = "https://image.tmdb.org/t/p/";
            var img_width = "w342";
            var url_coda = poster_path;
            var img_finale = url_iniziale + img_width + url_coda;
        }
        return img_finale
    }

    function overview(overview) {
        //designo una variabile con desceizione vuota nel caso in cui non venga data dall'api
        var descrizione_fin = "";
        if (overview.length != 0) {
            //se la descrizione è maggiore della sottostringa aggiungo i puntini
            if (overview.length > 100) {
                descrizione_fin =  overview.substr(0,100) + "...";
            } else {
                //altrimenti la stampo cosi com'è
                descrizione_fin = overview;
            }
        }
        return descrizione_fin;
    }

    function noempty () {
        //verifico se il valore dell'overview ha testo
        if ($(".flip-card:last-of-type .overview span").text() == "") {
            $(".flip-card:last-of-type .overview").addClass("d_none");
        }

        //verifico se il valore del titlo ha testo
        if ($(".flip-card:last-of-type .title span").text() == "") {
            $(".flip-card:last-of-type .title").addClass("d_none");
        }
    }
})
