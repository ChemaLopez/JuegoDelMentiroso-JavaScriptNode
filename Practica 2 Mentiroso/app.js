"use strict"
const express = require("express");
const path = require("path");
const config = require("./config");
const bodyParser = require("body-parser");
const passport = require("passport");
const passportHTTP = require('passport-http');
const daoUsuarios = require("./dao");
const expressSession = require("express-session");
const mysqlSession = require("express-mysql-session");
const mysql = require("mysql");
const MySQLStore = mysqlSession(expressSession);
var https = require("https");
var fs = require("fs");

const app = express();


let pool = mysql.createPool({
    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password
});

//INSTACIA del DAO
let daoU = new daoUsuarios.DAO(pool);

let sessionStore = new MySQLStore({

    database: config.mysqlConfig.database,
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password,
});
const middlewareSession = expressSession({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false,
    store: sessionStore

});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());

app.use(bodyParser.json());



passport.use(new passportHTTP.BasicStrategy(
    { realm: 'Autenticacion requerida' },
    function (user, pass, callback) {

        daoU.loginCorrecto(user, pass, (err, resultado) => {
            if (err) {
                console.log(err);
                callback({ permitido: false });
            } else {

                if (resultado) {
                    callback(null, { permitido: true, id: resultado.id })
                } else {
                    callback(null, false);
                }
            }

        })
    }
));

app.listen(config.port, function (err) {
    if (err) {
        console.log("No se ha podido iniciar el servidor.")
        console.log(err);
    } else {
        console.log(`Servidor escuchando en puerto ${config.port}.`);
    }
});





app.get("/", (request, response) => {
    response.redirect("/home.html");
    response.end();

});

app.post("/login", (request, response) => {


    daoU.loginCorrecto(request.body.usuario, request.body.pass, (err, resultado) => {
        if (err) {
            console.log(err);
            response.status(500);
        } else {
            if (resultado) {
                response.json({ permitido: true, id: resultado.id, partidas: resultado.partidas });
                response.status(200);

            } else {
                response.json({ permitido: false });
            }


        }


        response.end();

    })


});


app.post("/registro", (request, response) => {

    let usuario = {
        nombre: request.body.user,
        pass: request.body.pass
    }
    daoU.insertarUsuario(usuario, (err, id) => {
        //code: 'ER_DUP_ENTRY'   
        if (err) {
            console.log(err);
            if (err.code === 'ER_DUP_ENTRY') {
                response.status(400)
            } else {
                response.status(500)
            }

        } else {
            response.status(201);
        }
        response.end();

    });


});


app.post("/creaPartida", passport.authenticate('basic', { session: false }), (request, response) => {

    let estado = JSON.stringify({
        estado: "abierto", usuarios: {
            user1: {
                id: request.user.id,
                cartas: []
            }
        }
    })

    let partida = {
        nombre: request.body.partida,
        estado: estado,
        usuario: request.user.id
    }

    daoU.creaPartida(partida, (err, resultado) => {
        //code: 'ER_DUP_ENTRY'   
        if (err) {
            console.log(err);

            response.status(500);
        } else {
            response.json({ nombre: partida.nombre, idPartida: resultado, estado: "abierto" });
            response.status(201);

        }
        response.end();

    });


});


app.get("/damePartida/:id", passport.authenticate('basic', { session: false }), (request, response) => {
    let id = Number(request.params.id);

    let usuarios = []

    daoU.buscar(request.params.id, request.user.id, (err, resultado) => {
        if (err) {
            console.log(err)
            response.status(500)

        } else {
            response.json({ permitido: true, id: resultado.id, nombre: resultado.nombre, estado: resultado.estado, usuarios: resultado.lista, cartas: resultado.cartasUsuario, enMesa: resultado.enMesa });
            response.status(200);
        }
        response.end();
    });



});


app.post("/insertarPartida", passport.authenticate('basic', { session: false }), (request, response) => {



    let partida = {
        id: request.body.partida,
        usuario: request.user.id
    }

    daoU.insertaPartida(partida, (err, resultado) => {
        if (err) {
            console.log(err);

            response.status(500);
        } else {

            response.json({ id: partida.id, nombre: resultado.nombre, estado: resultado.estado });
            response.status(201);

        }
        response.end();

    });


});

app.post("/descartar", passport.authenticate('basic', { session: false }), (request, response) => {



    let partida = {
        id: request.body.partida,
        usuario: request.user.id,
        cartas: request.body.cartas
    }

    console.log(partida)
    daoU.descarta(partida, (err, resultado) => {
        if (err) {
            console.log(err)
            response.status(500);

        } else {

            response.status(201);
            response.end();

        }

    })
});



app.post("/movimiento", passport.authenticate('basic', { session: false }), (request, response) => {



    let partida = {
        id: request.body.partida,
        usuario: request.user.id,
        cartas: request.body.cartas,
        enMesa: request.body.enMesa
    }
    console.log(partida)

    daoU.realizaMovimiento(partida, (err, resultado) => {
        if (err) {
            console.log(err)
            response.status(500);

        } else {

            response.status(201);
            response.end();

        }

    })


});
app.post("/mentiroso", passport.authenticate('basic', { session: false }), (request, response) => {


    let id = request.body.partida;
    daoU.buscar(id, request.user.id, (err, resultado) => {
        if (err) {
            console.log(err)
            response.status(500);

        } else {
            let partida = resultado;
            let enMesa = resultado.enMesa.ultimasCartas;
            let valor = resultado.enMesa.valor;
            let mentira =false;
            enMesa.forEach(element => {
                if(element[0]!==valor){
                    mentira=true;
                }
            });
            
            let lista = resultado.lista;
            let numero =0;
            let encontrado = false;

            while(!encontrado){
                if(lista[parseInt(numero)].turno!==undefined){
                    encontrado=true;
                }else{
                    numero++;
                }
            }
        let cartas;
            if(mentira){
                //DARLE LAS CARTAS AL ANTERIOR
                if(numero===0){
                    numero=4;
                }
                let user ="user"+numero;
                cartas = resultado.cartasUsuario;
                daoU.paraElMentiroso(id,user,resultado.enMesa.cartasEnMesa, (err,res)=>{

                    if(err){
                        console.log(err)
                    }else{
                    }
                })

            }else{
                //LAS CARTAS SON DEL USUARIO ACTUAL
                 cartas = resultado.cartasUsuario.concat(resultado.enMesa.cartasEnMesa);
                
            }
             enMesa ={};
            enMesa.numCartas=0;
            enMesa.valor=0;
           enMesa.ultimasCartas=[];
            enMesa.cartasEnMesa=[];
            partida={}

             partida = {
                id: id,
                usuario: request.user.id,
                cartas: cartas,
                enMesa: enMesa
            }
            daoU.actualizaPostMentira(partida, (err, resultado) => {
                if (err) {
                    console.log(err)
                    response.status(500);
        
                } else {
        
                   
                }
        
            })
            response.status(201);
            response.end();

        }

    })


});