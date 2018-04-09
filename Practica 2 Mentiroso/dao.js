"use strict"
var _ = require("underscore");

class DAO {


    constructor(pool) {
        this.pool = pool;
    }



    ///BUSCAR USUARIO X EMAIL
    loginCorrecto(email, password, callback) {
        /* Implementar */
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            connection.query("Select u.*,p.id as idPartida,p.nombre, p.estado from usuarios u left join juega_en pe on idUsuario=u.id left join partidas p on pe.idPartida=p.id where login= ? AND password = ?"
                , [email, password],
                (err, rows) => {
                    if (err) {
                        callback(err); return;
                    }
                    connection.release();
                    if (rows.length === 0) {
                        callback(null, false);
                        return;
                    } else {
                        let partidas = []

                        rows.forEach(element => {
                            if (element.nombre) {
                                let estado = JSON.parse(element.estado)
                                partidas.push({
                                    nombre: element.nombre,
                                    idPartida: element.idPartida,
                                    estado: estado.estado
                                })
                            }
                        })
                        let usuario = {
                            email: rows[0].email,
                            password: rows[0].password,
                            id: rows[0].id,
                            partidas: partidas
                        }
                        callback(null, usuario);
                        return;
                    }
                });

        });
    };
    ////INSERTAR USUARIO.
    insertarUsuario(usuario, callback) {

        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            else {
                var sql = "INSERT INTO usuarios(login, password) VALUES (?, ?)";
                connection.query(sql, [usuario.nombre, usuario.pass],
                    (err, result) => {
                        if (err) {
                            callback(err);
                        } else {
                            connection.release();
                            callback(null, result.insertId);
                            return;
                        }
                    });
            }
        });
    }

    insertaPartida(partida, callback) {

        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            else {
                connection.query("INSERT INTO juega_en (idUsuario, idPartida) values (?,?)", [partida.usuario, partida.id], (err, result) => {
                    if (err) {
                        callback(err);
                    } else {
                        connection.query("select nombre, estado from partidas where id=?", [partida.id], (err, rows) => {
                            if (err) {
                                callback(err)

                            } else {
                                let estado = JSON.parse(rows[0].estado);
                                Object.keys(estado.usuarios);
                                let number = (Object.keys(estado.usuarios).length) + 1;
                                if (number <= 4) {
                                    if (number === 4) {
                                        estado.estado = "cerrado";
                                        estado.turno = "user1";

                                        var letras = ['C', 'D', 'H', 'S']
                                        var figura = ['K', 'J', 'Q', 'A']
                                        let cartas = [];
                                        letras.forEach(element => {
                                            for (let i = 2; i <= 10; ++i) {

                                                cartas.push(i + "_" + element)
                                            }
                                            figura.forEach(palo => {
                                                cartas.push(palo + "_" + element)

                                            })

                                        })

                                        cartas = _.shuffle(cartas);


                                        var result = _.groupBy(cartas, (item, i) => {
                                            return Math.floor(i / 13);
                                        });
                                        let particion = _.values(result);

                                        estado.usuarios["user" + number] = {
                                            id: partida.usuario,
                                            cartas: particion[3]
                                        }
                                        estado.usuarios["user" + 3].cartas = particion[2]

                                        estado.usuarios["user" + 2].cartas = particion[1]

                                        estado.usuarios["user" + 1].cartas = particion[0]


                                    } else {
                                        estado.usuarios["user" + number] = {
                                            id: partida.usuario,
                                            cartas: []
                                        }
                                    }
                                    let estado2 = JSON.stringify(estado);
                                    connection.query("UPDATE `partidas` SET `estado` = ? WHERE `partidas`.`id` = ?", [estado2, partida.id], (err, result) => {

                                        if (err) {
                                            callback(err);
                                        } else {
                                            connection.release();

                                            callback(null, { nombre: rows[0].nombre, estado: estado.estado });
                                        }

                                    })
                                    return null;
                                } else {
                                    callback(null, null);
                                }
                            }
                        });
                    }
                });
            }
        });
    }



    creaPartida(partida, callback) {

        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            else {
                var sql = "INSERT INTO partidas(nombre, estado) VALUES (?, ?)";
                connection.query(sql, [partida.nombre, partida.estado],
                    (err, result) => {
                        if (err) {
                            callback(err);
                        } else {
                            connection.release();

                            connection.query("INSERT INTO juega_en (idUsuario, idPartida) values (?,?)", [partida.usuario, result.insertId], (err) => {
                                if (err) {
                                    callback(err)

                                } else {
                                    return null;
                                }
                            });
                            callback(null, result.insertId);
                            return;
                        }
                    });
            }
        });
    }

    buscar(email, idjugador, callback) {

        /* Implementar */
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            var sql = "Select u.login, u.id,pa.estado, pa.nombre,pa.id as idPartida from usuarios u inner join juega_en p on p.idUsuario= u.id inner join partidas pa on p.idPartida= pa.id WHERE idPartida=?";

            connection.query(sql, [email], (err, rows) => {
                if (err) {
                    callback(err);
                    return;
                }
                connection.release();
                if (rows.length === 0) {
                    callback(null, false);
                    return;
                } else {
                    let estado = JSON.parse(rows[0].estado);
                    let partida = {
                        estado: estado.estado,
                        lista: [],
                        cartasUsuario: [],
                        nombre: rows[0].nombre,
                        id: rows[0].idPartida,
                        enMesa: estado.enMesa
                    }

                    partida.lista.length = 4;
                    for (var k = 0; k < rows.length; k++) {
                        let element = rows[k];
                        for (var i = 1; i <= rows.length; ++i) {

                            if (element.id === parseInt(estado.usuarios["user" + i].id)) {
                                if (("user" + i) === estado.turno) {
                                    partida.lista[i - 1] = { nombre: element.login, cartas: estado.usuarios["user" + i].cartas.length, turno: "true" }
                                } else {
                                    partida.lista[i - 1] = { nombre: element.login, cartas: estado.usuarios["user" + i].cartas.length };
                                }
                            }
                            if (parseInt(idjugador) === parseInt(estado.usuarios["user" + i].id)) {
                                partida.cartasUsuario = estado.usuarios["user" + i].cartas;
                            }
                        }
                    }
                    return callback(null, partida);

                }
            });

        });
    }

    dameEstado(id, callback) {

        /* Implementar */
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            var sql = "Select p.* from partidas p where p.id=?";

            connection.query(sql, [id], (err, rows) => {
                if (err) {
                    callback(err);
                    return;
                }
                connection.release();
                if (rows.length === 0) {
                    callback(null, false);
                    return;
                } else {

                    let estado = JSON.parse(rows[0].estado);
                    let partida = {
                        id: rows[0].id,
                        nombre: rows[0].nombre,
                        estado: estado,
                    }
                    return callback(null, partida);


                }
            });

        });
    }


    descarta(partida, callback) {

        /* Implementar */
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            var sql = "Select p.estado from partidas p where id=?";

            connection.query(sql, [partida.id], (err, rows) => {
                if (err) {
                    callback(err);
                    return;
                }
                if (rows.length === 0) {
                    callback(null, false);
                    return;
                } else {

                    let estado = JSON.parse(rows[0].estado);

                    //BUSCAR USUARIO
                    console.log(estado)
                    console.log(partida)
                    let id = Object.keys(estado.usuarios)

                    for (var i = 1; i <= id.length; ++i) {

                        if (estado.usuarios["user" + i].id === partida.usuario) {
                            estado.usuarios["user" + i].cartas = partida.cartas;

                        }
                    }
                    estado = JSON.stringify(estado);

                    connection.query("UPDATE `partidas` SET `estado` = ? WHERE `partidas`.`id` = ?", [estado, partida.id], (err, result) => {

                        if (err) {
                            callback(err);
                        } else {
                            connection.release();

                            callback(null, true);
                        }
                    });

                }

            });
        });
    }





    realizaMovimiento(partida, callback) {

        /* Implementar */
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            var sql = "Select p.estado from partidas p where id=?";

            connection.query(sql, [partida.id], (err, rows) => {
                if (err) {
                    callback(err);
                    return;
                }
                if (rows.length === 0) {
                    callback(null, false);
                    return;
                } else {

                    let estado = JSON.parse(rows[0].estado);

                    //BUSCAR USUARIO

                    if (estado.enMesa === undefined)
                        estado.enMesa = {
                            numCartas: 0,
                            valor: -1,
                            ultimasCartas: [],
                            cartasEnMesa: []
                        };
                    estado.enMesa.numCartas = partida.enMesa.numCartas;
                    estado.enMesa.valor = partida.enMesa.valor;
                    estado.enMesa.ultimasCartas = partida.enMesa.cartasParaMesa;

                    let array = estado.enMesa.cartasEnMesa;
                    if (array === undefined) {
                        array = [];
                    }
                    estado.enMesa.cartasEnMesa = array.concat(partida.enMesa.cartasParaMesa)
                    let id = Object.keys(estado.usuarios)

                    for (var i = 1; i <= id.length; ++i) {
                        if (estado.usuarios["user" + i].id === partida.usuario) {
                            estado.usuarios["user" + i].cartas = partida.cartas;

                        }
                    }
                    let turno = estado.turno[4]
                    if (turno < 4)
                        turno++;
                    else
                        turno = 1;

                    estado.turno = "user" + turno;
                    estado = JSON.stringify(estado);

                    connection.query("UPDATE `partidas` SET `estado` = ? WHERE `partidas`.`id` = ?", [estado, partida.id], (err, result) => {

                        if (err) {
                            callback(err);
                        } else {
                            connection.release();

                            callback(null, true);
                        }
                    });

                }

            });
        });
    }

    //DALE LA CARTA 
    paraElMentiroso(idPartida, user,cartas, callback) {
        /* Implementar */
     
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            var sql = "Select p.estado from partidas p where id=?";

            connection.query(sql, [idPartida], (err, rows) => {
                if (err) {
                    callback(err);
                    return;
                }
                if (rows.length === 0) {
                    callback(null, false);
                    return;
                } else {

                    let estado = JSON.parse(rows[0].estado);
                    let cartasNuevas =  estado.usuarios[user].cartas.concat(cartas);
                   
                    estado.usuarios[user].cartas=cartasNuevas;
                    let turno = estado.turno[4]
                    console.log(estado.turno)

                    if (turno >1)
                        turno--;
                    else
                        turno = 4;
                    estado.turno = "user" + turno;
                    console.log(estado.turno)

                    estado = JSON.stringify(estado);

                    connection.query("UPDATE `partidas` SET `estado` = ? WHERE `partidas`.`id` = ?", [estado, idPartida], (err, result) => {

                        if (err) {
                            callback(err);
                        } else {
                            connection.release();

                            callback(null, true);
                        }
                    });

                }

            });
        });
    }



    actualizaPostMentira(partida, callback) {

        /* Implementar */
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            var sql = "Select p.estado from partidas p where id=?";

            connection.query(sql, [partida.id], (err, rows) => {
                if (err) {
                    callback(err);
                    return;
                }
                if (rows.length === 0) {
                    callback(null, false);
                    return;
                } else {

                    let estado = JSON.parse(rows[0].estado);

                    //BUSCAR USUARIO

                    estado.enMesa=partida.enMesa;
                    let id = Object.keys(estado.usuarios)
                    
                    for (var i = 1; i <= id.length; ++i) {
                        if (estado.usuarios["user" + i].id === partida.usuario) {
                            estado.usuarios["user" + i].cartas = partida.cartas;

                        }
                    }
              

                    let turno = estado.turno[4]
                    if (turno >1)
                        turno--;
                    else
                        turno = 4;

                    estado = JSON.stringify(estado);

                    connection.query("UPDATE `partidas` SET `estado` = ? WHERE `partidas`.`id` = ?", [estado, partida.id], (err, result) => {

                        if (err) {
                            callback(err);
                        } else {
                            connection.release();

                            callback(null, true);
                        }
                    });

                }

            });
        });
    }



}





module.exports = {
    DAO: DAO
}