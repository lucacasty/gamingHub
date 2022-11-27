"use strict"

$(document).ready(function () {
    let _username = $("#username")
    let _mail = $("#mail")
    let _dob = $("#dob")
    let _password1 = $("#password1")
    let _password2 = $("#password2")


    $("#btnSignin").on("click", signin);

    $(document).on('keydown', function (event) {
        if (event.keyCode == 13)
            signin();
    });

    function signin() {
        if (_password1.val() != "" && _password1.val() == _password2.val() && _username.val() != "" && _mail.val() != "" && _dob.val() != "") {
            if (!checkEmail(_mail.val())){
                _mail.addClass("boxErr");
                $("#_p").html("Check your email. Its format is invalid!").addClass("errr");
            }
            else {
                let request = inviaRichiesta("POST", "/api/signin", {
                    "username": _username.val(),
                    "mail": _mail.val(),
                    "dob": _dob.val(),
                    "password": _password1.val()
                });
                request.fail(function (jqXHR, test_status, str_error) {
                    errore(jqXHR, test_status, str_error);
                });
                request.done(function (data) {
                    if (data.ris == "ok")
                        window.location.href = "login.html";
                    else {
                        _username.val("");
                        _mail.val("");
                        _dob.val("");
                        _password1.val("");
                        _password2.val("");
                        $("#_p").html("Username or email already present, change it!").addClass("errr");
                    }
                });
            }
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

});