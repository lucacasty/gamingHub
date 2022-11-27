"use strict"

$(document).ready(function () {
  let currentUser;
  let userRichieste;
  let timeoutPreference;
  let divResults = $("#divResults");
  let elencoTeam = [];
  let membri = $("#tableMembri");
  let tornei = $("#tableTornei");
  let tbMembri = $("#tbMembri");
  let tbTornei = $("#tbTornei");
  let nomeTeam = $("#NomeTeam");
  let descrizioneTeam = $("#DescrizioneTeam");
  let divImg = $("#DivImg");
  let imgPath="";
  let imgPathCreate="";
  let param;
  let currentTeam = {
    "name": ""
  };




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
    let req = inviaRichiesta("GET", "/api/elencoTeamUser",
      {
        "username": currentUser,
      });
    req.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    req.done(function (data) {
      let req = inviaRichiesta("GET", "/api/datiPersonali",
        {
          "username": currentUser,
        });
      req.fail(function (jqXHR, test_status, str_error) {
        errore(jqXHR, test_status, str_error);
      });
      req.done(function (data) {
        userRichieste = data.richieste;
        caricaRichieste(data.richieste);
      });
      param = getUrlParameter("name");
      if (param)
        findTeam();
      console.log(data);
      elencoTeam = data;
      caricaTeam();
    });
  });




  setTimeout(function () { test(); });
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

  ////#region CONTROLLO EVENTI

  $("#txtNome").on("keyup", function () {
    if ($("#txtNome").val() != "" && $("#txtDescrizione").val() != "")
      $("#btnCrea").removeAttr("disabled");
    else
      $("#btnCrea").prop("disabled", "disabled");
  });

  $("#txtDescrizione").on("keyup", function () {
    if ($("#txtNome").val() != "" && $("#txtDescrizione").val() != "")
      $("#btnCrea").removeAttr("disabled");
    else
      $("#btnCrea").prop("disabled", "disabled");
  });

  $("#btnCrea").on("click", function () {
    $("<div>").prop("id", "divGif").appendTo($("#modalBody").css("display", "block"));
      $("<img>").prop("id", "imgGif").css({ "width": "120px", "height": "120px", "padding": "0" }).prop("src", "https://www.steadymd.com/wp-content/plugins/portfolio-filter-gallery//img/loading-icon.gif").appendTo($("#divGif"));
      setTimeout(function () {
        
      }, 2000000000000000000000000);
    if(imgPathCreate!="")
    {
      let req= inviaRichiesta("POST","/api/caricaFoto",{"path":imgPathCreate});
      req.fail(errore);
      req.done(function(data){
        let arr = [];
        let arr2 = [];
        arr[0] = currentUser;
        let request = inviaRichiesta("POST", "/api/addTeam", {
          "name": $("#txtNome").val(),
          "desc": $("#txtDescrizione").val(),
          "membri": arr,
          "tornei": arr2,
          "photo":data["ris"]
        });
        request.fail(function (jqXHR, test_status, str_error) {
          errore(jqXHR, test_status, str_error);
        });
        request.done(function (data) {
          if (data.ris == "ok")
            window.location.href = "team.html";
          else {
            $("#txtNome").val("");
            $("#lblErrore").html("Name already present, change it!").addClass("errr");
          }
        });
      });
    }
    else
    {
      let arr = [];
      let arr2 = [];
      arr[0] = currentUser;
      let request = inviaRichiesta("POST", "/api/addTeam", {
        "name": $("#txtNome").val(),
        "desc": $("#txtDescrizione").val(),
        "membri": arr,
        "tornei": arr2,
        "photo":null
      });
      request.fail(function (jqXHR, test_status, str_error) {
        errore(jqXHR, test_status, str_error);
      });
      request.done(function (data) {
        if (data.ris == "ok")
          window.location.href = "team.html";
        else {
          $("#txtNome").val("");
          $("#lblErrore").html("Name already present, change it!").addClass("errr");
        }
      });
    }
  });

  $("#inputGroupFile01").on("change", function() {
    readURLCreate(this);
  });

  $("#creaTeam").on("click", function () {
    $('#myModal').modal('show');
  });


  $("#uniscitiTeam").on("click", function () {
    $('#modalUnisciti').modal('show');
  });

  $("#btnUnisciti").on("click", function () {

  });

  $("#feat").on("click", ".team", function () {
    console.log($(this).prop("id"))
    tbTornei.empty();
    tbMembri.empty();
    VisualizzaTeam(elencoTeam[$(this).prop("id")]);
  });

  $("#txtSearch").on("keyup", ricerca);

  ////#endregion

  //#region FUNCTIONS

  function ricerca() {
    clearTimeout(timeoutPreference);
    let testo = $(this).val();
    timeoutPreference = setTimeout(function () {
      console.log(testo);

      if (testo != "" && testo != undefined) {
        $("#divResults").show(500);
        let request = inviaRichiesta("GET", "/api/elencoTeam", { "testo": testo });
        request.fail(errore);
        request.done(function (data) {
          console.log(data);
          divResults.empty();

          if (data.length == 0) {
            $("<strong>").html("Nessun team trovato.").appendTo(divResults);
          }
          else {
            let table = $("<table>").addClass("table").appendTo(divResults);
            let tbody = $("<tbody>").appendTo(table);
            for (let i = 0; i < data.length; i++) {
              let tr = $("<tr>").appendTo(tbody);
              let foto = data[i]["img"];
              if (!foto)
                foto = "default.gif";
              let th = $("<th>").css("cursor", "pointer").prop("scope", "row").prop("id", i).prop("src", foto).prop("title", data[i]["nome"]).append($("<p>").css({ "display": "inline-block" }).html(data[i]["nome"])).append(
                $("<img>").prop("src", foto).css({ "height": "50px", "float": "right" })
              ).appendTo(tr).on("click", function () {
                tbTornei.empty();
                tbMembri.empty();
                VisualizzaTeam(data[i]);
              });
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

  function caricaTeam() {
    for (let i = 0; i < elencoTeam.length; i++) {
      let foto = elencoTeam[i]["photo"];
      if (!foto)
        foto = "https://www.shopinimizaj.com/frontend/web/images/no_images.png";
      let listItem = $("<li>").addClass("list-group-item").prop("title", elencoTeam[i].nome).addClass("d-flex").addClass("justify-content-between").css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
        $("<img>").prop("src", foto)
      ).append(
        $("<p>").text(elencoTeam[i].nome).css({ " word-break": "break-all!important", "overflow-wrap": " break-word", "margin-left": "5%" })
      ).appendTo($("#sezAllTeams")).on("click", function () {
        let dat;
        elencoTeam.forEach(item => {
          if (item.nome == $(this).prop("title")) {
            dat = item;
          }
        });
        if (dat != currentTeam)
          VisualizzaTeam(dat);
      });
      $("<img>").addClass("imgPref").prop("src", currentUser == elencoTeam[i].founder ? "https://cdn.iconscout.com/icon/free/png-512/crown-412-910303.png" : "https://previews.123rf.com/images/bobrovee/bobrovee1603/bobrovee160300125/54952956-square-transparent-background-black-and-white-seamless-pattern-.jpg").appendTo(listItem);
    }
  }

  function caricaRichieste(richieste) {
    for (let i = 0; i < richieste.length; i++) {
      let listItem = $("<li>").addClass("list-group-item").prop("title", richieste[i]).addClass("d-flex").addClass("list-group-item d-flex justify-content-between align-items-center lstMembers").css({ "overflow-wrap": " break-word" }).addClass("align-items-center").append(
        $("<p>").text(richieste[i]).css({ " word-break": "break-all!important", "overflow-wrap": " break-word" })
      ).append(
        $("<div>").addClass("btn-group").prop("role", "group").append(
          $("<button>").addClass("btn btn-success").text("🗸").on("click", function () {
            currentTeam.nome = richieste[i];
            accettaRichiesta();
          })
        ).append(
          $("<button>").addClass("btn btn-danger").text("✗").on("click", function () {
            currentTeam.nome = richieste[i];
            rifiutaRichiesta();
          })
        )
      ).appendTo($("#colRichieste")).on("click", function () {
        let request = inviaRichiesta("GET", "/api/infoTeam", { "name": richieste[i] });
        request.fail(errore);
        request.done(function (data) {
          VisualizzaTeam(data);
        })
      });
    }
  }

  function VisualizzaTeam(dat) {
    $("#feat").empty();
    currentTeam = dat;
    console.log(dat);
    let foto = dat["photo"];
    if (!foto)
      foto = "https://www.shopinimizaj.com/frontend/web/images/no_images.png";
    let card = $("<div>").addClass("card").css({ "max-width": "70%", "margin": "2%" }).appendTo($("#feat"));
    if (dat["founder"] != currentUser) {
      $("<h5>").text(dat["nome"]).addClass("card-header").css({ "color": "rgb(89, 204, 60)", "font-weight": "bold", "font-size": "larger" }).appendTo(card);
    }
    else {
      $("<div>").addClass("card-header d-flex justify-content-between").append(
        $("<span>").css({ "height": "35px", "width": "35px" }).prop("src", "https://lh3.googleusercontent.com/proxy/TwrGgAlbkWx93YT1qORvgMyv0CnYYzIdTTdCzs2IYvjgdizIIGxOHC_0Q8pQeALyVYlaBKUnSCF7ro-p1Bg4vSOn89knloaYGK62JJ4BqmiOjCqZmsXDSYx8DSsvUg")
      ).append(
        $("<h5>").text(dat["nome"]).css({ "color": "rgb(89, 204, 60)", "font-weight": "bold", "font-size": "larger" })
      ).append(
        $("<img>").css({ "height": "35px", "width": "35px" }).prop("src", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Edit_icon_%28the_Noun_Project_30184%29.svg/1024px-Edit_icon_%28the_Noun_Project_30184%29.svg.png").
          css("cursor", "pointer").on("click", function(){modificaTeam(dat,$(this))})
      ).appendTo(card);
    }
    let cardBody = $("<div>").addClass("card-body").appendTo(card);
    let row = $("<div>").css("margin-top", "20px").addClass("row").appendTo(cardBody);
    let col1 = $("<div>").addClass("col-sm-6").css("text-align", "left").appendTo(row);
    $("<img>").prop("src", foto).addClass("card-img-top imgTeam").attr("id","imgTeam").appendTo(col1);
    $("<br>").appendTo(col1);
    $("<div>").prop("id", "founderChangePhoto").css({"margin": "0", "max-width":"60%"}).addClass("custom-file").append(
      $("<label>").css("font-size", "0.7em").addClass("custom-file-label").prop("for", "changeTeamPhoto").text("Change Team's Photo")
    ).append(
      $("<input>").prop("type", "file").addClass("custom-file-input").prop("id", "changeTeamPhoto").prop("accept",".png,.jpg,.jpeg,.png").change( function() {
        readURL(this);
      })
    ).appendTo(col1).hide();
    $("<br>").appendTo(col1);
    $("<br>").appendTo(col1);
    let founderDiv = $("<div>").addClass("justify-content-between").css({ "font-size": "2vh", "text-align": "left" }).appendTo(col1);
    $("<span>").css("font-weight", "bold").text("Founder: ").appendTo(founderDiv);
    $("<span>").text(dat["founder"]).appendTo(founderDiv);
    let descrDiv = $("<div>").prop("id", "wrapperDesc").addClass("justify-content-between").css({ "font-size": "2vh", "text-align": "left" }).appendTo(col1);
    $("<span>").css("font-weight", "bold").text("Description: ").appendTo(descrDiv);
    $("<span>").prop("id", "founderSpanDescription").text(dat["descrizione"]).appendTo(descrDiv);
    let col2 = $("<div>").addClass("col-sm-6").appendTo(row);
    $("<h4>").text("Choose what to display: ").appendTo(col2);
    let divBtnGroup = $("<div>").prop("id", "divBtnGroup").addClass("btn-group").appendTo(col2);
    $("<a>").prop("href", "#").prop("aria-current", "page").addClass("btn btn-success").addClass("active").addClass("btnList").text("Members").appendTo(divBtnGroup).on("click", lista);
    $("<a>").prop("href", "#").prop("aria-current", "page").addClass("btn btn-success").text("Tournaments").addClass("btnList").appendTo(divBtnGroup).on("click", lista);
    $("<br>").appendTo(col2);
    $("<br>").appendTo(col2);
    let btnPPT = $("<div>").prop("id", "btnPPT").css({ "max-height": "35vh", "overflow-y": "scroll", "padding": "0", "padding-right": "2px" }).appendTo(col2);
    let rowBtnInvita = $("<div>").appendTo(cardBody);
    $("<br>").appendTo(rowBtnInvita);
    if (currentTeam["members"].includes(currentUser))
      $("<a>").prop("href", "#").css("margin", "0px auto").addClass("btn btn-danger btn-lg").text(dat["founder"] == currentUser ? "Delete team" : "Leave team").appendTo(rowBtnInvita).prop("id", "btnLeaveTeam").on("click", function () {
        if (dat["founder"] == currentUser)
          leaveTeam(true,dat)
        else
          leaveTeam(false,dat);
      });
    else if (userRichieste.includes(dat.nome))
      $("<a>").prop("href", "#").css("margin", "0px auto").addClass("btn btn-success btn-lg").text("Accept invite").appendTo(rowBtnInvita).prop("id", "btnAcceptRequest").on("click", accettaRichiesta);
    creazioneLi("members");
  }

  function leaveTeam(founder,dat) {
    console.log(dat);
    if (!founder) {
      let request = inviaRichiesta("GET", "/api/leaveTeam", { "par": dat });
      request.fail(errore);
      request.done(function (data) {
        if(data["ris"]=="ok")
        {
          window.location.href="team.html";
        }
        else if(data["ris"]=="nok")
        {
          console.log("Torneo Attivo");
        }
      });
    }
    else {
      let request = inviaRichiesta("GET", "/api/deleteTeam", { "par": dat });
      request.fail(errore);
      request.done(function (data) {
        if(data["ris"]=="ok")
        {
          window.location.href="team.html";
        }
        else if(data["ris"]=="nok")
        {
          console.log("Torneo Attivo");
        }
        
      });
    }
  }

  function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#imgTeam').attr('src', e.target.result);
            console.log(e.target.result);
            imgPath=e.target.result;
        }

        reader.readAsDataURL(input.files[0]);
    }
  }

  function readURLCreate(input) {
    if(input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function (e) {
        $('#imgTeamCreation').attr('src', e.target.result);
        console.log(e.target.result);
        imgPathCreate=e.target.result;
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  function modificaTeam(dat,sender) {
    let desc=$("#founderInputDesc").val();
    if($(sender).prop("src")!="https://cdn.pixabay.com/photo/2017/01/13/01/22/ok-1976099__340.png"){
      $("#founderChangePhoto").show();
      $("<textarea>").addClass("form-control").prop("id", "founderInputDesc").val($("#founderSpanDescription").text()).appendTo($("#wrapperDesc"));
      $("#founderSpanDescription").hide();
      $(sender).prop("src","https://cdn.pixabay.com/photo/2017/01/13/01/22/ok-1976099__340.png")
    }
    else{
      $("#loading").empty();
      $("#feat").empty();

      $("<div>").prop("id", "divGif").appendTo($("#loading").css("display", "block"));
      $("<img>").prop("id", "imgGif").css({ "width": "120px", "height": "120px", "padding": "0" }).prop("src", "https://www.steadymd.com/wp-content/plugins/portfolio-filter-gallery//img/loading-icon.gif").appendTo($("#divGif"));
      setTimeout(function () {
        $("#loading").empty();
        $("#feat").css("display", "block");
      }, 2000000000000000000000000);

      $("#founderChangePhoto").hide();
      
      console.log(desc);
      if(imgPath!=""||$("#founderSpanDescription").text()!=$("#founderInputDesc").val())
      {
        if(imgPath!="")
        {
          let req= inviaRichiesta("POST","/api/caricaFoto",{"path":imgPath});
          req.fail(errore);
          req.done(function(data){
            let request = inviaRichiesta("GET","/api/updateTeam",{"foto":data["ris"],"team":dat["nome"],"desc":desc});
            request.fail(errore);
            request.done(function(data){
              window.location.href="team.html?name="+dat["nome"];
            });
          });
        }
        else
        {
          console.log(desc);
          let request = inviaRichiesta("GET","/api/updateTeam",{"desc": desc,"foto":dat["photo"],"team":dat["nome"]});
            request.fail(errore);
            request.done(function(data){
              window.location.href="team.html?name="+dat["nome"];
            })
        }
      }

      $("#founderSpanDescription").text($("#founderInputDesc").val()).show();
      $("#founderInputDesc").remove();
      $(sender).prop("src","https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Edit_icon_%28the_Noun_Project_30184%29.svg/1024px-Edit_icon_%28the_Noun_Project_30184%29.svg.png")
    }
  }
  function lista() {
    creazioneLi($(this).text());
  };
  function creazioneLi(selected) {
    $("#btnPPT").empty();
    for (let item of currentTeam[selected.toLowerCase()]) {
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
        $("<img>").addClass("imgPref").prop("src", data.username == currentTeam.founder ? "https://cdn.iconscout.com/icon/free/png-512/crown-412-910303.png" : "https://previews.123rf.com/images/bobrovee/bobrovee1603/bobrovee160300125/54952956-square-transparent-background-black-and-white-seamless-pattern-.jpg").appendTo(listItem);
      })
    }
  }
  function findTeam() {
    let req = inviaRichiesta("GET", "/api/infoTeam",
      {
        "name": param,
      });
    req.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    req.done(function (data) {
      VisualizzaTeam(data);
    });
  }
  function accettaRichiesta() {
    let request = inviaRichiesta("GET", "/api/addMembro", {
      "team": currentTeam.nome,
      "username": currentUser
    });
    request.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    request.done(function (data) {
      if (data.ris == "ok")
        window.location.href = "team.html";
    });
  }
  function rifiutaRichiesta() {
    let request = inviaRichiesta("GET", "/api/declineRichiesta", {
      "team": currentTeam.nome,
      "username": currentUser
    });
    request.fail(function (jqXHR, test_status, str_error) {
      errore(jqXHR, test_status, str_error);
    });
    request.done(function (data) {
      if (data.ris == "ok")
        window.location.href = "team.html";
    });
  }

  function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    console.log(results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' ')));
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  //#endregion
})