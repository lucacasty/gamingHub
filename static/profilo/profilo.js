"use strict"

$(document).ready(function () {
  let currentUser;
  let _colsMobile = $(".colHeadMini");
  let currentMail;
  let datiPersonali;
  let _imgs;
  let timeoutPreference;
  let preferenze = [];
  let _wrapperPreferences = $("#listPreferences");
  let divResults = $("#divResults");
  let _listUtente = $("#list_utente");
  let _wrapperButtons = $("#wrapperButtonsList");
  let imgPath="";



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
    caricaDatiPersonali();
  });

  setTimeout(function () { test(); });
  //#endregion


  $("#txtEmail").on("keyup", function () {
    $("#saveChanges").removeAttr("disabled");
  });

  $("#saveChanges").on("click", function () {
    currentMail = datiPersonali["mail"];
    if ($("#txtEmail").val() != currentMail && checkEmail($("#txtEmail").val())) {
      let richiesta = inviaRichiesta("GET", "/api/uploadCambiamenti",
        {
          "username": datiPersonali["username"],
          "newmail": $("#txtEmail").val()
        });
      richiesta.fail(function (jqXHR, test_status, str_error) {
        errore(jqXHR, test_status, str_error);
      });
      richiesta.done(function (data) {
        currentMail = $("#txtEmail").val();
        $("#saveChanges").prop("disabled", "disabled");
        caricaDatiPersonali();
      });
    }
  });

  $("#gestionePref").on("click", function () {
    let reqPrefe = inviaRichiesta("POST", "/api/controlloPreferenze", {
      "username": currentUser
    });
    reqPrefe.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    reqPrefe.done(function (data) {
      console.log(data["preferenze"]);
      preferenze = data["preferenze"];
      _wrapperPreferences.empty();
      for (let i = 0; i < preferenze.length; i++) {
        let reqPrefe = inviaRichiesta("GET", "/api/GameNameById", {
          "id": preferenze[i]
        });
        reqPrefe.fail(function (jqXHR, test_status, str_error) {
          errore(jqXHR, test_status, str_error);
        });
        reqPrefe.done(function (data) {
          $("#" + preferenze[i]).removeClass("nselected").addClass("selected").prop("opacity", "false");
          $("<li>").addClass("list-group-item").addClass("d-flex").addClass("justify-content-between").prop("id", "preferencepopup" + preferenze[i]).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
            $("<img>").prop("src", "https://cdn.akamai.steamstatic.com/steam/apps/" + preferenze[i] + "/header.jpg").addClass("imgPref")
          ).append(
            $("<p>").text(data["name"]).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
          ).append(
            $("<button>").addClass("btn").addClass("btn-danger").addClass("removeNode").prop("index", preferenze[i]).addClass("badge").addClass("rounded-pill").text("X")
          ).appendTo(_wrapperPreferences);
        });

      }
      popupPreferenze();
    })
  });

  $("#inputGroupFile").on("change", function() {
    readURL(this);
  });

  $("#btnModFoto").on("click",function(){

    if(imgPath!="")
    {
      $("<div>").prop("id", "divGif").appendTo($("#modalBody").css("display", "block"));
      $("<img>").prop("id", "imgGif").css({ "width": "120px", "height": "120px", "padding": "0" }).prop("src", "https://www.steadymd.com/wp-content/plugins/portfolio-filter-gallery//img/loading-icon.gif").appendTo($("#divGif"));
      setTimeout(function () {
      }, 2000000000000000000000000);
      let req= inviaRichiesta("POST","/api/caricaFoto",{"path":imgPath});
      req.fail(errore);
      req.done(function(data){
        let request = inviaRichiesta("GET","/api/updatePhotoUser",{"foto":data["ris"]});
        request.fail(errore);
        request.done(function(data){
          window.location.href="profilo.html";
        });
      });
    }
  });

  $("#btnModifica").on("click", function () {
    $('#myModal').modal('show');
  });
  $("#defPref").on("click", "img", selezionaFoto);
  $("#btnModPrefe").on("click", function () {
    modificaPrefe();
  });

  $("#btnModPwd").on("click", function () {
    $('#modalPwd').modal('show');
  });

  $("#txtOldPwd").on("keyup", function () {
    if ($("#txtOldPwd").val() != "" && $("#txtNewPwd").val() != "" && $("#txtNewPwdRepeat").val() != ""
      && $("#txtNewPwd").val() == $("#txtNewPwdRepeat").val())
      $("#btnConferma").removeAttr("disabled");
    else
      $("#btnConferma").prop("disabled", "disabled");
  });

  $("#txtNewPwd").on("keyup", function () {
    if ($("#txtOldPwd").val() != "" && $("#txtNewPwd").val() != "" && $("#txtNewPwdRepeat").val() != ""
      && $("#txtNewPwd").val() == $("#txtNewPwdRepeat").val())
      $("#btnConferma").removeAttr("disabled");
    else
      $("#btnConferma").prop("disabled", "disabled");
  });

  $("#txtNewPwdRepeat").on("keyup", function () {
    if ($("#txtOldPwd").val() != "" && $("#txtNewPwd").val() != "" && $("#txtNewPwdRepeat").val() != ""
      && $("#txtNewPwd").val() == $("#txtNewPwdRepeat").val())
      $("#btnConferma").removeAttr("disabled");
    else
      $("#btnConferma").prop("disabled", "disabled");
  });

  $("#btnChiudiMod").on("click", function () {
    $('#myModal').modal('hide');
  });

  $("#btnChiudiPwd").on("click", function () {
    $('#modalPwd').modal('hide');
  });

  $("#btnConferma").on("click", function () {
    let request = inviaRichiesta("POST", "/api/cambioPwd", {
      "username": currentUser,
      "oldPwd": $("#txtOldPwd").val(),
      "newPwd": $("#txtNewPwd").val()
    });
    request.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    request.done(function (data) {
      if (data.ris == "nok")
        $("#lblErrore").text("Password sbagliata").css("color", "red");
      else {
        $('#modalPwd').modal('hide');
        $("#lblErrore").empty();
      }
      $("#txtOldPwd").val("");
      $("#txtNewPwd").val("");
      $("#txtNewPwdRepeat").val("");
    });
  });

  $("#fotoProfilo").on("change", function () {
    let files = $("#fotoProfilo").prop("files");
    if (files != null) {
      let formData = new FormData();
      formData.append("elencoFiles", files[0]);

      // CLOUDINARY
      /*let request = inviaRichiestaMultipart("POST", "/api/upload", formData)
      request.fail(errore);
      request.done(function (data) {
        console.log(data);
          caricaFoto(data);
      })*/

    }

  });

  _wrapperPreferences.on("click", 'button', function () {
    let id = $(this).prop("index");
    let index = preferenze.findIndex((item) => {
      return item == id;
    });
    preferenze.splice(index, 1);
    removePreference(id);
    $("#" + id).removeClass("selected").addClass("nselected").prop("opacity", "true");
    if (preferenze.length == 0)
      $("#btnSave").prop("disabled", "true");
  })
  _wrapperButtons.on("click", "a", function () {
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
        default:
          break;
      }
    }
  })

  //#region LOGOUT
  $("#btnLogout").on("click", function () {
    let requestLog = inviaRichiesta("GET", "/api/logout");
    requestLog.fail(function () { });
    requestLog.done(function () {
      window.location.href = "../login/login.html";
    });
  });
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
  function caricaDatiPersonali() {
    let reqPrefe = inviaRichiesta("GET", "/api/datiPersonali", {
      "username": currentUser
    });
    reqPrefe.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    reqPrefe.done(function (data) {
      console.log(data);
      let foto = data.imgProfilo;
      $("#saveChanges").prop("disabled", "disabled");
      $("#txtUsername").text(data["username"]);
      $("#txtEmail").text(data["mail"]);
      let dob = data["dataNascita"].split("-");
      $("#txtDob").text(dob[2] + "/" + dob[1] + "/" + dob[0]);
      if (foto)
        $("#imgProfilo").prop("src", foto);
      datiPersonali = data;
      creazioneLi("preferenze");
    });
  }

  function selezionaFoto() {
    if ($(this).prop("opacity") == "true") {
      preferenze.push($(this).prop("index"));
      $(this).removeClass("nselected").addClass("selected").prop("opacity", "false");
      aggiungiPreferenza($(this))
    }
    else {
      let index = preferenze.findIndex((item) => {
        return item == $(this).prop("index");
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
    $("<li>").addClass("list-group-item").addClass("d-flex").addClass("justify-content-between").prop("id", "preferencepopup" + element.prop("index")).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
      $("<img>").prop("src", element.prop("src")).addClass("imgPref")
    ).append(
      $("<p>").text(element.prop("title")).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
    ).append(
      $("<button>").addClass("btn").addClass("btn-danger").addClass("removeNode").prop("index", element.prop("index")).addClass("badge").addClass("rounded-pill").text("X")
    ).appendTo(_wrapperPreferences);
  }

  function removePreference(id) {
    $("#preferencepopup" + id).remove();
  }

  function popupPreferenze() {
    _imgs = $("#defPref img");
    $('#ModalPreferenze').modal('show');
    $("#defPref").show(500);
    let titoli = ["Tom Clancy's Rainbow Six Siege", "Counter-Strike: Global Offensive", "FIFA 21", "Grand Theft Auto V", "Dota 2", "PLAYERUNKNOWN'S BATTLEGROUNDS", "Apex Legends", "Valheim", "Team Fortress 2", "Rust", "Football Manager 2021", "Rocket League", "ARK: Survival Evolved", "The Binding of Isaac: Rebirth", "Euro Truck Simulator 2", "Warframe", "Sid Meier's Civilization VI", "Dead by Daylight", "Destiny 2", "Among Us"]
    let idGiochi = [359550, 730, 1313860, 362003, 570, 578080, 1172470, 892970, 440, 980030, 1263850, 252950, 346110, 250900, 227300, 230410, 289070, 381210, 1085660, 945360]
    for (let i = 0; i < _imgs.length; i++) {
      $(_imgs[i]).prop("title", titoli[i]).prop("id", idGiochi[i]).prop("index", idGiochi[i]).removeClass("selected").addClass("nselected").prop("opacity", "true");
    }
    if (preferenze.length > 0)
      $("#btnSave").removeAttr("disabled");
    else
      $("#btnSave").attr("disabled", "true");
  }

  $("#btnRipristina").on("click", ripristina);
  $("#txtSearch").on("keyup", ricerca);
  $("#btnSave").on("click", save);

  function save() {
    console.log("saved");
    if (preferenze.length > 0) {

      console.log(preferenze);
      let request = inviaRichiesta("GET", "/api/salvaPreferenze", { "preferenze": preferenze });
      request.fail(errore);
      request.done(function (data) {
        datiPersonali["preferenze"] = preferenze;
        creazioneLi("preferenze");
      });
    }
  }

  function ripristina() {
    preferenze = [];
    for (let img of _imgs) {
      $(img).removeClass("selected").addClass("nselected").prop("opacity", "true");
      preferenze.splice(0, preferenze.length);
    }
    $("#txtSearch").val("");
    _wrapperPreferences.empty();
    $("#btnSave").prop("disabled", "true");
  }

  function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#imgProfile').attr('src', e.target.result);
            console.log(e.target.result);
            imgPath=e.target.result;
        }

        reader.readAsDataURL(input.files[0]);
    }
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
            $("<strong>").html("No game found.").appendTo(divResults);
          }
          else {
            let table = $("<table>").addClass("table").appendTo(divResults);
            let tbody = $("<tbody>").appendTo(table);
            for (let i = 0; i < data.length; i++) {
              let tr = $("<tr>").appendTo(tbody);
              let foto = "https://cdn.akamai.steamstatic.com/steam/apps/" + data[i]["id"] + "/header.jpg"

              if (!foto) {
                console.log("ciao");
              }
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

  function popupCambioPwd() {
    $("#txtOldPwd").val("");
    $("#txtNewPwd").val("");
    $("#txtNewPwdRepeat").val("");
    $('#myModal').modal('show');

    $("#btnConferma").on("click", cambiaPwd);
  }

  function creazioneLi(selected) {
    $("#list_utente").empty();
    if(selected=="preferenze"){
      for (let item of datiPersonali[selected]) {
        let richiesta = inviaRichiesta("GET", "/api/GameNameById", { "id": item });
        richiesta.fail(function (jqXHR, test_status, str_error) {
          errore(jqXHR, test_status, str_error);
        });
        richiesta.done(function (data) {
          $("<li>").addClass("list-group-item").prop("title", data.name).addClass("d-flex").addClass("list-group-item list-group-item-primary d-flex justify-content-between align-items-center").prop("id", "preference" + data.id).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
            $("<img>").prop("src", "https://cdn.akamai.steamstatic.com/steam/apps/" + data.id + "/header.jpg")
          ).append(
            $("<p>").text(data.name).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
          ).appendTo($("#list_utente"));
        })
      }
    }
    else if(selected=="team"){
      for (let item of datiPersonali[selected]) {
        let richiesta = inviaRichiesta("GET", "/api/teamImage", { "name": item });
        richiesta.fail(function (jqXHR, test_status, str_error) {
          errore(jqXHR, test_status, str_error);
        });
        richiesta.done(function (data) {
          let foto;
          foto=data[0].photo;
          if(!foto)
            foto="https://www.shopinimizaj.com/frontend/web/images/no_images.png";
          let listItem=$("<li>").addClass("list-group-item").prop("title", data[0].nome).addClass("d-flex").addClass("list-group-item list-group-item-warning d-flex justify-content-between align-items-center").prop("id", "preference" + data.id).css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
            $("<img>").prop("src", foto)
          ).append(
            $("<p>").text(data[0].nome).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
          ).appendTo($("#list_utente")).on("click",function(){
            window.location = "../team/team.html?name="+data[0].nome;
          });
          $("<img>").addClass("imgPref").prop("src", data[0].founder==currentUser ? "https://cdn.iconscout.com/icon/free/png-512/crown-412-910303.png" : "https://lh3.googleusercontent.com/proxy/TwrGgAlbkWx93YT1qORvgMyv0CnYYzIdTTdCzs2IYvjgdizIIGxOHC_0Q8pQeALyVYlaBKUnSCF7ro-p1Bg4vSOn89knloaYGK62JJ4BqmiOjCqZmsXDSYx8DSsvUg").appendTo(listItem);
        })
      }
    }
  }
  function cambiaPwd() {
    let richiesta = inviaRichiesta("POST", "/api/cambioPwd", {
      "username": currentUser,
      "oldPwd": $("#txtOldPwd").val(),
      "newPwd": $("#txtNewPwdRepeat").val()
    });
    richiesta.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    richiesta.done(function (data) {
      $("#lblErrore").html("");
      if (data.ris == "nok") {
        $("<p>").html("La password vecchia non corrisponde. Riprovare.").css({ "color": "red", "margin": "2%" }).appendTo($("#lblErrore"));
        $("#txtOldPwd").val("");
        $("#txtNewPwd").val("");
        $("#txtNewPwdRepeat").val("");
        $("#btnConferma").prop("disabled", "disabled");
      }
      else if (data.ris == "ok")
        $('#myModal').modal('hide');
    });
  }

  function validaEmail(email) {
    var regexp = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
    return regexp.test(email);
  }

  function checkEmail(email) {
    if (validaEmail(email))
      return true;
    else
      return false;
  }

  function caricaFoto(foto) {

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