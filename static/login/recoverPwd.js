"use strict"

$(document).ready(function () {
    let _username = $("#username")
    let _password1 = $("#password1")
    let _password2 = $("#password2")


    $("#btnSignin").on("click", signin);

    $(document).on('keydown', function (event) {
        if (event.keyCode == 13)
            signin();
    });

    function signin() {
        if (_password1.val() != "" && _password1.val() == _password2.val() && _username.val() != "") {
            let request = inviaRichiesta("POST", "/api/forgotPwd", {
                "username": _username.val(),
                "password": _password1.val()
            });
            request.fail(function (jqXHR, test_status, str_error) {
                errore(jqXHR, test_status, str_error);
            });
            request.done(function (data) {
                if (data.ris == "ok"){
                    window.location.href = "login.html";
                }
                else {
                    _username.val("");
                    _password1.val("");
                    _password2.val("");
                    $("#_p").html("Username or email is not present!").addClass("errr");
                }
            });

        }
        else if ((_password1.val() != "" || _password2.val() != "") && _password1.val() != _password2.val()) {
            _password1.removeClass("boxes");
            _password1.addClass("boxErr");
            _password2.removeClass("boxes");
            _password2.addClass("boxErr");
            $("#_p").html("Check your passwords. They are different from each other!").addClass("errr");
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

});