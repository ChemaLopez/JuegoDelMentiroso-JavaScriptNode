"use strict";

let userLogin
let passLogin
/*
 * Manejador que se ejecuta cuando el DOM se haya cargado.
 */
$(() => {
    $("#login").on("click", login);
    $("#registro-Show").on("click", showRegistro);
    $("#registro").on("click", registro);
    $("#registro-div").hide();
    $("#main-div").hide();
    $("input").prop('required', true);
    $("#creaPartida").on("click", creaPartida);
    $("#insertaPartida").on("click", insertarEnPartida);
    $("#menu").on("click", "a.menu", infoPartida);
    $(".actualizaPartida").on("click", actualizaPartida);
    $("#logeado").on("click", "a.glyphicon", salir);
    $("body").on("click", 'img.imagenSelect', seleccionaFoto);
    $("body").on("click", 'img.clicado', seleccionaFoto);
    $("#jugada").on("click", "#mentiroso", mentiroso);
    $("#jugada").on("click", "#juega", jugada);
    $("#jugada").on("click", "#juegaModal", juegaModal);

    $("#jugada").on("click", "#descartar", descartar);

    $("#primeraJugada").on("click", primeraJugada);
});

function seleccionaFoto() {
    if (document.getElementById("juega") || document.getElementById("juegaModal")) {
        let selected = $(event.target);
        if (selected.hasClass("clicado")) {
            selected.removeClass("clicado")
            selected.addClass("imagenSelect")

        } else {
            selected.addClass("clicado")
            selected.removeClass("imagenSelect")

        }

        //console.log(selected.data("id"))
        let fotosSeleccionadas = []
        fotosSeleccionadas = $("#fotos").find(".clicado");

        if (fotosSeleccionadas.length === 4) {
            var palo = fotosSeleccionadas.eq(0).data("id")[0];
            var num = 0;
            for (var i = 0; i < fotosSeleccionadas.length; ++i) {

                if (palo === (fotosSeleccionadas.eq(i).data("id")[0]))
                    num++;

            }
            console.log(num)
            if (num === 4) {
                let button = $("<button>").addClass("btn  btn-danger margen").text("Descartar").attr("id", "descartar");
                $("#jugada").append(button)

            }

        }
    }

    //OPCION DE BORRADO
}


function showRegistro() {
    $("#login-div").hide();
    $("#registro-div").show();

}

function infoPartida() {
    let selected = $(event.target);

    // Obtenemos el elemento <li> que contiene el botón
    // pulsado.
    let liPadre = selected.parent();
    var cadenaBase64 = btoa(userLogin + ":" + passLogin);
    $.ajax({
        type: "GET",
        url: "/damePartida/" + liPadre.data("id"),
        beforeSend: function (req) {
            // Añadimos la cabecera 'Authorization' con los datos
            // de autenticación.
            req.setRequestHeader("Authorization"
                ,
                "Basic " + cadenaBase64);
        },

        success: (data, state, jqXHR) => {
            if (data.permitido) {
                pintaMenu(data);
            } else {
                salir();
            }
        }, error: (jqXHR, textStatus, errorThrown) => {
            alert("Algo ha pasao")
            console.log(errorThrown);
        }

    });
}

function creaMenu(partida) {
    let result;
    if (partida.estado === "abierto") {
        result = $("<li>").append($("<a>").attr("data-toggle", "tab").addClass("menu").prop("href", "#menu2").text(partida.nombre))
    } else {
        result = $("<li>").append($("<a>").attr("data-toggle", "tab").addClass("menu").prop("href", "#menu1").text(partida.nombre))
    }
    result.data("id", partida.idPartida);
    return result;

}

function login() {

    let user = $("#user").val();
    let pass = $("#pass").val();
    $.ajax({
        method: "POST",
        url: "/login",
        contentType: "application/json",
        data: JSON.stringify({ usuario: user, pass: pass }),
        success: (data, state, jqXHR) => {
            if (data.permitido) {
                $("#login-div").hide();
                $("#main-div").show();
                userLogin = user;
                passLogin = pass;
                let numero = 0;


                let out = $("<li>").append($("<a>").prop("href", "/#").append($("<span>").addClass("glyphicon glyphicon-log-out").text("Desconectar")));
                let logeado = $("<li>").append($("<a>").append($("<span>").addClass("glyphicon glyphicon-user").text(user)))
                $("#logeado").append(logeado).append(out);

                if (data.partidas)
                    data.partidas.forEach(element => {
                        let resultado = creaMenu(element, numero);
                        $("#partidas-nav").append(resultado)
                        numero++;
                    });
            } else {
                alert("Usuario o contraseña erroneo")
            }
        },
        error: (jqXHR, textStatus, errorThrown) => {
            alert("Algo ha pasao")
            console.log(errorThrown);
        }
    });
}


function registro(evt) {
    evt.preventDefault();

    let user = $("#user-Reg").val();
    let pass = $("#pass-Reg").val();
    if (user.trim() !== "" && pass.trim() !== "")
        $.ajax({
            type: "POST",
            url: "/registro",
            contentType: "application/json",
            data: JSON.stringify({ user: user, pass: pass }),
            success: (data, textStatus, jqXHR) => {
                alert("Usuario introducido")

            },

            // En caso de error, mostramos el error producido
            error: (jqXHR, textStatus, errorThrown) => {
                alert("Se ha producido un error: " + errorThrown);
            }

        });

}
function creaPartida() {

    let nombrePartida = $("#new_game").val();
    var cadenaBase64 = btoa(userLogin + ":" + passLogin);
    if (nombrePartida.trim() !== "")
        $.ajax({
            type: "POST",
            url: "/creaPartida",
            beforeSend: function (req) {
                // Añadimos la cabecera 'Authorization' con los datos
                // de autenticación.
                req.setRequestHeader("Authorization"
                    ,
                    "Basic " + cadenaBase64);
            },
            contentType: "application/json",
            data: JSON.stringify({ partida: nombrePartida }),
            success: (data, textStatus, jqXHR) => {
                alert("Partida creada")
                console.log(data);
                let partida = {
                    nombre: nombrePartida,
                    idPartida: data.idPartida,
                    estado: data.estado
                }
                let resultado = creaMenu(partida, $('ul#menu li').length);

                $("#partidas-nav").append(resultado)

            },

            // En caso de error, mostramos el error producido
            error: (jqXHR, textStatus, errorThrown) => {
                alert("Se ha producido un error: " + errorThrown);
            }

        });

}

function insertarEnPartida() {
    let idPartida = $("#find_game").val();
    if (idPartida.trim() !== "")
        var cadenaBase64 = btoa(userLogin + ":" + passLogin);

    $.ajax({
        type: "POST",
        url: "/insertarPartida",
        beforeSend: function (req) {
            // Añadimos la cabecera 'Authorization' con los datos
            // de autenticación.
            req.setRequestHeader("Authorization"
                ,
                "Basic " + cadenaBase64);
        },
        contentType: "application/json",
        data: JSON.stringify({ partida: idPartida }),
        success: (data, textStatus, jqXHR) => {
            alert("Has entrado en la partida")
            let partida = {
                nombre: data.nombre,
                idPartida: data.id,
                estado: data.estado
            }
            let resultado = creaMenu(partida, $('ul#menu li').length);
            $("#partidas-nav").append(resultado)

        },

        // En caso de error, mostramos el error producido
        error: (jqXHR, textStatus, errorThrown) => {
            alert("Se ha producido un error: " + errorThrown);
        }

    });

}


function actualizaPartida() {

    let selected = $("#partidas-nav").children(".active");

    var cadenaBase64 = btoa(userLogin + ":" + passLogin);
    $.ajax({
        type: "GET",
        url: "/damePartida/" + selected.data("id"),
        beforeSend: function (req) {
            // Añadimos la cabecera 'Authorization' con los datos
            // de autenticación.
            req.setRequestHeader("Authorization"
                ,
                "Basic " + cadenaBase64);
        },

        success: (data, state, jqXHR) => {

            if (data.permitido) {
                //AQUI MODIFICAMOS EL DOM 
                pintaMenu(data);
            } else {
                salir();
            }
        }, error: (jqXHR, textStatus, errorThrown) => {
            alert("Algo ha pasao")
            console.log(errorThrown);
        }

    });

}

function salir() {
    var cadenaBase64 = btoa(userLogin + ":" + passLogin);

    $.ajax({
        type: "GET",
        url: "/",
        beforeSend: function (req) {
            // Añadimos la cabecera 'Authorization' con los datos
            // de autenticación.
            req.setRequestHeader("Authorization"
                ,
                "Basic " + cadenaBase64);
        },

        success: (data, state, jqXHR) => {
            alert("Desconectado")

        },
        error: (jqXHR, textStatus, errorThrown) => {
            alert("Algo ha pasao")
            console.log(errorThrown);
        }
    });

}


function pintaMenu(data) {
 
    console.log(data)
    if (data.estado === "abierto") {
        $("#titulo").remove();
        let titulo = $("<h3>").text(data.nombre);
        titulo.attr("id", "titulo");
        $("#descripcion").before(titulo);
        $("p").remove();
        let parrafo = $("<p>").text("El identificador de esta partida es " + data.id);
        $("#descripcion").append($(parrafo))
        $("#tabla").empty();
        data.usuarios.forEach(element => {
            if(element!==null){
            let td = $("<td>").text(element.nombre)
            let td2 = $("<td>").text("-");
            let tr = $("<tr>").append(td);
            tr.append(td2);
            $("#tabla").append(tr)
        }
        }
        )
    } else {
        let selected = $("#partidas-nav").children(".active");
        selected.children(".menu").prop("href", "#menu1");
        $("#menu1").addClass("active in");
        $("#menu2").removeClass("active in")
        $("#titulo2").remove();
        let titulo = $("<h3>").text(data.nombre);
        titulo.attr("id", "titulo2");
        titulo.addClass("panel-title")
        $("#estadoMesa").empty();
        if (data.enMesa) {
            for (var i = 0; i < data.enMesa.numCartas; ++i) {
                let carta = $("<div>").text(data.enMesa.valor).addClass("carta")
                $("#estadoMesa").append(carta)
            }
        } else {
            let vacio = $("<p>").text("Aun no hay cartas en la mesa");
            $("#estadoMesa").append(vacio);
        }
        $("#tituloPartida").append(titulo);
        $("#tabla2").empty();
        $("#jugada").empty()
        data.usuarios.forEach(element => {
            let td = $("<td>").text(element.nombre)
            let td2 = $("<td>").text(element.cartas);
            let tr = $("<tr>").append(td);
            tr.append(td2);

            if (element.turno) {
                tr.addClass("success")
                if (element.nombre === userLogin) {
                    let button;
                    console.log()
                    if (data.enMesa === undefined || data.enMesa.numCartas===0) {
                        button = $("<button>").addClass("btn  btn-primary margen").attr("data-toggle", "modal").attr("data-target", "#eligeCarta").text("Jugar cartas seleccionadas").attr("id", "juegaModal");
                    } else {
                        button = $("<button>").addClass("btn  btn-primary margen").text("Jugar cartas seleccionadas").attr("id", "juega");

                    }
                    $("#jugada").append(button)
                    if(data.enMesa && data.enMesa.numCartas>=1 ){
                    button = $("<button>").addClass("btn  btn-danger margen").text("!Mentiroso¡").attr("id", "mentiroso");
                    $("#jugada").append(button)
                }
                }
            }
            $("#tabla2").append(tr)
        
        })
        //FOTOS DE LAS CARTAS
        $("#fotos").empty();
        data.cartas.forEach(element => {

            let foto = $("<img>").prop("src", "img/imagenes/" + element + ".png");
            foto.addClass("imagenSelect ").data("id", element)
            $("#fotos").append(foto);
        })
    }

}



function mentiroso() {
    alert("mentiroso")
    let selected = $("#partidas-nav").children(".active");
    console.log(selected)
    var cadenaBase64 = btoa(userLogin + ":" + passLogin);


    $.ajax({
        type: "POST",
        url: "/mentiroso",
        beforeSend: function (req) {
            // Añadimos la cabecera 'Authorization' con los datos
            // de autenticación.
            req.setRequestHeader("Authorization"
                ,
                "Basic " + cadenaBase64);
        },
        contentType: "application/json",
        data: JSON.stringify({ partida: selected.data("id")}),
        success: (data, state, jqXHR) => {
           //RESULTADO DEL MENTIROSO
           actualizaPartida();
        },
        error: (jqXHR, textStatus, errorThrown) => {
            alert("Algo ha pasao")
            console.log(errorThrown);
        }
    });




}


function descartar() {

    let fotosSeleccionadas = $("#fotos").find(".imagenSelect");
    let cartas = [];
    for (var i = 0; i < fotosSeleccionadas.length; ++i) {
        cartas.push(fotosSeleccionadas.eq(i).data("id"));
    }
    let selected = $("#partidas-nav").children(".active");

    var cadenaBase64 = btoa(userLogin + ":" + passLogin);

    $.ajax({
        type: "POST",
        url: "/descartar",
        beforeSend: function (req) {
            // Añadimos la cabecera 'Authorization' con los datos
            // de autenticación.
            req.setRequestHeader("Authorization"
                ,
                "Basic " + cadenaBase64);
        },
        contentType: "application/json",
        data: JSON.stringify({ partida: selected.data("id"), cartas: cartas }),
        success: (data, state, jqXHR) => {
            let valor = ($("#tabla2").children(".success").children().eq(1).html())

            let fotosSeleccionadas = $("#fotos").find(".clicado");
            $("#tabla2").children(".success").children().eq(1).text(valor - 4);
            $("#descartar").remove();
            for (var i = 0; i < fotosSeleccionadas.length; ++i) {
                fotosSeleccionadas.eq(i).remove();
            }


        },
        error: (jqXHR, textStatus, errorThrown) => {
            alert("Algo ha pasao")
            console.log(errorThrown);
        }
    });




}

function juegaModal() {
    let selected = $("#fotos").children(".clicado")
    if (selected.length !== 0) {

        $("#seleccionaCarta").show();
        $("#primeraJugada").show();
        $("#modalBody").empty();
        $("#tituloModal").text("Seleccione una carta");
        let texto = $("<p>").text("Seleccione la carta");
        $("#modalBody").append(texto)

        let selector = $("<select>").addClass("custom-select custom-select-sm").attr("id", "selecccionaCarta");
        selector.append($("<option selected>").text("Cual es el valor carta"))
        for (var i = 1; i <= 10; ++i) {
            selector.append($("<option>").attr("value", i).text(i))
        }
        selector.append($("<option>").attr("value", "J").text("J"))
        selector.append($("<option>").attr("value", "Q").text("Q"))
        selector.append($("<option>").attr("value", "K").text("K"))
        selector.append($("<option>").attr("value", "A").text("A"))

        $("#modalBody").append(selector);


    } else {
        $("#seleccionaCarta").remove();
        $("#primeraJugada").remove();
        $("#tituloModal").text("No hay cartas seleccionadas");
        let texto = $("<p>").text("Seleccione al menos una carta para poder continuar")
        $("#modalBody").empty();
        $("#modalBody").append(texto)
    }
}

function primeraJugada() {



    let fotosSeleccionadas = $("#fotos").find(".imagenSelect");
    let cartas = [];

    for (var i = 0; i < fotosSeleccionadas.length; ++i) {
        cartas.push(fotosSeleccionadas.eq(i).data("id"));
    }
    let selected = $("#partidas-nav").children(".active");

    var cadenaBase64 = btoa(userLogin + ":" + passLogin);

    //CONTEO DE LAS FOTOS 
    let cartasParaMesa = [];
    fotosSeleccionadas = $("#fotos").find(".clicado");
    for (var i = 0; i < fotosSeleccionadas.length; ++i) {
        cartasParaMesa.push(fotosSeleccionadas.eq(i).data("id"));
    }
    
    let numCartas = fotosSeleccionadas.length;
    let enMesa = { numCartas: numCartas, valor: $("#selecccionaCarta").val(), cartasParaMesa: cartasParaMesa }

    $.ajax({
        type: "POST",
        url: "/movimiento",
        beforeSend: function (req) {
            // Añadimos la cabecera 'Authorization' con los datos
            // de autenticación.
            req.setRequestHeader("Authorization"
                ,
                "Basic " + cadenaBase64);
        },
        contentType: "application/json",

        data: JSON.stringify({ partida: selected.data("id"), cartas: cartas, enMesa: enMesa }),

        success: (data, state, jqXHR) => {
           
            let valor = ($("#tabla2").children(".success").children().eq(1).html())

            $("#tabla2").children(".success").children().eq(1).text(valor - enMesa.numCartas);
            $("#descartar").remove();
            let fotosSeleccionadas = $("#fotos").find(".clicado");

            for (var i = 0; i < fotosSeleccionadas.length; ++i) {
                fotosSeleccionadas.eq(i).remove();
            }

            for (var i = 0; i < enMesa.numCartas; ++i) {
                let carta = $("<div>").text(enMesa.valor).addClass("carta")
                $("#estadoMesa").append(carta)
            }

            let pos = $("#tabla2").children(".success").index()

            if (pos < 3) {
                pos++;
            } else {
                pos = 0;
            }
            $("#tabla2").children(".success").removeClass("success");
            $("#tabla2").children().eq(pos).addClass("success");
            $("#juegaModal").hide();
            $("#mentiroso").hide();

           
        },
        error: (jqXHR, textStatus, errorThrown) => {
            alert("Algo ha pasao")
            console.log(errorThrown);
        }
    });


}


function jugada() {
    let selected = $("#fotos").children(".clicado")
    if (selected.length !== 0) {

        let fotosSeleccionadas = $("#fotos").find(".imagenSelect");
        let cartas = [];

        for (var i = 0; i < fotosSeleccionadas.length; ++i) {
            cartas.push(fotosSeleccionadas.eq(i).data("id"));
        }
        let selected = $("#partidas-nav").children(".active");

        var cadenaBase64 = btoa(userLogin + ":" + passLogin);
        //CONTEO DE LAS FOTOS 

        fotosSeleccionadas = $("#fotos").find(".clicado");
        
        let numCartas = fotosSeleccionadas.length;
        numCartas += $("#estadoMesa").children().length;

        let valor = $("#estadoMesa").children().eq(0)

        let cartasParaMesa = [];
        fotosSeleccionadas = $("#fotos").find(".clicado");
        for (var i = 0; i < fotosSeleccionadas.length; ++i) {
            cartasParaMesa.push(fotosSeleccionadas.eq(i).data("id"));
        }
        let enMesa = { numCartas: numCartas, valor: valor.html(), cartasParaMesa:cartasParaMesa  }

        console.log(enMesa)
        $.ajax({
            type: "POST",
            url: "/movimiento",
            beforeSend: function (req) {
                // Añadimos la cabecera 'Authorization' con los datos
                // de autenticación.
                req.setRequestHeader("Authorization"
                    ,
                    "Basic " + cadenaBase64);
            },
            contentType: "application/json",

            data: JSON.stringify({ partida: selected.data("id"), cartas: cartas, enMesa: enMesa }),

            success: (data, state, jqXHR) => {

               
                let valor = ($("#tabla2").children(".success").children().eq(1).html())
                let fotosSeleccionadas = $("#fotos").find(".clicado");

                $("#tabla2").children(".success").children().eq(1).text(valor - fotosSeleccionadas.length);
                $("#descartar").remove();
                $("#estadoMesa").empty()
                for (var i = 0; i < fotosSeleccionadas.length; ++i) {
                    fotosSeleccionadas.eq(i).remove();
                }
                
                for (var i = 0; i < enMesa.numCartas; ++i) {
                    let carta = $("<div>").text(enMesa.valor).addClass("carta")
                    $("#estadoMesa").append(carta)
                }

                let pos = $("#tabla2").children(".success").index()
                $("#tabla2").children(".success").removeClass("success");
                if (pos < 3) {
                    pos++;
                } else {
                    pos = 0;
                }
                $("#tabla2").children().eq(pos).addClass("success");
                
                $("#juega").hide();
                $("#mentiroso").hide();

                //ME COLOCO EN LA TABLA



            }, error: (jqXHR, textStatus, errorThrown) => {
                alert("Algo ha pasao")
                console.log(errorThrown);
            }
        });


    } else {
        alert("Selecciona al menos una carta")
    }

}