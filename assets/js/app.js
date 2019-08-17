var app = {
    compare: false,
    // moviesArray:[],
    moviesObjs: [],
    idCounter: 0,
    recentSearch: [],
    blinkerInterval: '',
    addMovie(el, isInput){
        event.preventDefault();
        var movie;
        
        if(isInput){
             movie = el.val();
             this.chipGen(el);
        }
        else{
             movie = el.attr('data-subject');
        }

        this.idCounter++;
        this.getOMDB(movie);
        // this.moviesArray.push(movie);

        el.val('');


    },
    getRecent(){
        $('#recentSearch').empty();
        var existing = JSON.parse(localStorage.getItem('search'));
        console.log(existing);
        if(!Array.isArray(existing)){
            app.recentSearch = []; 
        } else{
            app.recentSearch = existing;
        }

        for(var j = 0; j<app.recentSearch.length; j++){
            var searchButtons = $("<div>").addClass("chip");
            var searchTitle = $('<span>').addClass("chipSearch").text(app.recentSearch[j]).attr("data-subject", app.recentSearch[j]);
            var searchClose = $('<span>').addClass('chipClose').html('<i class="close material-icons">close</i>').attr("data-subject", app.recentSearch[j]);
            $(searchButtons).append(searchTitle, searchClose);
            $("#recentSearch").append(searchButtons);
        }
    },
    chipGen(el){
        var movie= el.val();
        app.recentSearch.unshift(movie);
        if(app.recentSearch.length > 5){
            app.recentSearch.pop();
        }
        console.log(app.recentSearch);
                
                    // Save back to localStorage
        localStorage.setItem("search", JSON.stringify(app.recentSearch));
                    // Get the existing data
        app.getRecent();   
                    // $(existing).push(JSON.stringify(movie));
                    // localStorage.setItem('search', existing.toString());
    },
    wikiAPI(movie, rating, rating2, rating3, boxOffice){
        var queryUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&origin=*&titles=' + movie + '&rvsection=0';

         console.log("Rating 2 in WikiAPI: " + rating2);

        $.ajax({
            url: queryUrl,
            method: 'GET'
        }).then(function (response) {
            var pages = response.query.pages;
            var id = Object.getOwnPropertyNames(pages);
            var budget = app.getWiki(pages, id, "budget");
            var gross = app.getWiki(pages, id, "gross");
            var box = app.getWiki(pages, id, "box office");


            var boxOff;
            if (boxOffice === undefined){
                if (gross !== undefined){
                    boxOff = gross;
                } else if (box !== undefined){
                    boxOff = box;
                } else {
                    boxOff = undefined;
                }
            } else {
                boxOff = boxOffice;
            }
            
            // console.log(movie + ' Box Office: ' + boxOffice);
            // console.log(movie + ' Budget: ' + budget);
            // console.log(movie + ' Gross: ' + gross);

            var movieObj = { id: app.idCounter, name: movie, rating: rating, rating2: rating2, rating3: rating3, budget: budget, gross: boxOff};
            app.moviesObjs.push(movieObj);
            
            console.log(app.moviesObjs);
            
        });

    },
    getWiki(pages, id, string){
        // console.log(pages);
        // console.log(id);
        console.log(pages[id]);
        var str1 = pages[id].revisions[0]['*'].toLowerCase();
        console.log(str1);
        var location = str1.indexOf(string);
        var str2 = str1.substring(location, str1.length);
        var dollarLocation = str2.indexOf('$');
        var str3 = str2.substring(dollarLocation + 1, str2.length);
        var codeLocation = str3.indexOf('<');
        var total = str3.substring(0, codeLocation);
        var totalInt;
        if (total.indexOf('million')>-1){
            totalInt = parseFloat(total) * 1000000; 
        } else if (total.indexOf("billion")>-1){
            totalInt = parseFloat(total) * 1000000000;
        }
        console.log(totalInt)
        return totalInt;
    },
    getWikiUrl(movie, id){
        var queryUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + movie + '&limit=1&format=json&origin=*&callback=';
        $.ajax({
            url: queryUrl,
            method: 'GET'
        }).then(function(response){
            var http = response.indexOf('http');
            var str = response.substring(http, response.length);
            var end = str.indexOf('"]');
            var link = str.substring(0, end);
            console.log(link);
            var link = $('<li>').html('See on WikiPedia: <a href="' + link + '" target="_blank">' + link + '</a>');
            $('#ul' + id).append(link);
        })
    },
    deleteAddedMovie(){
        event.preventDefault();
        $(this).parent().parent().remove();
        var dataNum = $(this).parent().parent().attr('data-num');
        var num = parseInt(dataNum);
        if (app.moviesObjs.length === 2){
            $("input").prop("disabled", false);
            $("#comment").text("");
            clearInterval(app.blinkerInterval);
        }
        app.moviesObjs = app.moviesObjs.filter(function( obj ) {
            return obj.id !== num;
        });
    },
    movieCards(movie, plot, poster, year, rate, genre, director, id){
        var movieWrap = $('<div>').addClass('movie-wrap').attr('data-id', movie).attr('data-num', app.idCounter);
        var wrap = $('<div>').addClass('movie-title-wrap');
        var title = $('<h5>').addClass('movie-title').text(movie + " (" + year + ")");
        var btnDelete = $('<button>').addClass('button button-delete').html('<i class="material-icons">close</i>');
        var poster = $("<img>").addClass("movie-poster").attr("src", poster);
        var plot = $('<div>').addClass('movie-plot').text(plot);
        var ul = $("<ul>").addClass('movie-info').attr('id', 'ul' + id);
        var rated = $("<li>").text("Rating: " + rate);
        var genre = $("<li>").text("Genre: " + genre);
        var director =$("<li>").text("Directed By: " + director);
        ul.append(rated, genre, director);
        wrap.append(title, btnDelete);
        movieWrap.append(wrap,poster, plot, ul);
        $('#addedMovies').prepend(movieWrap);        
    },
    compare(movie){
        event.preventDefault();
        clearInterval(app.blinkerInterval);
        console.log(app.moviesObjs);
        
        if(app.moviesObjs[0].gross !== undefined && app.moviesObjs[1].gross !== undefined){
            app.generateChart("results1", 'Box Office Total', app.moviesObjs[0].gross, app.moviesObjs[1].gross);
        } 

        if (app.moviesObjs[0].budget !== undefined && app.moviesObjs[1].budget !== undefined){
            app.generateChart("results2", 'Budget', app.moviesObjs[0].budget, app.moviesObjs[1].budget);
        }

        if (app.moviesObjs[0].rating !== undefined && app.moviesObjs[1].rating !== undefined) {
        app.generateChart("results3", 'Internet Movie Data', app.moviesObjs[0].rating, app.moviesObjs[1].rating);
        }

        if (app.moviesObjs[0].rating2 !== undefined && app.moviesObjs[1].rating2 !== undefined) {
            app.generateChart("results4", 'Rotten Tomatoes', app.moviesObjs[0].rating2, app.moviesObjs[1].rating2);
        }
        
        if (app.moviesObjs[0].rating3 !== undefined && app.moviesObjs[1].rating3 !== undefined) {
        app.generateChart("results5", 'Metacritic', app.moviesObjs[0].rating3, app.moviesObjs[1].rating3);
        }

        app.generateHeader();

        $("#search-wrap").hide();
        $("#results-wrap").show();
        
    },
    blinker(){
        $("#compareMovies").fadeOut(300);
        $("#compareMovies").fadeIn(300);
        console.log('blink');
    },
    getOMDB(movie){ 

        var queryURL = "https://www.omdbapi.com/?t=" + movie + "&apikey=trilogy"; 

        $.ajax({
            url: queryURL,
            method: "GET"
        }).then(function(response) {

            if (response.Response === "True" && app.moviesObjs.length < 2){
                $('#movieNotFound').text('');
                console.log(response);
                var ratingValue = response.Ratings[0].Value,
                    rottenTomatoes = response.Ratings[1].Value,
                    metacritic = response.Ratings[2].Value;
                    
                var rating = parseFloat(ratingValue),
                    rating2 = parseInt(rottenTomatoes),
                    rating3 = parseFloat(metacritic)
                    box1 = response.BoxOffice.replace(/,/g, "");
                    box2 = box1.replace("$", "")
                    boxOffice = parseInt(box2);

                    console.log("BOX 2: " + box2)
                    

                app.movieCards(movie, response.Plot, response.Poster, response.Year, response.Rated, response.Genre, response.Director, this.idCounter);
                app.wikiAPI(response.Title, rating, rating2, rating3, boxOffice);
                app.getWikiUrl(response.Title, this.idCounter);

                if (app.moviesObjs.length === 1){
                    $("input").prop("disabled", true);
                    $("#comment").text("Click compare button to compare your movies now!");
                    app.blinkerInterval = setInterval(app.blinker, 1000);
                } 

            } else {
                $('#movieNotFound').text('Movie Not Found :-(');
            }

            console.log("moviesObjs: " + app.moviesObjs.length);

            console.log(response)
            
            console.log("RATING2" + rottenTomatoes)

        });

        
    },
    generateChart(param1, param2, param3, param4) {
        $("#chart-container").append(canvas);

        var canvas = $("<canvas>").attr('id', param1);

        // var ratingA = parseInt(app.moviesObjs[0].rating);
        // var ratingB = parseInt(app.moviesObjs[1].rating);
        var ctx = $('#' + param1);
        var myChart1 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [app.moviesObjs[0].name, app.moviesObjs[1].name],
            datasets: [{
                label: param2,
                data: [param3, param4],
                backgroundColor: [
                    'rgba(238, 9, 121, .4)',
                    'rgba(8, 196, 159, .4)',
                ],
                borderColor: [
                    'rgba(238, 9, 121, 1)',
                    'rgba(8, 196, 159, 1)',
                ],
                borderWidth: 1,
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        },
        aspectRatio: 1,
        duration: 3000

    });


    },
    generateHeader() {
        $("#movie-title1").text(app.moviesObjs[0].name);
        $("#movie-title2").text(app.moviesObjs[1].name);
        
    },
}

$(document).ready(function(){
    console.log(localStorage);
    // localStorage.clear();


    $("#results-wrap").hide();

    app.getRecent();
  
    $(document).on('click', '.button-delete', app.deleteAddedMovie);

    $('#compareMovies').on('click', app.compare);

    $('#addMovie').keypress(function(e){
        var key = e.which;
        var el = $(this);
        if(key == 13){
            app.addMovie(el, true);
        } 

    });

    $("#clear-button").on("click", function() {
        $("#addedMovies").empty();
        $("#movie-title1").empty();
        $("#movie-title2").empty();
        $("#chart-container").empty();
        app.moviesObjs = [];
        console.log(app.moviesObjs);
        console.log("click");
        $('#results-wrap').hide();
        $('#search-wrap').show();
        $("input").prop("disabled", false);
        $("#comment").text("");
    });

    $(document).on('click', ".chipSearch", function (e){ 
        e.preventDefault();
        var el = $(this);
        app.addMovie(el, false);
        console.log("search");
        
    });
    $(document).on('click', ".chipClose", function (e){
        event.preventDefault();
        var subject = $(this).attr("data-subject");
        app.recentSearch = app.recentSearch.filter(function(ele){
            return ele != subject;
            
        });
        localStorage.setItem("search", JSON.stringify(app.recentSearch));
        console.log(subject);
        console.log(app.recentSearch);
        console.log("delete");
    

});
});