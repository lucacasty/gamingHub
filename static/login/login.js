"use strict"

$(document).ready(function () {
    let _username = $("#username")
    let _password = $("#password")


    $("#btnLogin").on("click", controllaLogin);

    $("#forgot").on("click", forgotPwd);

    $(document).on('keydown', function (event) {
        if (event.keyCode == 13)
            controllaLogin();
    });

    function forgotPwd() {
        $("#_p").html("Insert your email to recover the password!").addClass("errr");
        _username.prop("placeholder", "Mail");
        _password.hide(500);
        $("#btnLogin").val("Send email");
        $(".box a").hide();
        $("<a>").addClass("link text-muted").text("Return to previous login page.").prop("href","login.html").appendTo($("#boxA"));
    }

    function controllaLogin() {
        if ($("#btnLogin").val() == "Login") {
            if (_username.val() != "" && _password.val() != "") {
                let request = inviaRichiesta("POST", "/api/login", {
                    "username": _username.val(),
                    "password": _password.val()
                });
                request.fail(function (jqXHR, test_status, str_error) {
                    _username.val("");
                    _password.val("");
                    _username.removeClass("boxes");
                    _password.removeClass("boxes");
                    _username.addClass("boxErr");
                    _password.addClass("boxErr");
                    $("#_p").html("Ops! Username or password are wrong. Try again or sign up!").addClass("errr");
                });
                request.done(function (data) {
                    window.location.href = "../index.html"
                });
            }
            else {
                for (let input of $(".fi")) {
                    $(input).removeClass("boxErr");
                    $(input).addClass("boxes");
                    if ($(input).val() == "") {
                        $(input).removeClass("boxes");
                        $(input).addClass("boxErr");
                        $("#_p").html("Please enter all fields!").addClass("errr");
                    }
                }
            }
        }
        else {
            let request = inviaRichiesta("POST", "/api/sendMail", {
                "mail": _username.val()
            });
            request.fail(function (jqXHR, test_status, str_error) {
                errore(jqXHR, test_status, str_error);
            });
            request.done(function (data) {
                if (data.ris == "ok") {
                    _username.prop("placeholder", "Username");
                    $("#_p").html("Check your email to recover the password!").addClass("errr");
                    $("#btnLogin").hide();
                }
                else
                    $("#_p").html("Ops! Mail is not valid!").addClass("errr");
            });
        }

    }


});