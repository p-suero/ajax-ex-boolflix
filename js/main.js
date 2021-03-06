$(document).ready(function() {

    //**********VARIABILI GLOBALI*************//

    //template per la card film/serie
    var template_html = $("#movie-tv-template").html();
    var template_function = Handlebars.compile(template_html);

    //template per le bandierine nella card
    var template_bandiera = $("#bandiera-template").html();
    var template_bandiera_function = Handlebars.compile(template_bandiera);

    //template per il container dei film/serie
    var template_general_title = $("#container-movie-tv-template").html();
    var template_general_title_function = Handlebars.compile(template_general_title);

    //Url base
    var url_base = "https://api.themoviedb.org/3/";

    //designo l'array contenente i tipo di ricerca eseguibili(vengono iserite nell'url di ajax)
    var tipo_ricerca = ["movie", "tv"];

    //creo delle variabili generi per tipo nella quale successivamente inserisco la lista dei generi restituito dall' API
    var generi_film_api;
    var generi_serie_api;

    //**********FINE VARIABILI GLOBALI***********//


    //effettuo la chiamata ajax per ottenere la lista generi dei film
    chiamata_ajax_genere(tipo_ricerca[0]);
    //effettuo la chiamata ajax per ottenere la lista generi delle serie tv
    chiamata_ajax_genere(tipo_ricerca[1]);

    // al click sul button ricerco i titoli
    $("#search-button").click(ricerca);

    //lo stesso se premo il tasto INVIO della tastiera
    $("#header-right input").keypress(function() {
        if (event.which == 13) {
            ricerca();
            //disattivo il focus sull'input una volta effettuata la ricerca
            $("#header-right input").blur();
        }
    })

//*****************FUNZIONI*******************//
//*******************************************//

    //funzione che avvia la ricerca dei titoli
    function ricerca() {
        //designo la variabile del valore dell'input
        var input_ricerca = $("#header-right input").val().trim();
        //se il valore dell'input è maggiore di un carattere effettuo la ricerca
        if (input_ricerca.length > 1) {
            //resetto l'input e svuoto la pagina
            reset();
            //effettuo la chiamata ajax per i film
            chiamata_ajax_card(input_ricerca,tipo_ricerca[0]);
            //effettuo la chiamata ajax per le serie tv
            chiamata_ajax_card(input_ricerca,tipo_ricerca[1]);
        }
    }

    //funzione che resetta la pagina ad una nuova ricerca
    function reset() {
        //svuoto il valore dell'input
        $("#header-right input").val("");
        //svuoto il contenitore del titolo e delle card
        $("#movie-tv-container *").remove();
        //svuoto la select
        $("select.genere").empty();
        //aggiungo il display none alla select
        $("select.genere").removeClass("active");
    }

    //funzione che effettua la chiamata ajax dei film e serieTV
    function chiamata_ajax_card(valore_input,tipo) {
        $.ajax({
            "url": url_base + "search/" + tipo,
            "method": "GET",
            "data": {
                "api_key": "0d50f7bd14a0021b20cb277c8174b873",
                "language":"it",
                "query": valore_input
            },
            "success": function(data) {
                //setto il contenitore delle card ed inserisco un titolo per tipo
                wrapperCard_e_h2_set(data.results.length,tipo);
                //gestisco i dati della chiamata ajax
                gestione_dati(data,tipo);
                //setto il un messaggio che visualizza le info del risultato della ricerca
                set_info_ricerca(valore_input,tipo);
            },
            "error": function() {
                alert("Si è verificato un errore");
            }
        })
    }

    //funzione che setta il contenitore delle card ed inserisce un titolo per tipo
    function wrapperCard_e_h2_set(numero_risultati,tipo) {
        //se il numero dei risultati restituiti dall AJAX è maggiore di 0 entro nella condizione
        if (numero_risultati > 0) {
            //aggiungo il container ed titolo secondo il tipo di ricerca effettuata
            if (tipo == tipo_ricerca[0]) {
                var titolo_ricerca = "Film";
            } else {
                var titolo_ricerca = "Serie TV";
            }
            //creo l'oggetto essenziale per handlebars
            var placeholder = {
                "titolo_ricerca" : titolo_ricerca,
                "numero_risultati": numero_risultati,
                "tipo": tipo
            };
            //preparo la funzione handlebars
            var html_finale = template_general_title_function(placeholder);
            //stampo in pagina quanto formulato
            $("#movie-tv-container").append(html_finale);
        }
    }

    //funzione che gestisce i dati della chiamate dei film e serieTV
    function gestione_dati(data,tipo) {
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

    //funzione che aggiunge in pagina la card con le specifiche del film/serieTV
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
        };
        //inserisco le proprietà dell'oggetto nella funzione di Handlebars
        var html_finale = template_function(context);
        //inserisco i valori in html
        $("div." + tipo).append(html_finale);

        //evito di inserire il titolo vuoto utilizzando una funzione apposita
        no_li_empty(elemento_corrente.id,"title");
        //faccio lo stesso per l overview
        no_li_empty(elemento_corrente.id, "overview");
        //effettuo la chiamata ajax per ottenere il cast
        chiamata_ajax_cast(elemento_corrente.id,tipo);
        //aggiungo il genere alla card
        gestisci_genere_card(elemento_corrente.genre_ids,tipo,elemento_corrente.id);
    }

    //funzione che modella il range dei voti
    function voto_transform(voto) {
        //trasformo il valore "voto" dell oggetto in un numero intero da 1 a 5(arrotondo per eccesso)
        var voto_transform = Math.ceil(voto / 2);
        return voto_transform;
    }

    //funzione che sostituisce il voto numerale con una stella
    function star(voto) {
        //desgigno la variabile stella
        var voto_finale = "";
        //se la variabile è diversa da 0, stampo le stelle
        if (voto != 0) {
            //stampo le stelle attraverso un ciclo for per determinare il numero di queste
            for (var i = 0; i < 5; i++) {
                //se la i = al numero compreso nel voto, stampo la stella piena
                if (i < voto) {
                    voto_finale += "<i class='fas fa-star'></i>";
                } else {
                    //altrimenti una stella vuota
                    voto_finale += "<i class='far fa-star'></i>";
                }
            }
        } else {
            //altrimenti il voto sarà pari a 0
            voto_finale = 0;
        }
        return voto_finale;
    }

    //funzione che sostituisce la lingua con una bandiera(ove possibile)
    function flag(lingua) {
        //definisco un array di bandiere disponibili in memoria locale
        var bandiere_in_locale = ["de", "en", "es", "fr", "fr", "it"];
        //controllo se alla lingua corrisponde una bandiera salvata in locale
        if (bandiere_in_locale.includes(lingua)) {
            //costruisco la funzione handlebars con l'oggetto
            var bandiera = {"bandiera" : lingua};
            var html_finale = template_bandiera_function(bandiera);
            //non c'è bisogno di fare un else in quanto se si entra nella condizione il return chiude la funzione
            return html_finale;
        }
        return lingua;
    }

    //funzione che evita di ripetere il titolo originale e titolo, se uguali
    function no_title_repeat(elemento_corrente,tipo) {
        //creo una variabile titolo vuota
        var titolo = "";
        //se sto cercando un film o una serie TV ed il titolo è diverso dal titolo originale entro nella condizione e lo stampo
        if (tipo == tipo_ricerca[0] && elemento_corrente.title != elemento_corrente.original_title) {
            titolo = elemento_corrente.title;
        } else if (tipo == tipo_ricerca[1] && elemento_corrente.name != elemento_corrente.original_name) {
            titolo = elemento_corrente.name;
        }
        return titolo;
    }

    //funzione per stabilire il titolo originale da stampare
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

    //funzione che setta l'url dell'immagine
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
        return img_finale;
    }

    //funzione che setta la trama
    function overview(overview) {
        //designo una variabile con la trama vuota nel caso in cui non venga data dall'api
        var trama_fin = "";
        if (overview.length != 0) {
            var caratteri_max = 70;
            //se i caratteri della descrizione sono maggiore di quelli della sottostringa aggiungo i puntini
            if (overview.length > caratteri_max) {
                trama_fin =  overview.substr(0,caratteri_max) + "...";
            } else {
                //altrimenti la stampo cosi com'è
                trama_fin = overview;
            }
        }
        return trama_fin;
    }

    //funzione che nasconde gli elementi vuoti
    function no_li_empty(id, tipo_info) {
        //se il valore dell'overview ha testo, aggiungo a questa display none
        if ($(".flip-card[data-id='" + id + "'] ." + tipo_info + " span").text() == "") {
            $(".flip-card[data-id='" + id + "'] ." + tipo_info).addClass("d_none");
        }
    }

    //funzione che setta i risultati della ricerca
    function set_info_ricerca(input,tipo) {
        //creo una variabile con il selettore del messaggio risultato trovato
        var result_ok = $(".risultato-ricerca .result-ok");
        //creo una variabile con il selettore del messaggio "no-results"
        var no_result = $(".risultato-ricerca .no-result");
        //creo una variabile con il selettore degli eventuali figli del container FILM/SERIETV
        var figli_container = $("#movie-tv-container").children();
        //visualizzo un messaggio se la ricerca da un riscontro
        if (figli_container.hasClass(tipo_ricerca[0]) || figli_container.hasClass(tipo_ricerca[1])) {
            //rimuovo la visibiltà al messaggio "nessun risultato"
            no_result.removeClass("active");
            //aggiungo il valore dell'input al messaggio
            result_ok.find("span").text(input);
            //l'aggiungo al messaggio di "ricerca con successo"
            result_ok.addClass("active");
        } else if (!figli_container.hasClass(tipo_ricerca[0]) && !figli_container.hasClass(tipo_ricerca[1])) {
            //rimuovo la visibiltà al messaggio di "ricerca ok"
            result_ok.removeClass("active");
            //aggiungo la specifica della ricerca effettuata al messaggio "non result"
            no_result.find("span").text(input);
            //l'aggiungo al messaggio di "nessun risultato"
            no_result.addClass("active");
        }
    }

    //funzione che effettua la chiamata ajax per ottenere il cast
    function chiamata_ajax_cast(id,tipo) {
        $.ajax({
            "url": url_base + tipo + "/" + id + "/credits",
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

    //funzione che gestisce i cast resituiti dall'API
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

    //funzione che aggiunge i cast alle card
    function aggiungi_cast(id,testo) {
        //inserisco in card il cast
        $(".flip-card[data-id=" + id + "]").find(".cast span").text(testo);
    }

    //funzione che effettua una chiamata ajax per recuperare il genere
    function chiamata_ajax_genere(tipo) {
        $.ajax({
            "url": url_base + "genre/" + tipo + "/list",
            "method": "GET",
            "data": {
                "api_key": "0d50f7bd14a0021b20cb277c8174b873",
                "language":"it",
            },
            "success": function(data) {
                //invoco la funzione per creare le liste dei generi
                crea_lista_generi(tipo,data.genres);
                //invoco la funzione che gestisce la selezione di tutti i generi dalla select
                select_all();
            },
            "error": function() {
                alert("Si è verificato un errore");
            }
        })
    }

    //funzione per popolare la lista generi
    function crea_lista_generi (tipo,arrayApi) {
        //verifico il tipo di ricerca cosi da tenere distinte le due liste di generi
        if (tipo == tipo_ricerca[0]) {
            //se il tipo è un film aggiungo i generi nell'array  FILM
            generi_film_api = arrayApi;
        } else {
            //altrimenti nell'array SERIE TV
            generi_serie_api = arrayApi;
        }
    }

    //funzione che traduce i generi correnti dei film/seritv da ID a testo
    function gestisci_genere_card (id_generi_correnti,tipo,id) {
        //creo una variabile che identifica il tipo di array da ciclare
        var lista_generale_generi;
        if (tipo == tipo_ricerca[0]) {
            lista_generale_generi = generi_film_api;
        } else {
            lista_generale_generi = generi_serie_api;
        }

        //creo l'array dove inserire i generi di ogni titolo convertiti da ID a genere testuale
        var generi_correnti_convertiti = [];
        //creo una variabile sentinella
        var sentinella;
        //avvio un ciclo for per scorrere i generi del titolo corrente
        for (var i = 0; i < id_generi_correnti.length; i++) {
            //questa variabile serve per fermare il ciclo seguente quando ottiene un riscontro
            sentinella = false;
            //effettuo un altro ciclo for per cercare un riscontro tra l'id del genere corrente e gli id della lista di tutti i generi
            for (var j = 0; j < lista_generale_generi.length && sentinella == false; j++) {
                //se trovo un riscontro tra id del genere corrente rispetto alla lista generale inserisco il corrispettivo testo-genere nell'array "generi correnti convertiti"
                if (id_generi_correnti[i] == lista_generale_generi[j].id) {
                    generi_correnti_convertiti.push(lista_generale_generi[j].name);
                    //pongo la variabile sentinella pari a true così da non far proseguire il ciclo una volta ottenuto il riscontro
                    sentinella = true;
                    //allo scorrere del ciclo popolo la select
                    popola_select(lista_generale_generi[j].name);
                }
            }
        }
        //setto l'option nel caso in cui dovesse essere selezionato il genere  film/serie corrente
        cambia_option(id,generi_correnti_convertiti);
        //se l'array dei generi correnti contiene almeno un genere effettuo le operazioni per inserirlo in pagina
        if (generi_correnti_convertiti.length > 0 ) {
            //trasformo l'array in una stringa
            var stringa_generi_correnti = generi_correnti_convertiti.join(" - ");
            //aggiungo il genere alla card
            aggiungi_genere(id,stringa_generi_correnti);
        } else {
            //altrimenti assegno display none ai titoli se l'api non restituisce anche un genere tra le info del titolo
            no_li_empty(id, "genres");
        }
    }

    //funzione che aggiunge i generi nelle card
    function aggiungi_genere(id,testo) {
        //inserisco il genere nella card
        $(".flip-card[data-id=" + id + "]").find(".genres span").text(testo);
    }

    function popola_select(genere_corrente) {
        //verifico se la select ha gia l'opzione "tutti i generi"
        if ($("select.genere option[value]").length == 0) {
            //inserisco l'option in pagina
            $("select.genere").append("<option value>Tutti i generi</option>");
        }
        //se l'opzione genere non esiste l'aggiungo
        if ($(".genere option[value='" + genere_corrente + "']").text() != genere_corrente) {
            //inserisco l'option con il genere corrente in pagina
            $("select.genere").append("<option value='" + genere_corrente + "'>" + genere_corrente + "</option>");
        }

        //una volta popolato la select, la mostro in pagina
        $("select.genere").addClass("active");
    }

    function select_all() {
        $("select.genere").change(function() {
            //se l'opzione è quella "seleziona tutti i generi" mostro tutti i titoli in pagina
            if ($(this).val() == "") {
                //seleziono tutti i titoli e li rendo visibili
                $(".flip-card").show();
                //aggiungo la visibilità al numero risultati del titolo della ricerca
                $(".titolo_ricerca span").show();
            }
        })
    }

    function cambia_option(id,generi_correnti) {
        //intercetto il cambio della select
        $("select.genere").change(function() {
            if (generi_correnti.includes($(this).val())) {
                //se il genere è compreso nel valore della option selezionata lo mostro in pagina
                $(".flip-card[data-id='" + id + "']").show();
                //imposto il display none al numero dei risultati nel h2
                $(".titolo_ricerca span").hide();
            } else if ($(this).val() != "") {
                //altrimenti nascondi l'elemento corrente
                $(".flip-card[data-id='" + id + "']").hide();
            }
            //se lo scroll della pagina non è pari a 0 lo imposto a tale misura
            if ($(document).scrollTop() != 0) {
                $(document).scrollTop(0);
            }
            //se nessun film rientra tra il genere selezionato rimuovo il titolo della ricerca
            hide_title("movie");
            // nessuna serie-tv rientra tra il genere selezionato rimuovo il titolo della ricerca
            hide_title("tv");
        })
    }

    function hide_title(tipo) {
        if ($("." + tipo).children(".flip-card:visible").length == 0) {
            $("." + tipo + " .titolo_ricerca").hide();
        } else {
            $("." + tipo + " .titolo_ricerca").show();
        }
    }
})

//setto il popup all'apertura della pagina
$("#remove-popup").click(function() {
    $(this).closest("#wrapper-popup").remove();
})
