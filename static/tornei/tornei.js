"use strict"

$(document).ready(function () {
  let currentUser;
  let _colsMobile = $(".colHeadMini");
  let currentMail;
  let datiPersonali;
  let _imgs;
  let timeoutPreference;
  let preferenze = [];
  let btnSearch = $("#btnSearch");
  let btnCreate = $("#btnCreate");
  let txtNome = $("#txtNome");
  let feat;
  let prefeSelezionataName;
  let prefeSelezionataId;
  let nPartecipanti = 0;



  //#region INIT
  let apitest = inviaRichiesta("GET", "/api/test");
  apitest.fail(function (jqXHR, testStatus, strError) {
    if (jqXHR.status == "403") {
      //Token scaduto
      window.location.href = "../login/login.html";
    } else {
      //Errore generico
      errore(jqXHR, testStatus, strError);
    }
  });
  apitest.done(function (data) {
    currentUser = data.ris;
    console.log(currentUser);
    let par=getUrlParameter("name");
    if(par)
    {
      let request = inviaRichiesta("GET","/api/specificheTorneo",{"name":par});
      request.fail(function () { });
      request.done(function (data) {
        feat=data;
        console.log(feat["nome"]);
        features();
      });
    }
    // richiesta preferenze personali
    let request = inviaRichiesta("GET", "/api/datiPersonali", { "username": currentUser });
    request.fail(errore);
    request.done(function (data) {
      if(typeof(data.preferenze)!='undefined'){
        preferenze = data.preferenze;
      }
      listaPreferenze();
      listaNumber();
      torneiIscritti(data.tornei);
      torneiSuggeriti(data.preferenze,data.tornei);
    });
  });

  setTimeout(function () { test(); });
  //#endregion


  txtNome.on("keyup", function (event) {
    if ($(this).val() != "") {
      btnSearch.removeAttr("disabled");
      btnCreate.removeAttr("disabled");
    }
    else {
      btnSearch.prop("disabled", "disabled");
      btnCreate.prop("disabled", "disabled");
    }
  });

  btnSearch.on("click", search);
  btnCreate.on("click", create);

  // popup crea torneo
  $("#txtName").on("keyup", function () {
    check();
  });

  $("#txtData").on("change", function () {
    check();
  });

  $("#txtTime").on("change", function () {
    check();
  });

  $("#txtTeamNumber").on("change", function () {
    check();
  });

  $("#btnChiudiMod").on("click", function () {
    $("#txtNome").val("");
    $('#modalCrea').modal('hide');
  });

  $("#btnConferma").on("click", function () {
    $("#txtNome").val("");
    $('#modalCrea').modal('hide');
    let member;
    if (feat["teamNumber"] == 1)
      member = currentUser;
    else {
      //member=team selezionato
    }

    let request = inviaRichiesta("POST", "/api/creaTorneo", {
      "name": $("#txtName").val(),
      "desc": $("#txtDescription").val(),
      "startingData": $("#txtData").val(),
      "startingTime": $("#txtTime").val(),
      "game": prefeSelezionataId,
      "n4Team": $("#txtTeamNumber").val(),
      "nPartecip": nPartecipanti,
      "me": member
    });
    request.fail(errore);
    request.done(function (data) {

    });
  });



  //#region MOBILE
  _colsMobile.on("click", function () {
    let _currentChoice = $(this);
    if (!_currentChoice.hasClass("active")) {
      _colsMobile.removeClass("active");
      _currentChoice.addClass("active");
      _mobileWrapper.empty();
      switch (_currentChoice.prop("id")) {
        case "colChatMobile":
          $("<br>").appendTo(_mobileWrapper);
          for (let i = 0; i < rooms.length; i++) {
            let typeName = rooms[i].split("/");
            let _wrapper = $("<div>").addClass("chatMini").css({ "background-color": "whitesmoke" }).appendTo(_mobileWrapper);
            $("<div>").addClass("chatImgMobile").prop("align", "left").append($("<div>").addClass("littleImgProfile")).appendTo(_wrapper);
            let _textArea = $("<div>").addClass("chatTextAreaMobile").prop("align", "left").appendTo(_wrapper);
            $("<strong>").text(typeName[0].toUpperCase() + ": " + typeName[1]).appendTo(_textArea);
            $("<br>").appendTo(_textArea);
            $("<p>").text("provaprovaprova").appendTo(_textArea);
            $("<div>").addClass("notify").addClass("hidden").css({ "display": "inline-block", "margin-bottom": "2%" }).prop("id", "mobileNotify" + rooms[i]).appendTo(_wrapper);
          }
          break;
        case "colNewsMobile":
          let testo;
          let i = 0;
          $("<br>").appendTo(_mobileWrapper);
          for (let item of datiNews) {
            testo = item["contents"];
            if (!testo.includes("{STEAM_CLAN_IMAGE}")) {
              testo = testo.replace(/\[/g, '<');
              testo = testo.replace(/\]/g, '>');
              let _wrapper = $("<div>").addClass("news").appendTo(_mobileWrapper);
              $("<div>").addClass("rowNewsHead").append($("<div>").addClass("newsHead")).appendTo(_wrapper);
              $("<div>").addClass("newsBody").append($("<h2>").addClass("newsTitle").on("click", showNews).prop("id", "titleMobile" + i).text(item["title"])).append($("<br>")).append($("<p>").hide().addClass("newsContent").prop("id", "contentMobile" + i).prop("vis", false).html(testo)).appendTo(_wrapper).append($("<br>")).append(
                $("<div>").addClass("newsFooter").addClass("row").append($("<div>").addClass("col-lg-6").addClass("d-none").addClass("d-lg-block")).append($("<div>").addClass("col-lg-6").addClass("col-md-12").text("Autore: " + item["author"])));
              i++;
            }
          }
          break;
      }
    }
  })
  //#endregion

  //#region TRASH
  /*************************************************************************************************************************************************************/
  // ---------Responsive-navbar-active-animation-----------
  function test() {
    var tabsNewAnim = $('#navbarSupportedContent');
    var selectorNewAnim = $('#navbarSupportedContent').find('li').length;
    var activeItemNewAnim = tabsNewAnim.find('.active');
    var activeWidthNewAnimHeight = activeItemNewAnim.innerHeight();
    var activeWidthNewAnimWidth = activeItemNewAnim.innerWidth();
    var itemPosNewAnimTop = activeItemNewAnim.position();
    var itemPosNewAnimLeft = activeItemNewAnim.position();
    $(".hori-selector").css({
      "top": itemPosNewAnimTop.top + "px",
      "left": itemPosNewAnimLeft.left + "px",
      "height": activeWidthNewAnimHeight + "px",
      "width": activeWidthNewAnimWidth + "px"
    });
    $("#navbarSupportedContent").on("click", "li", function (e) {
      $('#navbarSupportedContent ul li').removeClass("active");
      $(this).addClass('active');
      var activeWidthNewAnimHeight = $(this).innerHeight();
      var activeWidthNewAnimWidth = $(this).innerWidth();
      var itemPosNewAnimTop = $(this).position();
      var itemPosNewAnimLeft = $(this).position();
      $(".hori-selector").css({
        "top": itemPosNewAnimTop.top + "px",
        "left": itemPosNewAnimLeft.left + "px",
        "height": activeWidthNewAnimHeight + "px",
        "width": activeWidthNewAnimWidth + "px"
      });
    });
  }
  $(window).on('resize', function () {
    setTimeout(function () { test(); }, 500);
  });
  $(".navbar-toggler").click(function () {
    setTimeout(function () { test(); });
  });



  /*************************************************************************************************************************************** */
  //#endregion

  //#region FUNCTIONS

  function search() {
    $("#sezAllTornei").empty();
    $("#loading").empty();
    $("#feat").empty();
    let testo = txtNome.val();

    let request = inviaRichiesta("GET", "/api/elencoTornei", { "testo": testo });
    request.fail(errore);
    request.done(function (data) {
      if (data.length == 0)
        $("<p>").css({ "color": "red", "margin": "2%" }).html("No tournament found.").appendTo($("#sezAllTornei"));
      else {
        // gif di caricamento
        let div = $("<div>").appendTo($("#loadingAll").css("display", "block"));
        $("<img>").css({ "width": "60px", "height": "60px", "padding": "0" }).prop("src", "https://www.steadymd.com/wp-content/plugins/portfolio-filter-gallery//img/loading-icon.gif").appendTo(div);
        $("#sezAllTornei").css("display", "none");

        setTimeout(function () {
          $("#loadingAll").empty();
          $("#sezAllTornei").css("display", "block");
          $("<p>").css({ "color": "lightblue", "margin": "2%" }).html("Click on a tournaments to see its features.").appendTo($("#feat"));
        }, 1000);

        for (let i = 0; i < data.length; i++) {
          let li = $("<li>").prop("feat", data[i]).addClass("list-group-item d-flex justify-content-left align-items-center").appendTo($("#sezAllTornei")).on("click", features);
          $("<img>").prop("src", "https://cdn.akamai.steamstatic.com/steam/apps/" + data[i]["gioco"] + "/header.jpg").appendTo(li);
          $("<p>").css("margin-left", "8%").text(data[i]["nome"]).appendTo(li);
          $("<p>").css("margin-right", "8%").text("(" + data[i]["members"].length + "/" + data[i]["maxPlayers"] + ")").appendTo(li);
        }
      }
    });
  }

  function listaPreferenze() {
    for (let i = 0; i < preferenze.length; i++) {
      let richiesta = inviaRichiesta("GET", "/api/GameNameById", { "id": preferenze[i] });
      richiesta.fail(function (jqXHR, test_status, str_error) {
        errore(jqXHR, test_status, str_error);
      });
      richiesta.done(function (data) {
        $("<a>").addClass("dropdown-item").prop("href", "#").text(data.name).prop("info", data).appendTo($("#dropdownPrefe")).on("click", function () {
          prefeSelezionataName = $(this).text();
          prefeSelezionataId = preferenze[i];
          $("#btnGame").html(prefeSelezionataName);
          check();
        })
      })
    }
  }

  function listaNumber() {
    for (let a of $("#dropdownNumber").children("a")) {
      $(a).on("click", function () {
        nPartecipanti = $(a).text();
        $("#btnNumber").html("Participants' number: " + nPartecipanti);
        check();
      })
    }
  }

  function torneiIscritti(tornei){
    for(let i=0;i<tornei.length;i++)
    {
      let request= inviaRichiesta("GET", "/api/specificheTorneo",{"name":tornei[i]});
      request.fail(function () { });
      request.done(function (data) {
      let li=$("<li>").addClass("list-group-item d-flex justify-content-between align-items-center").append(
        $("<img>").prop("src","https://cdn.akamai.steamstatic.com//steam//apps/"+data["gioco"]+"/header.jpg").addClass("img rounded")
        ).append(
          $("<a>").html(tornei[i]).prop("href","/tornei/tornei.html?name="+tornei[i])
        ).appendTo("#sezIscritti");
      });
    }
  }

  function torneiSuggeriti(preferenze,tornei){
    let request= inviaRichiesta("GET", "/api/elencoTuttiTornei");
      request.fail(function () { });
      request.done(function (data) {
        for(let i=0;i<data.length;i++)
        {
          if(!tornei.includes(data[i]["nome"])&&preferenze.includes(data[i]["gioco"].toString()))
          {
            let li = $("<li>").prop("feat", data[i]).addClass("list-group-item d-flex justify-content-left align-items-center").appendTo($("#sezAllTornei")).on("click", features);
            $("<img>").prop("src", "https://cdn.akamai.steamstatic.com//steam//apps/" + data[i]["gioco"] + "/header.jpg").appendTo(li);
            $("<p>").css("margin-left", "8%").text(data[i]["nome"]).appendTo(li);
            $("<p>").css("margin-right", "8%").text("(" + data[i]["members"].length + "/" + data[i]["maxPlayers"] + ")").appendTo(li);
          }
        }
      });
  }

  function features() {
    for (let item of $("#sezAllTornei").children("li"))
      $(item).css("color", "blue");
    $(this).css("color", "white");

    if(!feat)
    feat = $(this).prop("feat");
    $("#loading").empty();
    $("#feat").empty();

    // gif di caricamento
    $("<div>").prop("id", "divGif").appendTo($("#loading").css("display", "block"));
    $("<img>").prop("id", "imgGif").css({ "width": "120px", "height": "120px", "padding": "0" }).prop("src", "https://www.steadymd.com/wp-content/plugins/portfolio-filter-gallery//img/loading-icon.gif").appendTo($("#divGif"));
    $("#feat").css("display", "none");

    setTimeout(function () {
      $("#loading").empty();
      $("#feat").css("display", "block");
    }, 1500);


    console.log(feat);
    // caratteristiche torneo
    let card = $("<div>").addClass("card").css({ "max-width": "70%", "margin": "2%" }).appendTo($("#feat"));
    $("<h5>").text(feat["nome"]).addClass("card-header").css({ "color": "rgb(89, 204, 60)", "font-weight": "bold", "font-size": "larger" }).appendTo(card);
    let cardBody = $("<div>").addClass("card-body").appendTo(card);
    let row = $("<div>").css("margin-top", "20px").addClass("row").appendTo(cardBody);
    let col1 = $("<div>").addClass("col-sm-6").css("text-align", "left").appendTo(row);
    $("<img>").prop("id", "imgCSS").prop("src", "https://cdn.akamai.steamstatic.com/steam/apps/" + feat["gioco"] + "/header.jpg").addClass("card-img-top").appendTo(col1);
    $("<br>").appendTo(col1);
    $("<br>").appendTo(col1);
    $("<br>").appendTo(col1);
    let divGioco = $("<div>").addClass("justify-content-between").css({ "font-size": "2.5vh", "text-align": "left" }).appendTo(col1);
    $("<span>").text("Game: ").appendTo(divGioco);
    let richiesta = inviaRichiesta("GET", "/api/GameNameById", { "id": feat["gioco"] });
    richiesta.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    richiesta.done(function (data) {
      $("<span>").css("font-weight", "bold").text(data.name).appendTo(divGioco);
    });
    let divIat = $("<div>").addClass("justify-content-between").css({ "font-size": "2.5vh", "text-align": "left" }).appendTo(col1);
    $("<span>").text("Start date: ").appendTo(divIat);
    $("<span>").css("font-weight", "bold").text(feat["dataInizio"] + " (" + feat["oraInizio"] + ")").appendTo(divIat);
    let divMax = $("<div>").addClass("justify-content-between").css({ "font-size": "2.5vh", "text-align": "left" }).appendTo(col1);
    $("<span>").text("Maximum number of players: ").appendTo(divMax);
    $("<span>").css("font-weight", "bold").text(feat.maxPlayers).appendTo(divMax);
    let divNum = $("<div>").addClass("justify-content-between").css({ "font-size": "2.5vh", "text-align": "left" }).appendTo(col1);
    $("<span>").text("Team players number: ").appendTo(divNum);
    $("<span>").css("font-weight", "bold").text(feat.teamNumber).appendTo(divNum);
    let col2 = $("<div>").addClass("col-sm-6").appendTo(row);
    let divDescr = $("<div>").appendTo(col2).css("height", "25%");
    $("<p>").text(feat["descrizione"]).appendTo(divDescr);

    //membri
    $("<div>").prop("id", "btnPPT").css({ "max-height": "35vh", "overflow-y": "scroll", "padding": "0", "padding-right": "2px" }).appendTo(col2);
    for (let item of feat.members) {
      let richiesta = inviaRichiesta("GET", "/api/datiPersonali", { "username": item });
      richiesta.fail(function (jqXHR, test_status, str_error) {
        errore(jqXHR, test_status, str_error);
      });
      richiesta.done(function (data) {
        let foto = data.profileImage;
        if (!foto) {
          foto = "https://www.shopinimizaj.com/frontend/web/images/no_images.png";
        }
        let listItem = $("<li>").addClass("list-group-item").prop("title", data.username).addClass("d-flex").addClass("list-group-item d-flex justify-content-between align-items-center lstMembers").css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
          $("<img>").prop("src", foto)
        ).append(
          $("<p>").text(data.username).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
        ).appendTo($("#btnPPT")).on("click", function () {
          window.location = "../cercautenti/cercautenti.html?username=" + data.username;
        });
        //$("<img>").addClass("imgPref").prop("src", data.username == currentTeam.founder ? "https://cdn.iconscout.com/icon/free/png-512/crown-412-910303.png" : "https://lh3.googleusercontent.com/proxy/TwrGgAlbkWx93YT1qORvgMyv0CnYYzIdTTdCzs2IYvjgdizIIGxOHC_0Q8pQeALyVYlaBKUnSCF7ro-p1Bg4vSOn89knloaYGK62JJ4BqmiOjCqZmsXDSYx8DSsvUg").appendTo(listItem);
      })
    }

    let row2 = $("<div>").css("margin-top", "3%").addClass("row").appendTo(cardBody);
    $("<div>").addClass("col-sm-4").appendTo(row2);
    let col = $("<div>").addClass("col-sm-4").appendTo(row2);
    $("<button>").prop("id", "btnIscrizione").text("Join tournament").addClass("btn btn-success").appendTo(col).on("click", iscriviti);
    $("<div>").addClass("btn-group dropright").append(
      $("<button>").addClass("btn btn-primary").prop("type","button").text("Select the team")
    ).append(
      $("<button>").addClass("btn btn-primary dropdown-toggle dropdown-toggle-split").append("<span>").addClass("sr-only")
    ).append(
      $("<div>").addClass("dropdown-menu").prop("id","dropTeams")
    ).appendTo(col).hide();
    $("<div>").addClass("col-sm-4").appendTo(row2);

    if (feat["members"].includes(currentUser))
      $("#btnIscrizione").prop("disabled", "true");
    
  }

  function iscriviti() {
    if (feat["teamNumber"] == 1) {
      let richiesta = inviaRichiesta("GET", "/api/addMembroTorneo", { "member": currentUser, "torneo": feat["nome"] });
      richiesta.fail(function (jqXHR, test_status, str_error) {
        errore(jqXHR, test_status, str_error);
      });
      richiesta.done(function (data) {
        $("#btnIscrizione").prop("disabled", "true");
      })
    }
    else {
      $("#dropTeams").show();
      // let richiesta = inviaRichiesta("GET", "/api/elencoTeamUser", { "username": currentUser});
      // richiesta.fail(function (jqXHR, test_status, str_error) {
      //   errore(jqXHR, test_status, str_error);
      // });
      // richiesta.done(function (data) {
      //   $("#btnIscrizione").prop("disabled", "true");
      // })
    }

  }

  function check() {
    if ($("#txtName").val() != "" && prefeSelezionataName != "" && $("#txtData").val() != "" &&
      $("#txtTime").val() != "" && $("#txtTeamNumber").val() > 0 && $("#txtTeamNumber").val() <= 5 && nPartecipanti != 0)
      $("#btnConferma").removeAttr("disabled");
    else
      $("#btnConferma").prop("disabled", "disabled");
  }

  function create() {
    $("#sezAllTornei").empty();
    $("#txtName").val(txtNome.val());
    $("#txtDescription").val("");
    $("#txtData").val("");
    $("#txtTime").val("");
    $("#btnGame").html("Choose the game");
    $("#btnNumber").html("Participants' number");
    $("#txtTeamNumber").val("");
    $("#btnConferma").prop("disabled", "disabled");
    $('#modalCrea').modal('show');
  }

  function lista() {
    if (!$(this).hasClass("active")) {
      $(".btnList").removeClass("active");
      $(this).addClass("active");
      switch ($(this).text()) {
        case "Preferences":
          creazioneLi("preferenze");
          break;
        case "Teams":
          creazioneLi("team");
          break;
        case "Tournaments":
          creazioneLi("tornei");
          break;
      }
    }
  }

  function creazioneLi(selected) {
    $("#btnPPT").empty();
    for (let item of feat[selected]) {
      let richiesta = inviaRichiesta("GET", "/api/GameNameById", { "id": item });
      richiesta.fail(function (jqXHR, test_status, str_error) {
        errore(jqXHR, test_status, str_error);
      });
      richiesta.done(function (data) {
        $("<li>").addClass("list-group-item").prop("title", data.name).addClass("d-flex").addClass("list-group-item list-group-item-primary d-flex justify-content-between align-items-center").prop("id", "preference" + data.id).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
          $("<img>").prop("src", "https://cdn.akamai.steamstatic.com/steam/apps/" + data.id + "/header.jpg").addClass("imgPref")
        ).append(
          $("<p>").text(data.name).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
        ).appendTo($("#btnPPT")).on("click", function () {
          controllaActive($(this), data);
        });
      })
    }
  }

  function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    console.log(results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' ')));
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  function inviaRichiestaMultipart(method, url, parameters) {
    return $.ajax({
      url: url, //default: currentPage
      type: method,
      data: parameters,
      contentType: false, //deve trasmettere i dati così come sono
      processData: false,
      dataType: "json",
      timeout: 5000,
    });
  }

  //#endregion
})