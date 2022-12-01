"use strict"



$(document).ready(function () {
  let _newsWrapperDesktop = $("#colBodyDesktop");
  let _chatWrapperDesktop = $("#colChatDesktop");
  let _chatWrapper = $("#chatWrapper");
  let _mobileWrapper = $("#colBodyMobile");
  let _notifica = $("#notifica");
  let _colsMobile = $(".colHeadMini");
  let _wrapperPreferences = $("#listPreferences");
  let _aPageButtons = $("#navbarSupportedContent .nav-link");
  let divResults = $("#divResults");
  let _viewAllTournaments=$("#view_all_tournaments");
  let timeoutPreference;
  let datiNews;
  let currentUser;
  let completeUser;
  let skippedNews;
  let rooms = [];
  let listaNews = [];
  let preferenze = [];
  let teams = [];
  let contNews = 0;
  let _imgs;

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
    completeUser = data;
    console.log(currentUser);
    //#region PREFERENZE
    let reqPrefe = inviaRichiesta("POST", "/api/controlloPreferenze", {
      "username": currentUser
    });
    reqPrefe.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    reqPrefe.done(function (data) {
      if (typeof(data["preferenze"]) == 'undefined' || data["preferenze"].length == 0) {
        popupPreferenze();
      }
      else {
        for (let index = 0; index < data["preferenze"].length; index++) {
          preferenze.push(parseInt(data["preferenze"][index]))
        }
        if(typeof(data["team"])!='undefined'){
          teams=data["team"];
        }
        skippedNews = 0;
        for (let i = 0; i < preferenze.length; i++) {
          caricaNews(preferenze[i], 5, skippedNews);
        }
        appendNews();
        caricaChats("forum");
      }
      caricaTornei(data["tornei"]);
    });
    //#endregion
  });
  setTimeout(function () { test(); });
  //#endregion

  $("#listaTornei").on("click", "li:not(#view_all_tournaments)", function () {
    let nomeTorneo = $(this).children("p").html();
    window.location.href = "tornei/tornei.html?name=" + nomeTorneo;
  });



  //#region NEWS

  function caricaNews(idGame, count, skip) {
    let requestNews = inviaRichiesta("get", "/api/getNewsGame", { "idGame": idGame, "count": count + skip }, false);
    requestNews.fail(errore);
    requestNews.done(function (body) {
      let data = JSON.parse(body);
      datiNews = data["appnews"]["newsitems"];
      for (let index = skip; index < datiNews.length; index++) {
        datiNews[index]['contents']=datiNews[index]['contents'].replaceAll('[','<');
        datiNews[index]['contents']=datiNews[index]['contents'].replaceAll(']','>');
        listaNews.push(datiNews[index]);
      }
    });
  }
  function appendNews() {
    listaNews = listaNews.sort((a, b) => b.date - a.date);
    for (let i = 0; i < listaNews.length; i++) {
      if (preferenze.includes(listaNews[i].appid)) {
        let item = listaNews[i];
        let gameImage = "https://cdn.akamai.steamstatic.com/steam/apps/" + listaNews[i].appid + "/header.jpg";
        let testo = item["contents"];
        let milliseconds = parseInt(item["date"] + "000");
        let dateOfNews = new Date(milliseconds);
        dateOfNews = dateOfNews.toLocaleDateString();
        if (!testo.includes("{STEAM_CLAN_IMAGE}")) {
          let _wrapper = $("<div>").addClass("news").appendTo(_newsWrapperDesktop);
          $("<div>").addClass("rowNewsHead").append($("<div>").prop("dateOf", milliseconds).addClass("newsHead").css("background-image", "url(" + gameImage + ")")).appendTo(_wrapper);
          $("<div>").addClass("newsBody").append($("<h2>").addClass("newsTitle").on("click", showNews).prop("id", "title" + contNews).text(item["title"])).append($("<br>")).append($("<p>").hide().addClass("newsContent").prop("id", "content" + contNews).prop("vis", false).html(testo)).appendTo(_wrapper).append($("<br>")).append(
            $("<div>").addClass("newsFooter").addClass("row").append($("<div>").prop("align", "left").addClass("col-sm-4").text(dateOfNews)).append($("<div>").addClass("col-sm-8").prop("align", "right").text("Author: " + item["author"])));
          let _wrapperMobile = $("<div>").addClass("news").appendTo(_mobileWrapper);
          $("<div>").addClass("rowNewsHead").append($("<div>").addClass("newsHead").css("background-image", "url(" + gameImage + ")")).appendTo(_wrapperMobile);
          $("<div>").addClass("newsBody").append($("<h2>").addClass("newsTitle").on("click", showNews).prop("id", "titleMobile" + contNews).text(item["title"])).append($("<br>")).append($("<p>").hide().addClass("newsContent").prop("id", "contentMobile" + contNews).prop("vis", false).html(testo)).appendTo(_wrapperMobile).append($("<br>")).append(
            $("<div>").addClass("newsFooter").addClass("row").append($("<div>").prop("align", "left").addClass("col-sm-4").text(dateOfNews)).append($("<div>").addClass("col-sm-8").prop("align", "right").text("Author: " + item["author"])));
          contNews++;
        }
      }
    }
    
    $(".newsBody a").prop("target","_blank");
    $("<button>").addClass("btn").addClass("btn-success").addClass("badge").css({ "width": "50px", "height": "50px", "font-size":"large", "position":"relative","top":"-18px"}).addClass("rounded-pill").text("V").appendTo(_newsWrapperDesktop).on("click", getOtherNews);
  }
  function getOtherNews() {
    skippedNews += 5;
    $(_newsWrapperDesktop).empty();
    contNews = 0;
    for (let i = 0; i < preferenze.length; i++) {
      caricaNews(preferenze[i], 5, skippedNews);
    }
    appendNews();
  }
  function showNews() {
    let id = this.getAttribute("id").substr(5);
    let currentNews = $("#content" + id);
    if (!currentNews.prop("vis"))
      currentNews.show(500, "linear").prop("vis", true);
    else
      currentNews.hide(500, "linear").prop("vis", false);
  }
  function caricaTornei(dat){
    for(let i=0;i<dat.length;i++)
    {
      let requestLog = inviaRichiesta("GET", "api/specificheTorneo",{"name":dat[i]});
      requestLog.fail(function () { });
      requestLog.done(function (data) {
        /**<li class="list-group-item d-flex justify-content-between align-items-center">
        <img src="https://thumbs.dreamstime.com/b/chat-icon-vector-isolated-white-background-sign-linear-symbol-stroke-design-elements-outline-style-transparent-134064048.jpg" />
        <p>Titolo torneo 2</p>
        <button class="btn btn-success">Iscriviti</span>
                    </li> */
      let li=$("<li>").addClass("list-group-item d-flex justify-content-between align-items-center").append(
        $("<img>").prop("src"," https://cdn.akamai.steamstatic.com//steam//apps/"+data["gioco"]+"/header.jpg").addClass("img rounded")
        ).append(
          $("<a>").html(dat[i]).prop("href","/tornei/tornei.html?name="+dat[i])
        ).appendTo("#listaTornei");
      });
    }
  }
  //#endregion

  //#region LOGOUT

  $("#logout").on("click", function () {
    let requestLog = inviaRichiesta("GET", "api/logout");
    requestLog.fail(function () { });
    requestLog.done(function () {
      window.location.href = "../login/login.html";
    });
  });
  //#endregion

  //#region CHAT
  let socket = io();
  function caricaChats(type) {
    switch (type) {
      case "forum":
        for (let i = 0; i < preferenze.length; i++) {
          let richiesta = inviaRichiesta("GET", "/api/GameNameById", {
            "id": preferenze[i]
          });
          richiesta.fail(function (jqXHR, test_status, str_error) {
            console.log("è qui l'errore");
            errore(jqXHR, test_status, str_error);
          });
          richiesta.done(function (data) {
            $("<li>").addClass("chat").addClass("list-group-item").prop("id", "li" + "f"+preferenze[i]).attr("indice", "f" + preferenze[i]).prop("title", data.name).addClass("d-flex").addClass("justify-content-between").addClass("align-items-center").addClass("list-group-item-primary").append(
              $("<img>").prop("src", "https://cdn.akamai.steamstatic.com/steam/apps/" + preferenze[i] + "/header.jpg")
            ).append(
              $("<p>").addClass("text-primary").text(data.name)
            ).append(
              $("<span>").addClass("bg-primary").addClass("badge").addClass("rounded-pill").prop("id", "notifyf"+preferenze[i]).addClass("notify").text(">").css("color", "white")
            ).appendTo(_chatWrapper);
          })
        }
        break;
        case "team":
          for (let i = 0; i < teams.length; i++) {
            let richiesta = inviaRichiesta("GET", "/api/teamImage", {
              "name": teams[i]
            });
            richiesta.fail(function (jqXHR, test_status, str_error) {
              console.log("è qui l'errore");
              errore(jqXHR, test_status, str_error);
            });
            richiesta.done(function (data) {
              let foto;
              foto=data[0].photo;
              if(!foto)
                foto = "https://www.shopinimizaj.com/frontend/web/images/no_images.png";
              $("<li>").addClass("chat").addClass("list-group-item").prop("id", "li" + "t"+data[0].nome).attr("indice", "t" + data[0].nome).prop("title", data[0].nome).addClass("d-flex").addClass("justify-content-between").addClass("align-items-center").addClass("list-group-item-warning").append(
                $("<img>").prop("src", foto)
              ).append(
                $("<p>").addClass("text-warning").text(data[0].nome)
              ).append(
                $("<span>").addClass("bg-warning").addClass("badge").addClass("rounded-pill").prop("id", "notifyt"+data[0].nome).addClass("notify").text(">").css("color", "white")
              ).appendTo(_chatWrapper);
            })
          }
          break;

      default:
        break;
    }
  }
  $("#chatWrapper").on("click", "li", function () {
    let nomeChat = $(this).attr("indice")
    window.location.href = "chat/chat.html?name=" + nomeChat;
  });
  socket.on('notify_message', function (data) {
    console.log(data);
    data = JSON.parse(data);
    let notify = $("#notify" + data.roomID);
    let mobileNotify = $("#mobileNotify" + data.roomID);
    if (notify.text()==">") {
      notify.text("1");
      mobileNotify.text("1");
    }
    else {
      notify.text(parseInt(notify.text()) + 1);
      mobileNotify.text(parseInt(mobileNotify.text()) + 1);
    }
    showNotify("Message", data.roomName, data.from, data.message);
  });
  $(".legenda").on("click", function () {
    if(!$(this).hasClass("active")){
      _chatWrapper.empty();
      let type = $(this).attr("type");
      console.log(type);
      caricaChats(type);
      $(".legenda").removeClass("active");
      $(this).addClass("active");
    }

  })
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
            let _wrapper = $("<div>").addClass("chatMini").prop("indice", rooms[i].id).addClass(rooms[i].type).appendTo(_mobileWrapper);
            $("<div>").addClass("chatImgMobile").prop("align", "left").append($("<div>").addClass("littleImgProfile")).appendTo(_wrapper);
            let _textArea = $("<div>").addClass("chatTextAreaMobile").prop("align", "left").appendTo(_wrapper);
            $("<strong>").text(rooms[i].name).appendTo(_textArea);
            $("<div>").addClass("notify").addClass("hidden").css({ "display": "inline-block", "left": "90%" }).prop("id", "mobileNotify" + rooms[i].id).appendTo(_wrapper);
          }
          break;
        case "colNewsMobile":
          let testo;
          let i = 0;
          $("<br>").appendTo(_mobileWrapper);
          for (let item of datiNews) {
            testo = item["contents"];
            if (!testo.includes("{STEAM_CLAN_IMAGE}")) {
              testo = testo.replaceAll('[', '<');
              testo = testo.replaceAll(']', '>');
              let _wrapper = $("<div>").addClass("news").appendTo(_mobileWrapper);
              $("<div>").addClass("rowNewsHead").append($("<div>").addClass("newsHead")).appendTo(_wrapper);
              $("<div>").addClass("newsBody").append($("<h2>").addClass("newsTitle").on("click", showNews).prop("id", "titleMobile" + i).text(item["title"])).append($("<br>")).append($("<p>").hide().addClass("newsContent").prop("id", "contentMobile" + i).prop("vis", false).html(testo)).appendTo(_wrapper).append($("<br>")).append(
                $("<div>").addClass("newsFooter").addClass("row").append($("<div>").addClass("col-lg-6").addClass("d-none").addClass("d-lg-block")).append($("<div>").addClass("col-lg-6").addClass("col-md-12").text("Author: " + item["author"])));
              i++;
            }
          }
          break;
      }
    }
  })
  //#endregion

  //#region TRASH
  /************************************************************************************************************************************************************ */
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

  function showNotify(type, title, from, content) {
    _notifica.animate({ "top": "10px" }, 800);
    setTimeout(function () {
      _notifica.animate({ "top": "-130px" }, 800);
    }, 2800)
    $("#notifyType").text(type);
    $("#notifyTitle").text(title);
    let span = $("<span class='notifyFrom'>" + from + "</span>");
    $("#notifyContent").html(span);
    $("#notifyContent").html($("#notifyContent").html() + ":&nbsp" + content);
  }

  function popupPreferenze() {
    _imgs = $("#defPref img");
    $('#myModal').modal('show');
    $("#defPref").show(500);
    let titoli = ["Tom Clancy's Rainbow Six Siege", "Counter-Strike: Global Offensive", "FIFA 21", "Grand Theft Auto V", "Dota 2", "PLAYERUNKNOWN'S BATTLEGROUNDS", "Apex Legends", "Valheim", "Team Fortress 2", "Rust", "Football Manager 2021", "Rocket League", "ARK: Survival Evolved", "The Binding of Isaac: Rebirth", "Euro Truck Simulator 2", "Warframe", "Sid Meier's Civilization VI", "Dead by Daylight", "Destiny 2", "Among Us"]
    let idGiochi = [359550, 730, 1313860, 362003, 570, 578080, 1172470, 892970, 440, 980030, 1263850, 252950, 346110, 250900, 227300, 230410, 289070, 381210, 1085660, 945360]
    for (let i = 0; i < _imgs.length; i++) {
      $(_imgs[i]).prop("title", titoli[i]).prop("id", idGiochi[i]).prop("index", idGiochi[i]).removeClass("selected").addClass("nselected").on("click", selezionaFoto).prop("opacity", "true");
    }

    $("#btnSave").on("click", save).prop("disabled", "true");
    $("#btnRipristina").on("click", ripristina);
    $("#txtSearch").on("keyup", ricerca);
  }

  function selezionaFoto() {
    if ($(this).prop("opacity") == "true") {
      preferenze.push($(this).prop("id"));
      $(this).removeClass("nselected").addClass("selected").prop("opacity", "false");
      aggiungiPreferenza($(this))
    }
    else {
      let index = preferenze.findIndex((item) => {
        item == $(this).prop("id");
      });
      preferenze.splice(index, 1);
      $(this).removeClass("selected").addClass("nselected").prop("opacity", "true");
      removePreference($(this).prop("id"));
    }

    if (preferenze.length == 0)
      $("#btnSave").prop("disabled", "true");
    else
      $("#btnSave").removeAttr("disabled");
  }

  function aggiungiPreferenza(element) {
    $("<li>").addClass("list-group-item").addClass("d-flex").addClass("justify-content-between").prop("id", "preference" + element.prop("index")).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
      $("<img>").prop("src", element.prop("src")).addClass("imgPref")
    ).append(
      $("<p>").text(element.prop("title")).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
    ).append(
      $("<button>").addClass("btn").addClass("btn-danger").addClass("removeNode").prop("index", element.prop("index")).addClass("badge").addClass("rounded-pill").text("X")
    ).appendTo(_wrapperPreferences);
  }

  function removePreference(id) {
    $("#preference" + id).remove();
  }
  
  function save() {
    if (preferenze.length > 0) {
      console.log(preferenze);
      let request = inviaRichiesta("GET", "/api/salvaPreferenze", { "preferenze": preferenze });
      request.fail(errore);
      request.done(function (data) {
        window.location.reload();
      });
    }
  }

  function ripristina() {
    for (let img of _imgs) {
      $(img).removeClass("selected").addClass("nselected").prop("opacity", "true");
      preferenze.splice(0, preferenze.length);
    }
    $("#txtSearch").val("");
    ricerca();
    _wrapperPreferences.empty();
    $("#btnSave").prop("disabled", "true");
  }

  function ricerca() {
    clearTimeout(timeoutPreference);
    let testo = $(this).val();
    timeoutPreference = setTimeout(function () {
      console.log(testo);

      if (testo != "" && testo != undefined) {
        $("#defPref").hide(500);
        $("#divResults").show(500);
        let request = inviaRichiesta("GET", "/api/elencoGiochi", { "testo": testo });
        request.fail(errore);
        request.done(function (data) {
          console.log(data);
          divResults.empty();

          if (data.length == 0) {
            $("<strong>").html("Nessun gioco trovato.").appendTo(divResults);
          }
          else {
            let table = $("<table>").addClass("table").appendTo(divResults);
            let tbody = $("<tbody>").appendTo(table);
            for (let i = 0; i < data.length; i++) {
              let tr = $("<tr>").appendTo(tbody);
              let foto = "https://cdn.akamai.steamstatic.com/steam/apps/" + data[i]["id"] + "/header.jpg"
              let thereIs = preferenze.includes(data[i]["id"].toString());
              let th = $("<th>").addClass(foto == "" ? "disabled" : "").addClass(thereIs ? "" : "preference").css({ "cursor": thereIs ? "auto" : "pointer" }).prop("index", data[i]["id"]).css({ "background-color": thereIs ? "#9dccff" : "white" }).prop("scope", "row").prop("src", foto).prop("title", data[i]["name"]).append($("<p>").css({ "display": "inline-block" }).html(data[i]["name"])).append(
                $("<img>").prop("src", foto).css({ "height": "50px", "float": "right" })
              ).appendTo(tr).on("click", function () {
                let idGiochi = [359550, 730, 1313860, 362003, 570, 578080, 1172470, 892970, 440, 980030, 1263850, 252950, 346110, 250900, 227300, 230410, 289070, 381210, 1085660, 945360];
                console.log($("#game" + $(this).prop("index")));

                if ($(this).hasClass("disabled")) {

                }
                else if (!preferenze.includes($(this).prop("index").toString())) {
                  if (idGiochi.includes(parseInt($(this).prop("index"))))
                    $("#" + $(this).prop("index")).removeClass("nselected").addClass("selected").prop("opacity", "false");

                  preferenze.push($(this).prop("index").toString());
                  aggiungiPreferenza($(this));
                  divResults.empty();
                  $("#divResults").hide(500);
                  $("#defPref").show(500);
                  $("#txtSearch").val("");

                  if (preferenze.length == 0)
                    $("#btnSave").prop("disabled", "true");
                  else
                    $("#btnSave").removeAttr("disabled");
                }
                else {
                  let ind = $(this).prop("index");
                  let boh = document.getElementById("preference" + ind);
                  $(boh).animate({ opacity: 0.40, "border-color": "lightgreen" }, "slow", function () {
                    $(boh).animate({ opacity: 1, "border-color": "auto" }, "slow");
                  });
                }

              });;
            }
          }
        });
      }
      else {
        $("#divResults").empty();
        $("#divResults").hide(500);
        $("#defPref").show(500);
      }
    }, 700);

  }

  function changePage(index){
    //main page management
    if(index==0){
      $("#iframe_index").show().removeClass('hidden');
    }
    else{
      $("#iframe_index").hide().addClass('hidden');
    }

    //other pages management
    var aIframePages=$('.container-fluid .page_frame');
    for (var i=0;i< aIframePages.length;i++){
      if(i+1==index){
        $(aIframePages[i]).show().removeClass('hidden');
      }
      else{
        $(aIframePages[i]).hide().addClass('hidden');
      }
    }
  }

  // function findPhoto(id) {
  //   let retVal = "";
  //   let request = inviaRichiesta("get", "/api/getGameDetails", "idGame=" + id, false);
  //   request.fail(errore)
  //   request.done(function (data) {
  //     if (data != "\u001f�\b\u0000\u0000\u0000\u0000\u0000\u0000\u0003�+��\u0001\u0000O��%\u0004\u0000\u0000\u0000") {
  //       data = JSON.parse(data);
  //       console.log(data[id]);
  //       try {
  //         if (data[id].success == true) {
  //           if (data[id].data.type == "game") {
  //             // let req = inviaRichiesta("get", "/api/updateGamePhoto", { "idGame": id, "photo": data[id]["data"]["header_image"] }, false)

  //             // req.fail(errore);
  //             // req.done(function () { retVal = data[id]["data"]["header_image"].toString(); })
  //           }
  //           else {
  //             let req = inviaRichiesta("get", "/api/deleteGameFromMongo", { "idGame": id }, true)
  //             req.fail(errore);
  //             req.done(function (data) { console.log("deleted: " + id) })
  //           }
  //         }
  //         else {
  //           let req = inviaRichiesta("get", "/api/deleteGameFromMongo", { "idGame": id }, true)
  //           req.fail(errore);
  //           req.done(function (data) { console.log("deleted: " + id) })
  //         }
  //       }
  //       catch (error) {
  //         console.log(error.status + "-" + error.message)
  //         let req = inviaRichiesta("get", "/api/deleteGameFromMongo", { "idGame": id }, true)
  //         req.fail(errore);
  //         req.done(function (data) { console.log("deleted: " + id) })
  //       }
  //     }
  //     else
  //       retVal = "blocked";
  //   });
  //   return retVal;
  // }
  _aPageButtons.on("click", function () {
    let page = parseInt($(this).attr("page"));
    changePage(page);
  });

  _wrapperPreferences.on("click", 'button', function () {
    let id = $(this).prop("index");
    let index = preferenze.findIndex((item) => {
      item == id;
    });
    preferenze.splice(index, 1);
    removePreference(id);
    $("#" + id).removeClass("selected").addClass("nselected").prop("opacity", "true");
    if (preferenze.length == 0)
      $("#btnSave").prop("disabled", "true");
  });
  _viewAllTournaments.on('click',function(){
    changePage(3);
  });
  //#endregion
})