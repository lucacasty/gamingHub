"use strict"

$(document).ready(function () {
  let _wrapperMessages = $("#wrapperMessages");
  let _chatWrapperDesktop = $("#colChatDesktop");
  let _txtTitle = $("#txtTitle");
  let _notifica = $("#notifica");
  let _mobileWrapper = $("#colBodyMobile");
  let _colsMobile = $(".colHeadMini");
  let datiNews;
  let currentUser;
  let currentRoom = null;
  let myIndexSock;
  let listaNews = [];
  let rooms = [];
  let preferenze;
  let contNews = 0;
  let skippedNews = 0;

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
    getPreferences();
  });

  setTimeout(function () { test(); });
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
  function getPreferences() {
    let reqPrefe = inviaRichiesta("POST", "/api/controlloPreferenze", {
      "username": currentUser
    });
    reqPrefe.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    reqPrefe.done(function (data) {
      preferenze = data["preferenze"];
      creaNotizie();
      getAllNews();
      $("#rowHead").children("div").children("h1").on("click", getAllNews);
    });
  }

  function getAllNews() {
    $("#allNews").html("");
    skippedNews = 0;
    for (let i = 0; i < preferenze.length; i++) {
      caricaNews(preferenze[i], 5, skippedNews);
    }
    appendNews();
  }

  function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    console.log(results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' ')));
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  function creaNotizie() {
    for (let i = 0; i < preferenze.length; i++) {
      let richiesta = inviaRichiesta("GET", "/api/GameNameById", {
        "id": preferenze[i]
      });
      richiesta.fail(function (jqXHR, test_status, str_error) {
        console.log("è qui l'errore");
        errore(jqXHR, test_status, str_error);
      });
      richiesta.done(function (data) {
        $("<li>").addClass("list-group-item").prop("title",data.name).addClass("d-flex").addClass("justify-content-beetween").prop("id", "preference" + data.id).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
          $("<img>").prop("src", "https://cdn.akamai.steamstatic.com/steam/apps/" + data.id + "/header.jpg").addClass("imgPref")
        ).append(
          $("<p>").text(data.name).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
        ).appendTo($("#colNewsDesktop")).on("click", function () {
          controllaActive($(this), data);
        });
      })
    }
  }

  function controllaActive(sender, oldData) {
    clearWrapper();
    if (sender.hasClass("active")) {
      sender.removeClass("active");
      getAllNews();
    }
    else {
      let lis = $(".list-group-item");
      for (let i = 0; i < lis.length; i++) {
        if ($(lis[i]).hasClass("active"))
          $(lis[i]).removeClass("active");
      }
      sender.addClass("active");
      caricaNews(oldData["id"], 20, skippedNews);
      appendNews();
    }
  }
  function clearWrapper() {
    $("#allNews").empty();
    contNews = 0;
    listaNews = [];
    skippedNews = 0;
    setTimeout(function () { }, 3000);
  }
  function appendNews() {
    listaNews = listaNews.sort((a, b) => b.date - a.date);
    for (let i = 0; i < listaNews.length; i++) {
      if (preferenze.includes(listaNews[i].appid.toString())) {
        let item = listaNews[i];
        let gameImage = "https://cdn.akamai.steamstatic.com/steam/apps/" + listaNews[i].appid + "/header.jpg";
        let testo = item["contents"];
        let milliseconds = parseInt(item["date"] + "000");
        let dateOfNews = new Date(milliseconds);
        dateOfNews = dateOfNews.toLocaleDateString();
        if (!testo.includes("{STEAM_CLAN_IMAGE}")) {
          let _wrapper = $("<div>").addClass("news").appendTo($("#allNews"));
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
    $("<button>").addClass("btn").addClass("btn-success").addClass("badge").css({ "width": "60px", "height": "60px", "font-size":"large", "position":"relative","top":"-20px"}).addClass("rounded-pill").text("V").appendTo("#allNews").on("click", getOtherNews);
  }
  function showNews() {
    let id = this.getAttribute("id").substr(5);
    let currentNews = $("#content" + id);
    if (!currentNews.prop("vis"))
      currentNews.show(500, "linear").prop("vis", true);
    else
      currentNews.hide(500, "linear").prop("vis", false);
  }
  function getOtherNews() {
    let active = false;
    let id;
    let lis = $(".list-group-item");
    for (let i = 0; i < lis.length; i++) {
      if ($(lis[i]).hasClass("active")) {
        active = true;
        id=$(lis[i]).prop("id");
        break;
      }
    }
    if(active){
      id=id.substr(10,id.length);
      skippedNews+=20;
      $("#allNews").empty();
      contNews = 0;
      caricaNews(id,20,skippedNews);
      appendNews();
    }
    else{
      skippedNews+=5;
      $("#allNews").empty();
      contNews = 0;
      for (let i = 0; i < preferenze.length; i++) {
        caricaNews(preferenze[i], 5, skippedNews);
      }
      appendNews();
    }
  }
  function caricaNews(idGame, count, skip) {
    let requestNews = inviaRichiesta("get", "/api/getNewsGame", { "idGame": idGame, "count": count + skip }, false);
    requestNews.fail(errore);
    requestNews.done(function (body) {
      let data = JSON.parse(body);
      datiNews = data["appnews"]["newsitems"];
      for (let index = skip; index < datiNews.length; index++) {
        listaNews.push(datiNews[index]);
      }
    });
  }
  //#endregion
})