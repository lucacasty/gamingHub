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
  let txtUsername = $("#txtUsername");
  let param;
  let feat;
  let selectedTeam = "";


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
  });
  param = getUrlParameter("username");
  if (param) {
    let reqPrefe = inviaRichiesta("GET", "/api/datiPersonali", {
      "username": param
    });
    reqPrefe.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    reqPrefe.done(function (data) {
      features(data);
    });
  }
  setTimeout(function () { test(); });
  //#endregion


  txtUsername.on("keyup", function (event) {
    if ($(this).val() != "") {
      btnSearch.removeAttr("disabled");
      if (event.keyCode == 13)
        search();
    }
    else
      btnSearch.prop("disabled", "disabled");
  });

  btnSearch.on("click", search);
  $("#btnConferma").on("click", mandaInvito);


  //#endregion

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
    $("#sezAllUsers").empty();
    $("#loading").empty();
    $("#feat").empty();
    let testo = txtUsername.val();

    let request = inviaRichiesta("GET", "/api/elencoUtenti", { "testo": testo });
    request.fail(errore);
    request.done(function (data) {
      if (data.length == 0)
        $("<p>").css({ "color": "red", "margin": "2%" }).html("No user found.").appendTo($("#sezAllUsers"));
      else {
        $("<p>").css({ "color": "lightblue", "margin": "2%" }).html("Click on a profile to see its features.").appendTo($("#feat"));

        for (let i = 0; i < data.length; i++) {
          let li = $("<li>").prop("feat", data[i]).addClass("list-group-item d-flex justify-content-left align-items-center").appendTo($("#sezAllUsers")).on("click", features);
          $("<img>").prop("src", "https://thumbs.dreamstime.com/b/chat-icon-vector-isolated-white-background-sign-linear-symbol-stroke-design-elements-outline-style-transparent-134064048.jpg").appendTo(li);
          $("<p>").css("margin-left", "8%").text(data[i]["username"]).appendTo(li);
        }
      }
    });
  }

  function features(dati = "") {
    for (let item of $("#sezAllUsers").children("li"))
      $(item).css("color", "blue!important");
    $(this).css("color", "white");
    if ($(this).prop("feat"))
      feat = $(this).prop("feat")
    else
      feat = dati;
    $("#loading").empty();
    $("#feat").empty();

    // gif di caricamento
    $("<div>").prop("id", "divGif").appendTo($("#loading").css("display", "block"));
    $("<img>").prop("id", "imgGif").css({ "width": "120px", "height": "120px", "padding": "0" }).prop("src", "https://www.steadymd.com/wp-content/plugins/portfolio-filter-gallery//img/loading-icon.gif").appendTo($("#divGif"));
    $("#feat").css("display", "none");

    setTimeout(function () {
      $("#loading").empty();
      $("#feat").css("display", "block");
    }, 1700);

    // caratteristiche utente
    let card = $("<div>").addClass("card").css({ "max-width": "70%", "margin": "2%" }).appendTo($("#feat"));
    $("<h5>").text(feat["username"]).addClass("card-header").css({ "color": "rgb(89, 204, 60)", "font-weight": "bold", "font-size": "larger" }).appendTo(card);
    let cardBody = $("<div>").addClass("card-body").appendTo(card);
    let row = $("<div>").css("margin-top", "20px").addClass("row").appendTo(cardBody);
    let col1 = $("<div>").addClass("col-sm-6").css("text-align", "left").appendTo(row);
    $("<img>").prop("src", "gif/foto.JPG").css("max-width", "35%!important").addClass("card-img-top").appendTo(col1);
    $("<br>").appendTo(col1);
    $("<br>").appendTo(col1);
    $("<br>").appendTo(col1);
    let divEmail = $("<div>").addClass("justify-content-between").css({ "font-size": "2.5vh", "text-align": "left" }).appendTo(col1);
    $("<span>").text("Email: ").appendTo(divEmail);
    $("<span>").css("font-weight", "bold").text(feat["mail"]).appendTo(divEmail);
    let divDob = $("<div>").addClass("justify-content-between").css({ "font-size": "2.5vh", "text-align": "left" }).appendTo(col1);
    $("<span>").text("Date of birth: ").appendTo(divDob);
    let dob = feat["dataNascita"].split("-");
    $("<span>").css("font-weight", "bold").text(dob[2] + "/" + dob[1] + "/" + dob[0]).appendTo(divDob);
    let col2 = $("<div>").addClass("col-sm-6").appendTo(row);
    $("<h4>").text("Choose what to display: ").appendTo(col2);
    let divBtnGroup = $("<div>").prop("id", "divBtnGroup").addClass("btn-group").appendTo(col2);
    $("<a>").prop("href", "#").prop("aria-current", "page").addClass("btn btn-primary").addClass("active").addClass("btnList").text("Preferences").appendTo(divBtnGroup).on("click", lista);
    $("<a>").prop("href", "#").prop("aria-current", "page").addClass("btn btn-warning").text("Teams").addClass("btnList").appendTo(divBtnGroup).on("click", lista);
    $("<a>").prop("href", "#").prop("aria-current", "page").addClass("btn btn-danger").text("Tournaments").addClass("btnList").appendTo(divBtnGroup).on("click", lista);
    $("<br>").appendTo(col2);
    $("<br>").appendTo(col2);
    let btnPPT = $("<div>").prop("id", "btnPPT").css({ "max-height": "35vh", "overflow-y": "scroll", "padding": "0", "padding-right": "2px" }).appendTo(col2);
    creazioneLi("preferenze");
    let rowBtnInvita = $("<div>").appendTo(cardBody);
    $("<br>").appendTo(rowBtnInvita);

    if (currentUser != feat["username"]) {
      setTimeout(function () {
        $("<a>").prop("href", "#").css("margin", "0px auto").addClass("btn btn-success btn-lg").text("Invite in my team").appendTo(rowBtnInvita).prop("id", "btnAddToMyTeam").on("click", addToMyTeam);
      }, 1000);
    }
  }

  function addToMyTeam() {
    $(".dropdown-menu").empty();
    $("#dropdownTeam").html("Choose the team");
    $('#modalInvita').modal('show');
    let request = inviaRichiesta("POST", "/api/getTeamByUsername", { "myUsername": currentUser, "yourUsername": feat["username"] });
    request.fail(errore);
    request.done(function (data) {
      let myTeams = data.myTeams;
      let yourTeams = data.yourTeams;
      let richieste = data.yourReq;

      if (myTeams.length > 0) {
        for (let team of myTeams) {
          let a = $("<a>").addClass("dropdown-item").text(team).prop("team", team).appendTo($(".dropdown-menu"));

          // controllo che non sia già presente nel team o non gli sia stata ancora mandata nessuna richiesta per quel team
          if (!(yourTeams.includes(team)) && !(richieste.includes(team))) {
            a.prop("href", "#").on("click", seleziona);
          }
        }
      }
    });
  }

  function seleziona() {
    $("#dropdownTeam").html("Team: " + $(this).prop("team"));
    let tiprego = $(this).prop("team");
    if (selectedTeam != tiprego)
      selectedTeam = $(this).prop("team");
    console.log(selectedTeam);

    $("#btnConferma").removeAttr("disabled");
  }

  function mandaInvito() {
    let request = inviaRichiesta("POST", "/api/invitoTeam", { "username": feat["username"], "team": selectedTeam });
    request.fail(errore);
    request.done(function (data) {
      console.log(data);
    });

    $("#btnConferma").prop("disabled", "true");
    $('#modalInvita').modal('hide');
    $("#dropdownTeam").html("Choose the team");
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
    if (feat[selected].length > 0) {
      if (selected == "preferenze") {
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
            ).appendTo($("#btnPPT"));
          })
        }
      }
      else if (selected == "team") {
        for (let item of feat[selected]) {
          let richiesta = inviaRichiesta("GET", "/api/teamImage", { "name": item });
          richiesta.fail(function (jqXHR, test_status, str_error) {
            errore(jqXHR, test_status, str_error);
          });
          richiesta.done(function (data) {
            let foto;
            foto = data[0].photo;
            if (!foto)
              foto = "https://www.shopinimizaj.com/frontend/web/images/no_images.png";
            let listItem = $("<li>").addClass("list-group-item").prop("title", data[0].nome).addClass("d-flex").addClass("list-group-item list-group-item-warning d-flex justify-content-between align-items-center").prop("id", "preference" + data.id).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
              $("<img>").prop("src", foto)
            ).append(
              $("<p>").text(data[0].nome).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
            ).appendTo($("#btnPPT")).on("click", function () {
              window.location = "../team/team.html?name=" + data[0].nome;
            });
            $("<img>").addClass("imgPref").prop("src", data[0].founder == currentUser ? "https://cdn.iconscout.com/icon/free/png-512/crown-412-910303.png" : "https://lh3.googleusercontent.com/proxy/TwrGgAlbkWx93YT1qORvgMyv0CnYYzIdTTdCzs2IYvjgdizIIGxOHC_0Q8pQeALyVYlaBKUnSCF7ro-p1Bg4vSOn89knloaYGK62JJ4BqmiOjCqZmsXDSYx8DSsvUg").appendTo(listItem);
          })
        }
      }
      else if (selected == "tornei") {
        for (let item of feat[selected]) {
          let torneo;
          let richiesta = inviaRichiesta("GET", "/api/specificheTorneo", { "name": item });
          richiesta.fail(function (jqXHR, test_status, str_error) {
            errore(jqXHR, test_status, str_error);
          });
          richiesta.done(function (data) {
            torneo = data;
            let id = torneo.gioco;
            let request = inviaRichiesta("GET", "/api/findPhoto", { "idGame": id.toString() });
            request.fail(function (jqXHR, test_status, str_error) {
              errore(jqXHR, test_status, str_error);
            });
            request.done(function (data1) {
              let listItem = $("<li>").addClass("list-group-item").prop("title", torneo.nome).addClass("d-flex").addClass("list-group-item list-group-item-danger d-flex justify-content-between align-items-center").prop("id", "preference" + torneo.gioco).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
                $("<img>").prop("src", data1[0].imgPath)
              ).append(
                $("<p>").text(torneo.nome).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
              ).appendTo($("#btnPPT")).on("click", function () {
                window.location = "../tornei/tornei.html?name=" + torneo.nome;
              });
              //$("<img>").addClass("imgPref").prop("src", data.creator == currentUser ? "https://cdn.iconscout.com/icon/free/png-512/crown-412-910303.png" : "https://lh3.googleusercontent.com/proxy/TwrGgAlbkWx93YT1qORvgMyv0CnYYzIdTTdCzs2IYvjgdizIIGxOHC_0Q8pQeALyVYlaBKUnSCF7ro-p1Bg4vSOn89knloaYGK62JJ4BqmiOjCqZmsXDSYx8DSsvUg").appendTo(listItem);
            })
          })
        }
      }
    }
    else
      $("<p>").text("No element found.").appendTo($("#btnPPT")).css("color", "red");
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