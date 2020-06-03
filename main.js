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

    //designo l' array contenente i valori dell "URL" ovvero delle ricerche possibili
    var tipo_ricerca = ["movie", "tv"];

    //creo degli array per tipo nella quale successivamente inserisco la lista dei generi restituito dall' API
    var generi_film_api = [];
    var generi_serie_api = [];
    //effettuo la chiamata ajax per ottenere la lista generi dei film
    chiamata_ajax_genere(tipo_ricerca[0]);
    //effettuo la chiamata ajax per ottenere la lista generi delle serie tv
    chiamata_ajax_genere(tipo_ricerca[1]);

    // al click sul button effettuo la ricerca
    $("#search-button").click(ricerca);

    //al premere del pulsante invio, effettuo la ricerca
    $("#header-right input").keypress(function() {
        if (event.which == 13) {
            ricerca();
            //disattivo il focus sull'input una volta effettuata la ricerca
            $("#header-right input").blur();
        }
    })

//*****************FUNZIONI*******************//
//*******************************************//

    function chiamata_ajax_genere(tipo) {
        var url = "https://api.themoviedb.org/3/genre/"+ tipo +"/list";
        $.ajax({
            "url": url,
            "method": "GET",
            "data": {
                "api_key": "0d50f7bd14a0021b20cb277c8174b873",
                "language":"it",
            },
            "success": function(data) {
                crea_lista_generi(tipo,data.genres);
            },
            "error": function() {
                alert("Si è verificato un errore");
            }
        })
    }

    function crea_lista_generi (tipo,arrayApi) {
        //verifico il tipo di ricerca cosi da tenere distinte le due liste di generi
        if (tipo == tipo_ricerca[0]) {
            //se il tipo è un film aggiungo i generi nell'array  FILM
            generi_film_api.push(arrayApi);
        } else {
            //altrimenti nell'array SERIE TV
            generi_serie_api.push(arrayApi);
        }
    }

    function ricerca() {
        //designo la variabile del valore dell'input
        var input_ricerca = $("#header-right input").val().trim();
        //se il valore dell'input è diverso da stringa vuota effettuo la ricerca
        if (input_ricerca.length > 1) {
            //resetto l'input e svuoto la pagina
            reset();
            //url base
            var url = "https://api.themoviedb.org/3/search/";

            //effettuo la chiamata ajax per i film
            chiamata_ajax_card(url,input_ricerca,tipo_ricerca[0]);
            //effettuo la chiamata ajax per le serie tv
            chiamata_ajax_card(url,input_ricerca,tipo_ricerca[1]);
        }
    }

    function reset() {
        //svuoto il valore dell'input
        $("#header-right input").val("");
        //rimuovo il valore del h2
        $("#film-tv-container .titolo-ricerca").remove();
        //rimuovo le card visualizzate in pagina
        $("#film-tv-container .flip-card").remove();
    }

    function chiamata_ajax_card(url,valore_input,tipo) {
        //variabile che compone l'url
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
                //setto il messaggio di ricerca
                messaggio_ricerca_set(data.results.length, valore_input);
                //setto il titolo per genere alla chiamata ajax
                titolo_ricerca_set(data.results.length,tipo);
                //gestisco i dati della chiamata ajax
                gestione_dati(data,tipo,url);
            },
            "error": function() {
                alert("Si è verificato un errore");
            }
        })
    }

    function gestione_dati(data,tipo,url) {
        //seleziono l'array "results" dato dall'API
        var risultati = data.results;
        //creo un ciclo for per scorrere i titoli all'interno dell'array "results"
        for (var i = 0; i < risultati.length; i++) {
            //seleziono il titolo corrente
            var elemento_corrente = risultati[i];
            //aggiungo il titolo corrente all'HTML
            agg_card(elemento_corrente,tipo);
        }
    }

    function agg_card(elemento_corrente,tipo) {
        //creo l'oggetto per popolare il template
        var context = {
            "img-album" : img(elemento_corrente.poster_path),
            "titolo" : no_title_repeat(elemento_corrente,tipo),
            "titolo_org" : title_org(elemento_corrente,tipo),
            "lingua" : flag(elemento_corrente.original_language),
            "voto" : star(voto_transform(elemento_corrente.vote_average)),
            "overview" : overview(elemento_corrente.overview),
            "id" : elemento_corrente.id,
        }
        //inserisco le proprietà dell'oggetto nella funzione di Handlebars
        var html_finale = template_function(context);
        //inserisco i valori in html
        $("#film-tv-container").append(html_finale);

        //evito di inserire il titolo vuoto attraverso una funzione apposita
        no_li_empty(elemento_corrente.id,"title");
        //faccio lo stesso per l overview
        no_li_empty(elemento_corrente.id, "overview");
        //effettuo la chiamata ajax per ottenere il cast
        chiamata_ajax_cast(elemento_corrente.id,tipo);
        //aggiungo il genere alla card
        gestisci_genere_card(elemento_corrente.genre_ids,tipo,elemento_corrente.id);
    }

    function chiamata_ajax_cast(id,tipo) {
        $.ajax({
            "url":"https://api.themoviedb.org/3/" + tipo + "/" + id + "/credits",
            "method": "GET",
            "data": {
                "api_key": "0d50f7bd14a0021b20cb277c8174b873",
            },
            "success": function(data) {
                gestisci_cast(data, id);
            },
            "error": function() {
                alert("Si è verificato un errore");
            }
        })
    }

    function gestisci_cast(data, id) {
        //creo una variabile dell'array restituito dall API
        var array_cast_api = data.cast;
        //se l'array restituito dall' API non è vuoto recupero il cast
        if (array_cast_api.length != 0) {
            //definisco la condizione del ciclo
            var condizione = array_cast_api.length;
            if (array_cast_api.length > 5) {
                condizione = 5;
            }
            //creo l'array dove salvare gli attori
            var cast = [];
            //avvio il ciclo for secondo il valore della condizione
            for (var i = 0; i < condizione; i++) {
                cast.push(array_cast_api[i].name);
            }
            //trasformo l'array in una stringa
            var stringa_cast = cast.join(" - ");
            //aggiungo il cast alla card
            aggiungi_cast(id, stringa_cast);
        } else {
            //altrimenti nascondo l'elemento vuoto in pagina
            no_li_empty(id, "cast");
        }
    }

    function aggiungi_cast(id,testo) {
        //inserisco in card il cast
        $(".flip-card[data-id=" + id + "]").find(".cast span").text(testo);
    }

    function gestisci_genere_card (id_generi_correnti,tipo,id) {
        //creo una variabile che identifica il tipo di array da ciclare
        var lista_generale_generi;
        if (tipo == tipo_ricerca[0]) {
            lista_generale_generi = generi_film_api[0]
        } else {
            lista_generale_generi = generi_serie_api[0]
        }
        //se l'array restituito dall API resituisce almeno un ID-GENERE lo esamino
        if (id_generi_correnti.length != 0) {
            //creo l'array dove inserire i generi di ogni titolo convertiti da ID a genere testuale
            var generi_correnti_convertiti = [];
            //avvio un ciclo for per scorrere i generi del titolo corrente
            for (var i = 0; i < id_generi_correnti.length; i++) {
                //creo una variabile sentinella per fermare il ciclo seguente quando ottiene un riscontro
                var sentinella = false
                //effettuo un altro ciclo for per cercare un riscontro tra l'id del genere corrente e gli id della lista di tutti i generi
                for (var j = 0; j < lista_generale_generi.length && sentinella == false; j++) {
                    //se trovo un riscontro tra id del genere corrente rispetto alla lista generale inserisco il corrispettivo testo-genere nell'array "generi correnti convertiti"
                    if (id_generi_correnti[i] == lista_generale_generi[j].id) {
                        generi_correnti_convertiti.push(lista_generale_generi[j].name)
                        //pongo la variabile sentinella pari a true così da non far proseguire il ciclo una volta ottenuto il riscontro
                        sentinella = true;
                    }
                }
            }
            //trasformo l'array in una stringa
            var stringa_generi_correnti = generi_correnti_convertiti.join(" - ");
            //aggiungo il genere alla card
            aggiungi_genere(id,stringa_generi_correnti);
        } else {
            //altrimenti assegno display none ai titoli se l'api non restituisce anche un genere tra le info del titolo
            no_li_empty(id, "genres");
        }
    }

    function aggiungi_genere(id,testo) {
        //inserisco il genere nella card
        $(".flip-card[data-id=" + id + "]").find(".genres span").text(testo);
    }

    function voto_transform(voto) {
        //trasformo il valore "voto" dell oggetto in un numero intero da 1 a 5(arrotondo per eccesso)
        var voto_transform = Math.ceil(voto / 2);
        return voto_transform
    }

    function star(voto_transform) {
        //desgigno la variabile stella
        var voto_finale = "";
        //se la variabile è diversa da 0, stampo le stelle
        if (voto_transform != 0) {
            //stampo le stelle attraverso un ciclo for per determinare il numero di queste
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

    function flag(lingua) {
        //definisco un array di bandiere disponibili in memoria locale
        var bandiere_in_locale = ["de", "en", "es", "fr", "fr", "it"];
        //controllo se alla lingua corrisponde una bandiera salvata in locale
        if (bandiere_in_locale.includes(lingua)) {
            //costruisco la funzione handlebars con l'oggetto
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
        //se sto cercando un film o una serie TV ed il titolo è diverso dal titolo originale entro nella condizione e lo stampo
        if (tipo == tipo_ricerca[0] && elemento_corrente.title != elemento_corrente.original_title) {
            titolo = elemento_corrente.title;
        } else if (tipo == tipo_ricerca[1] && elemento_corrente.name != elemento_corrente.original_name) {
            titolo = elemento_corrente.name;
        }
        return titolo
    }

    function messaggio_ricerca_set(numero_risultati,input) {
        //aggiungo classe active all'elemento che stampa il messaggio della ricerca e gli inserisco il valore dell'input
        if (numero_risultati != 0) {
            $(".messaggio_ricerca").addClass("active").text("Risultati ricerca per: '" + input + "'");
        } else {
            $(".messaggio_ricerca").addClass("active").text("Ci dispiace, ma non abbiamo riscontri per il titolo: '" + input + "'");
        }
    }

    function titolo_ricerca_set(numero_risultati,tipo) {
        //setto il titolo per genere che indica anche il numero di risulati ottenuti e visualizzati
        if (numero_risultati > 0) {
            //aggiungo il titolo con il tipo di ricerca effettuata
            if (tipo == tipo_ricerca[0]) {
                var titolo_ricerca = "Film";
            } else {
                var titolo_ricerca = "Serie TV";
            }
            //creo l'oggetto essenziale per handlebars
            var placeholder = {
                "titolo_ricerca" : titolo_ricerca,
                "quantità_risultati" : numero_risultati
            }

            //preparo la funzione handlebars
            var html_finale = template_general_title_function(placeholder);

            //stampo in pagina quanto formulato
            $("#film-tv-container").append(html_finale);
        }
    }

    function title_org(elemento_corrente,tipo) {
        //setto il titolo della card da visualizzare dato che le due chiamate ajax hanno una chiave diversa per il titolo originale
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
        var img_finale = "img/img_null.png";
        //se il valore dell'api non è nullo stampo l'immagine dell'api
        if (poster_path != null) {
            //costruisco l'url
            var url_iniziale = "https://image.tmdb.org/t/p/";
            var img_width = "w342";
            var url_coda = poster_path;
            var img_finale = url_iniziale + img_width + url_coda;
        }
        return img_finale
    }

    function overview(overview) {
        //designo una variabile con la trama vuota nel caso in cui non venga data dall'api
        var trama_fin = "";
        if (overview.length != 0) {
            var caratteri_max = 150;
            //se i caratteri della descrizione sono maggiore di quelli della sottostringa aggiungo i puntini
            if (overview.length > caratteri_max) {
                trama_fin =  overview.substr(0,caratteri_max) + "...";
            } else {
                //altrimenti la stampo cosi com'è
                trama_fin = overview;
            }
        }
        return trama_fin
    }

    function no_li_empty(id, tipo_info) {
        //se il valore dell'overview ha testo, aggiungo a questa display none
        if ($(".flip-card[data-id='" + id + "'] ." + tipo_info + " span").text() == "") {
            $(".flip-card[data-id='" + id + "'] ." + tipo_info).addClass("d_none");
        }
    }
})
