"use strict"

$(document).ready(function () {
  let _wrapperMessages = $("#wrapperMessages");
  let _chatWrapper = $("#colChatDesktop");
  let _txtTitle = $("#txtTitle");
  let _notifica = $("#notifica");
  let _mobileWrapper = $("#colBodyMobile");
  let _colsMobile = $(".colHeadMini");
  let datiNews;
  let currentUser;
  let completeUser;
  let currentRoom = null;
  let myIndexSock;
  let rooms = [];
  let preferenze = [];
  let teams = [];
  let param;
  let done = 0;

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
    let reqPrefe = inviaRichiesta("POST", "/api/controlloPreferenze", {
      "username": currentUser
    });
    reqPrefe.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    reqPrefe.done(function (data) {
      if (data["preferenze"].length == 0) {
        popupPreferenze();
      }
      else {
        for (let index = 0; index < data["preferenze"].length; index++) {
          preferenze.push(parseInt(data["preferenze"][index]))
        }
        teams = data["team"];
        param = getUrlParameter("name");
        if (!param)
          caricaChats("forum");
        else {
          switch (param[0]) {
            case "f":
              $("#legForum").trigger("click");
              break;
            case "t":
              $("#legTeam").trigger("click");
              break;
            default:
              break;
          }
          setTimeout(function(){
            let id = "li" + param.replace(/\s+/g, '').trim();
            let currentChat = $("#" + id)
            currentChat.trigger("click");
          },1500);
        }
      }
    });
  });

  param = getUrlParameter("name");
  setTimeout(function () { test(); });
  //#endregion

  //#region CHAT
  let socket = io();
  socket.on("myindex", function (ind) {
    myIndexSock = ind;
  });
  function caricaChats(type) {
    switch (type) {
      case "forum":
        for (let i = 0; i < preferenze.length; i++) {
          let richiesta = inviaRichiesta("GET", "/api/GameNameById", {
            "id": preferenze[i]
          }, true, finito);
          richiesta.fail(function (jqXHR, test_status, str_error) {
            console.log("è qui l'errore");
            errore(jqXHR, test_status, str_error);
          });
          richiesta.done(function (data) {
            $("<li>").addClass("chat").addClass("list-group-item").prop("id", "li" + "f" + preferenze[i]).attr("indice", "f" + preferenze[i]).on("click", changeChosenChat).prop("title", data.name).addClass("d-flex").addClass("justify-content-between").addClass("align-items-center").addClass("list-group-item-primary").append(
              $("<img>").prop("src", "https://cdn.akamai.steamstatic.com/steam/apps/" + preferenze[i] + "/header.jpg")
            ).append(
              $("<p>").addClass("text-primary").text(data.name)
            ).append(
              $("<span>").addClass("bg-primary").addClass("badge").addClass("rounded-pill").prop("id", "notifyf" + preferenze[i]).addClass("notify").text(">").css("color", "white")
            ).appendTo(_chatWrapper);
          })
        }
        break;
      case "team":
        for (let i = 0; i < teams.length; i++) {
          let richiesta = inviaRichiesta("GET", "/api/teamImage", {
            "name": teams[i]
          }, true, finito);
          richiesta.fail(function (jqXHR, test_status, str_error) {
            console.log("è qui l'errore");
            errore(jqXHR, test_status, str_error);
          });
          richiesta.done(function (data) {
            let foto;
            foto = data[0].photo;
            if (!foto)
              foto = "https://www.shopinimizaj.com/frontend/web/images/no_images.png";
            $("<li>").addClass("chat").addClass("list-group-item").prop("id", "li" + "t" + (data[0].nome.replace(/\s+/g, '').trim())).attr("indice", "t" + data[0].nome).on("click", changeChosenChat).prop("title", data[0].nome).addClass("d-flex").addClass("justify-content-between").addClass("align-items-center").addClass("list-group-item-warning").append(
              $("<img>").prop("src", foto)
            ).append(
              $("<p>").addClass("text-warning").text(data[0].nome)
            ).append(
              $("<span>").addClass("bg-warning").addClass("badge").addClass("rounded-pill").prop("id", "notifyt" + data[0].nome).addClass("notify").text(">").css("color", "white")
            ).appendTo(_chatWrapper);
          })
        }
        break;

      default:
        break;
    }
  }
  // 2) invio mesaggio
  $("#btnInvia").click(function () {
    if (currentRoom != null) {
      let msg = $("#txtMessaggio").val() + "#@//£" + currentRoom + "#@//£" + myIndexSock + "#@//£" + _txtTitle.text();
      socket.emit("message", msg);
      $("#txtMessaggio").val("");
    }
  });

  socket.on('Error', function (data) {
    alert(data);
  });
  socket.on('notify_message', function (data) {
    data = JSON.parse(data);
    if (data.roomID == currentRoom) {
      visualizza(data.from, data.message, data.date)
    }
    else {
      let notify = $("#notify" + data.roomID);
      if (notify.text() == ">") {
        notify.text("1");
      }
      else {
        notify.text(parseInt(notify.text()) + 1);
      }
      _notifica.animate({ "top": "10px" }, 800);

      showNotify("Message", data.roomName, data.from, data.message);
    }
  });
  function visualizza(username, message, date) {
    let container;
    if (username == currentUser)
      container = $("<div class='message-container-user'></div>");
    else {
      container = $("<div class='message-container-friend'></div>");
      let mittente = $("<strong class='message-from'>" + username + "</strong><br>");
      mittente.appendTo(container);
    }

    container.appendTo(_wrapperMessages);

    date = new Date(date);

    let strong = $("<strong>").appendTo(container);
    message = $("<p class='message-data'>" + message + "</p>");
    message.appendTo(strong);
    $("<small class='message-date'>" + date.toLocaleString() + "</small>").appendTo(container);
    let h = _wrapperMessages.prop("scrollHeight");
    _wrapperMessages.prop("scrollTop", h);
  }

  function changeChosenChat() {
    if (!$(this).hasClass("currentRoom")) {
      _wrapperMessages.empty();
      $(".chat").removeClass("currentRoom");
      $(this).addClass("currentRoom");
      currentRoom = $(this).attr("indice");
      $("#imgProfile").css({"background-image":"url("+$(this).children(":first").prop("src")+")"})
      _txtTitle.text($(this).prop("title"));
      $("#notify" + currentRoom).text(">");
      console.log(currentRoom);
      let requestMex = inviaRichiesta("POST", "/api/caricaMex", { "room": currentRoom });
      requestMex.fail(errore);
      requestMex.done(function (data) {
        console.log(data);
        if (data.messages) {
          _wrapperMessages.append($("<br>"));
          for (let item of data.messages) {
            visualizza(item.from, item.message, item.date);
          }
        }
      })
    }
  }
  $(".legenda").on("click", function () {
    if (!$(this).hasClass("active")) {
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
  function showNotify(type, title, from, content) {
    _notifica.animate({ "top": "10px" }, 650);
    setTimeout(function () {
      _notifica.animate({ "top": "-130px" }, 650);
    }, 2800)
    $("#notifyType").text(type);
    $("#notifyTitle").text(title);
    let span = $("<span class='notifyFrom'>" + from + "</span>");
    $("#notifyContent").html(span);
    $("#notifyContent").html($("#notifyContent").html() + ":&nbsp" + content);
  }

  function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    console.log(results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' ')));
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };
  function finito() {
    // done++;
    // if (done == preferenze.length) {
    //   if (param != "") {
    //     let id = "li" + param;
    //     let currentChat = $("#" + id)
    //     currentChat.trigger("click");
    //   }
    // }
  }
  //#endregion
})