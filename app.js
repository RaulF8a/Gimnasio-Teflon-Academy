import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import ejs from 'ejs';
import mysql2 from 'mysql2';
import bycrypt from 'bcryptjs';

const app = express ();
const __dirname = path.resolve ();

// Conexion a la base de datos.
let conexion = mysql2.createConnection ({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "Gimnasio_Teflon_Ac"
});

conexion.connect ((err) => {
    if (err) throw err;
    
    console.log ("Conexion exitosa.");
});

// Configuraciones de aplicacion.
app.use (bodyParser.urlencoded ({extended: true}));
app.use (express.static ("public"));
app.set ("view engine", "ejs");

// Variables globales.
let passRequested = false;
let usuarioRegistrado = {
    id:"",
    nombre:"",
    puesto:""
};
let usuarioSesionIniciada = {
    id:"",
    nombre:"",
    puesto:""
};
let atletaBuscado = {
    id:"",
    nombre:"",
    puesto:"" 
};
let carrito = [];
let sesionIniciada = false;
let campoEditar = "";
let idEditar = "";
let idPagar = "";
let idResumen = "";
let enviadoDesdePago = false;
let enviadoDesdeRegistroAtleta = false;
let enviadoDesdeResumen = false;
let nuevoPeso = 0;
let nuevaEstatura = 0;
let cuentaBuscada = {};

// Para generar un administrador la primera ejecucion.
// sesionIniciada = true;
// usuarioSesionIniciada.puesto = "Administrativo";

// Generar ID de usuario.
function generarID () {
    const letras = ["A", "B", "C", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    const numeros = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let id = "";
    let random;

    // Generar letras
    for (let index = 0; index < 5; index++) {
        random = Math.floor(Math.random() * (25 - 0)) + 0;
        id = id+letras[random];
    }

    // Generar numeros
    for (let index = 0; index < 5; index++) {
        random = Math.floor(Math.random() * (10 - 0)) + 0;
        id = id+numeros[random];
    }
    
    return id;
}

function validarFecha (fechaNacimiento, fechaActual){
    // Un menor de 15 años no puede trabajar.
    if (fechaNacimiento.getFullYear () > fechaActual.getFullYear () - 15){
        // console.log ("Fecha no valida.");
        return false;
    }

    if (fechaNacimiento.getFullYear () === fechaActual.getFullYear () - 15){
        if (fechaNacimiento.getMonth () < fechaActual.getMonth ()){
            // console.log ("Fecha no valida porque no ha llegado el mes.");
            return false;
        }
        else if (fechaNacimiento.getMonth () === fechaNacimiento.getMonth ()){
            if (fechaNacimiento.getDay () > fechaActual.getDay ()){
                // console.log ("Fecha no valida porque no ha llegado el dia.");
                return false;
            }
        }
    }

    return true;
}

function eliminarProductoEnCarrito (nombreProducto) {
    for (let index = 0; index < carrito.length; index++) {
        if (carrito[index].nombre === nombreProducto){
            carrito.splice (index, 1);
        }
    }
}

function generarNumeroCuenta () {
    const letras = ["A", "B", "C", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    const numeros = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let id = "";
    let random;

    // Generar letras
    for (let index = 0; index < 2; index++) {
        random = Math.floor(Math.random() * (25 - 0)) + 0;
        id = id+letras[random];
    }

    id += "-";

    for (let index = 0; index < 4; index++) {
        random = Math.floor(Math.random() * (10 - 0)) + 0;
        id = id+numeros[random];
    }

    return id;
}

function obtenerFecha () {
    let fecha = new Date ().getFullYear ().toString () + "-";
    fecha += ((new Date ().getMonth ()) + 1).toString ();
    fecha += "-"
    fecha += (new Date ().getDate ()).toString ();

    return fecha;
}

function obtenerHora () {
    let horas = new Date ().getHours ().toString ();
    let minutos = new Date ().getMinutes ().toString ();
    let segundos = new Date ().getSeconds ().toString ();

    let hora = horas + ":" + minutos + ":" + segundos;

    return hora;
}

function calcularDias (fecha) { 
    let fechaActual = new Date ();
    let fechaAnterior = new Date (fecha);
    fechaActual.setHours (0);
    fechaActual.setMinutes (0);
    fechaActual.setSeconds (0);
    fechaActual.setMilliseconds (0);

    let dias = (fechaActual.getTime () - fechaAnterior.getTime ()) / (1000 * 3600 * 24);

    return dias.toFixed (0);
}

function determinarPagoVencido () {
    let dias = 0;
    let tipoMembresia = "";
    let fechaPago = "";

    conexion.query (`SELECT pago_membresia.id_cliente, pago_membresia.fecha_pago, cliente.tipo_membresia 
    FROM pago_membresia INNER JOIN cliente ON cliente.id_cliente = pago_membresia.id_cliente
    AND pago_membresia.id_cliente = "${usuarioSesionIniciada.id}";`, async (err, datos) => {
        if (err) throw err;

        console.log (datos);
        tipoMembresia = datos[0].tipo_membresia;
        fechaPago = datos[0].fecha_pago;
        
        dias = await calcularDias (fechaPago);    
        if (tipoMembresia === "Semanal") {
            console.log ("Semanal");
        }
        else if (tipoMembresia === "Mensual") {
            console.log ("Mensual");
        }
        else if (tipoMembresia === "Anual") {
            console.log ("Anual");
        }
    
        if ((dias > 7 || dias <= 14) || (dias > 30 || dias <= 37) || (dias > 365 || dias <= 372)){
            return "Estas dentro de la semana de tolerancia. Recomendamos pagar lo antes posible.";
        }
        else if (dias > 14|| dias > 37 || dias > 372) {
            return "Tienes un saldo pendiente. Liquidalo de inmediato.";
        }
        else{
            return "";
        }
    });

}

function capitalizar (cadena) {
    let cadenaCapitalizada = cadena.split(" ");

    for (let i = 0; i < cadenaCapitalizada.length; i++) {
        cadenaCapitalizada[i] = cadenaCapitalizada[i][0].toUpperCase() + cadenaCapitalizada[i].substr(1);
    }

    cadenaCapitalizada = cadenaCapitalizada.join(" ");

    return cadenaCapitalizada;
}

// Ruta Home
app.get ("/", (req, res) => {
    res.render ("home", {titulo: "Gimnasio Teflon Academy", usuario: usuarioSesionIniciada.nombre, 
    login: false, sesion: sesionIniciada, mensajeError: ""});

})
.post ("/", (req, res) => {
    res.redirect ("/registroAcceso")
});

// Ruta login
app.get ("/login", (req, res) => {
    res.render ("login", {titulo: "Login", usuario: usuarioSesionIniciada.nombre, login: true, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/login", async (req, res) => {
    const usuario = req.body.user;
    const pass = req.body.password;

    let passCrypt = await bycrypt.hash (pass, 8);

    if (!(usuario && pass)){
        res.render ("login", {titulo: "Login", usuario: usuarioSesionIniciada.nombre, login: true, sesion: sesionIniciada, 
        mensajeError: "No has rellenado alguno de los campos."});

        return;
    }

    conexion.query (`SELECT * FROM users WHERE user='${usuario}';`, async (err, datos) => {
        if (err) throw err;

        if (datos.length === 0 || !(await bycrypt.compare (pass, datos[0].pass))){
            res.render ("login", {titulo: "Login", usuario: usuarioSesionIniciada.nombre, login: true, sesion: sesionIniciada, 
            mensajeError: "Usuario y/o contraseña incorrecto."});

            return;
        } 

        conexion.query (`SELECT * FROM gimnasio_teflon_ac.personal WHERE id="${usuario}"`, async (err, datosE) =>{
            if (datosE.length === 0){
                conexion.query (`SELECT * FROM gimnasio_teflon_ac.cliente WHERE id_cliente="${usuario}"`, (err, datosA) => {
                    usuarioSesionIniciada.id = datosA[0].id_cliente;
                    usuarioSesionIniciada.nombre = datosA[0].nombre_cliente;
                    usuarioSesionIniciada.puesto = "Atleta";
                });
            }
            else{
                usuarioSesionIniciada.id = datosE[0].id;
                usuarioSesionIniciada.nombre = datosE[0].nombre;
                usuarioSesionIniciada.puesto = datosE[0].puesto;
            }
        });

        sesionIniciada = true;
        res.redirect ("/menuPrincipal");
    });

});

app.get ("/logout", (req, res) => {
    sesionIniciada = false;
    usuarioSesionIniciada.id = "";
    usuarioSesionIniciada.nombre = "";
    usuarioSesionIniciada.puesto = "";

    res.redirect ("/");
});

// Ruta menuPrincipal
app.get ("/menuPrincipal", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }
    
    if (usuarioSesionIniciada.puesto === "Atleta") {
        let dias = 0;
        let tipoMembresia = "";
        let fechaPago = "";
        let pagoVencido = "";
        conexion.query (`SELECT pago_membresia.id_cliente, pago_membresia.fecha_pago, cliente.tipo_membresia 
        FROM pago_membresia INNER JOIN cliente ON cliente.id_cliente = pago_membresia.id_cliente
        AND pago_membresia.id_cliente = "${usuarioSesionIniciada.id}";`, (err, datos) => {
            if (err) throw err;
            
            tipoMembresia = datos[0].tipo_membresia;
            fechaPago = datos[0].fecha_pago;
            
            dias = calcularDias (fechaPago);

            if (tipoMembresia === "Semanal") {
                if (dias > 7 && dias <= 14){
                    pagoVencido = "Estas dentro de la semana de tolerancia. Recomendamos pagar lo antes posible.";
                }
                else if (dias > 14) {
                    pagoVencido = "Tienes un saldo pendiente. Liquidalo de inmediato.";
                }
                else{
                    pagoVencido = "";
                }
            }
            else if (tipoMembresia === "Mensual") {
                if (dias > 30 && dias <= 37){
                    pagoVencido = "Estas dentro de la semana de tolerancia. Recomendamos pagar lo antes posible.";
                }
                else if (dias > 37) {
                    pagoVencido = "Tienes un saldo pendiente. Liquidalo de inmediato.";
                }
                else{
                    pagoVencido = "";
                }
            }
            else if (tipoMembresia === "Anual") {
                if (dias >= 365 && dias <= 372){
                    pagoVencido = "Estas dentro de la semana de tolerancia. Recomendamos pagar lo antes posible.";
                }
                else if (dias > 372) {
                    pagoVencido = "Tienes un saldo pendiente. Liquidalo de inmediato.";
                }
                else{
                    pagoVencido = "";
                }
            }
            console.log (pagoVencido);
            if (pagoVencido.length !== 0){
                res.render ("menuPrincipal", {titulo: "Menu Principal", usuario: usuarioSesionIniciada.nombre, login: false, 
                sesion: sesionIniciada, mensajeError:pagoVencido, privilegio:usuarioSesionIniciada.puesto});
    
                return;
            }
            else {
                res.render ("menuPrincipal", {titulo: "Menu Principal", usuario: usuarioSesionIniciada.nombre, login: false, 
                sesion: sesionIniciada, mensajeError:"", privilegio:usuarioSesionIniciada.puesto});
    
                return;
            }
        });
    }
    else{
        res.render ("menuPrincipal", {titulo: "Menu Principal", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", privilegio:usuarioSesionIniciada.puesto});
    }
    
})
.post ("/menuPrincipal", (req, res) => {
    // Cuando seleccione editar empleado o atleta, redirigir primero a buscar.
});

// Ruta pagoMembresia
app.get ("/pagoMembresia", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    if (idPagar.length === 0) {
        enviadoDesdePago = true;
        res.redirect ("/buscarAtleta");

        return;
    }

    let tipoMembresia = "";
    let precio = 0;

    conexion.query (`SELECT tipo_membresia FROM cliente WHERE id_cliente="${idPagar}";`, (err, datos) => {
        if (err) throw err;

        tipoMembresia = datos[0].tipo_membresia;

        conexion.query (`SELECT costo_membresia FROM membresias WHERE tipo_membresia="${tipoMembresia}"`, (err, datosM) => {
            if (err) throw err;

            precio = datosM[0].costo_membresia;
            
            res.render ("pagoDeMembresia", {titulo: "Pago de Membresia", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "", tipoMembresia:tipoMembresia, costoMembresia:precio, cambio:-0.0000001});
        });
    });

})
.post ("/pagoMembresia", (req, res) => {
    const total = req.body.total;
    const montoPagado = req.body.montoPagado;
    const tipoMembresia = req.body.membresia;

    let cambio = montoPagado - total;
    cambio = cambio.toFixed (2);  

    res.render ("pagoDeMembresia", {titulo: "Pago de Membresia", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", tipoMembresia:tipoMembresia, costoMembresia:total, cambio:cambio});
});

app.post ("/guardarPagoMembresia", (req, res) => {
    let fecha = obtenerFecha ();
    const tipoMembresia = req.body.tipoMembresia;

    conexion.query (`SELECT id_pago_membresia FROM pago_membresia WHERE id_cliente="${idPagar}";`,
    (err, datos) => {
        if (err) throw err;

        if (datos.length === 0) {
            conexion.query (`INSERT INTO pago_membresia SET ?`, {id_cliente:idPagar, fecha_pago:fecha, tipo_membresia:tipoMembresia}, 
            (err) => {
                if (err) throw err;
            });
        
            idPagar = "";
            enviadoDesdePago = false;
            enviadoDesdeRegistroAtleta = false;
        
            res.redirect ("/menuPrincipal");
            
            return;
        }
        
        else { 
            conexion.query (`DELETE FROM pago_membresia WHERE id_pago_membresia=${datos[0].id_pago_membresia};`, (err) => {
                if (err) throw err;
                conexion.query (`INSERT INTO pago_membresia SET ?`, {id_cliente:idPagar, fecha_pago:fecha, tipo_membresia:tipoMembresia}, 
                (err) => {
                    if (err) throw err;
                });
            
                idPagar = "";
                enviadoDesdePago = false;
                enviadoDesdeRegistroAtleta = false;
            
                res.redirect ("/menuPrincipal");

                return;
            });
        }


    });

});

// Ruta registroAcceso
app.get ("/registroAcceso", (req, res) => {
    res.render ("registroAcceso", {titulo: "Registro de Acceso", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/registroAcceso", (req, res) => {
    const id = req.body.id;
    let fechaIngreso = obtenerFecha ();
    let horaIngreso = obtenerHora ();

    conexion.query (`SELECT id_cliente FROM cliente WHERE id_cliente="${id}";`, (err, datos) => {
        if (err) throw err;

        if (datos.length === 0) {
            res.render ("registroAcceso", {titulo: "Registro de Acceso", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "El ID no existe."});

            return; 
        }

        conexion.query (`INSERT INTO visitas SET ?`, {id_cliente:id, fecha:fechaIngreso, hora:horaIngreso}, (err) => {
            if (err) throw err;

            res.render ("registroAcceso", {titulo: "Registro de Acceso", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "Visita registrada."});

            return;
        });
    });

});

// Ruta verRegistroAcceso
app.get ("/verRegistroAcceso", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    conexion.query (`SELECT * FROM visitas;`, (err, datos) => {
        res.render ("verRegistroAcceso", {titulo: "Registro de Acceso", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", listaAccesos:datos});
    });
})
.post ("/verRegistroAcceso", (req, res) => {
    res.redirect ("/menuPrincipal");
});

// Ruta crearContraseña
app.get ("/crearContrasenia", (req, res) => {
    if (!passRequested){
        res.redirect ("/menuPrincipal");

        return;
    }

    res.render ("crearContrasenia", {titulo: "Crear Contraseña", usuario: usuarioSesionIniciada.nombre, login: false, sesion: sesionIniciada, 
    mensajeError: "", idUsuario:usuarioRegistrado.id});
})
.post ("/crearContrasenia", async (req, res) => {
    const pass = req.body.password;
    const conPass = req.body.confirmPassword;

    if (!(pass === conPass)){
        res.render ("crearContrasenia", {titulo: "Crear Contraseña", usuario: usuarioSesionIniciada.nombre, login: false, sesion: sesionIniciada, 
        mensajeError: "Las contraseñas no coinciden.", idUsuario:usuarioRegistrado.id});

        return;
    }

    let passCrypt = await bycrypt.hash (pass, 8);

    conexion.query ("INSERT INTO users SET ?", {user:usuarioRegistrado.id, pass:passCrypt, rol:usuarioRegistrado.puesto});

    passRequested = false;

    if (enviadoDesdeRegistroAtleta) {
        enviadoDesdeRegistroAtleta = false;
        res.redirect ("/pagoMembresia");
    }
    else {
        res.redirect ("/menuPrincipal");
    }
});

// Ruta agregarAtleta
app.get ("/registrarAtleta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    res.render ("registroAtleta", {titulo: "Registrar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/registrarAtleta", (req, res) => {
    let fechaNacimiento = new Date (req.body.fechaNacimiento);
    let fechaActual = new Date ();
    let fechaValida;
    usuarioRegistrado.id = "";
    usuarioRegistrado.nombre = "";
    usuarioRegistrado.puesto = "";

    fechaValida = validarFecha (fechaNacimiento, fechaActual);

    if (!fechaValida){
        res.render ("registroAtleta", {titulo: "Registrar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "La fecha de nacimiento no es válida."});
        
        return;
    }

    const id = generarID ();
    const nombre = req.body.nombre;
    const curp = req.body.curp;
    const telefono = req.body.telefono;
    const membresia = req.body.membresia;
    const altura = req.body.altura;
    const peso = req.body.peso;
    let fechaInscripcion = obtenerFecha ();
    fechaNacimiento = req.body.fechaNacimiento;

    conexion.query (`INSERT INTO cliente SET ?`, {id_cliente:id, nombre_cliente:nombre, curp:curp, tel_cliente:telefono,
    peso:peso, altura:altura, fecha_nacimiento:fechaNacimiento, fecha_inscripcion:fechaInscripcion, tipo_membresia:membresia},
    (err) => {
        if (err) {
            console.log (err);

            res.render ("registroAtleta", {titulo: "Registrar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "Ocurrio un error. Vuelve a intentarlo."});
        
            return;  
        }
        else{
            usuarioRegistrado.id = id;
            usuarioRegistrado.nombre = nombre;
            usuarioRegistrado.puesto = "Atleta";
            let imc = (peso / (Math.pow (altura, 2))).toFixed (2);
            
            conexion.query (`INSERT INTO bitacoras SET ?`, {id_cliente:id, imc_cliente:imc, objetivo:"", peso:peso, altura:altura},
            (err) => {
                if (err) throw err;
            });

            passRequested = true;
            enviadoDesdeRegistroAtleta = true;
            idPagar = id;
            res.redirect ("/crearContrasenia");
        }
    });

});

// Ruta editarAtleta
app.get ("/editarAtleta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    if (campoEditar.length === 0){
        res.redirect ("/buscarAtleta");
        
        return;
    }

    res.render ("editarAtleta", {titulo: "Editar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", campoEditarP: campoEditar});
})
.post ("/editarAtleta", (req, res) => {
    // Al terminar de editar, hay que reiniciar la variable que contiene el campo.
    const nuevoValor = req.body.nuevoValor;

    if (campoEditar === "nombre_cliente" || campoEditar === "curp" || campoEditar === "tel_cliente" || 
    campoEditar === "fecha_nacimiento" || campoEditar === "tipo_membresia"){
        conexion.query (`UPDATE cliente SET ${campoEditar}="${nuevoValor}" WHERE id_cliente="${idEditar}";`, (err) => {
            if (err) throw err;
        });
    }
    else{
        conexion.query (`UPDATE cliente SET ${campoEditar}=${nuevoValor} WHERE id_cliente="${idEditar}";`, (err) => {
            if (err) throw err;
        });
    }

    campoEditar = "";
    idEditar = "";
    res.redirect ("/menuPrincipal");
});

// Ruta eliminarAtleta
app.get ("/eliminarAtleta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    res.render ("eliminarAtleta", {titulo: "Eliminar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/eliminarAtleta", (req, res) => {
    const id = req.body.id;

    conexion.query (`DELETE FROM cliente WHERE id_cliente="${id}"`, (err) => {
        if (err) {
            console.error (err);
            res.render ("eliminarAtleta", {titulo: "Eliminar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "Ocurrio un error. Vuelve a intentarlo."});

            return;
        }
    });
    
    res.redirect ("/menuPrincipal");
});

app.get ("/seleccionarCampoAtleta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("seleccionarCampoAtleta", {titulo: "Seleccionar Campo", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/seleccionarCampoAtleta", (req, res) => {
    // Redirigir a editar Atleta con el campo seleccionado.
    campoEditar = req.body.campoEditar;
    res.redirect ("/editarAtleta");
});

// Buscar Atleta
app.get ("/buscarAtleta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("buscarAtleta", {titulo: "Buscar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/buscarAtleta", (req, res) => {
    // Si se encuentra el atleta, redirigir a seleccionar campo.
    const id = req.body.id;

    conexion.query (`SELECT * FROM cliente WHERE id_cliente="${id}"`, (err, datos) => {
        if (err) throw err;

        if (datos.length === 0) {
            res.render ("buscarAtleta", {titulo: "Buscar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "No se encontro el atleta."});

            return;
        }

        // Determinar desde donde se hizo la solicitud de busqueda.
        if (enviadoDesdePago){
            idPagar = datos[0].id_cliente;
            res.redirect ("/pagoMembresia");
        }
        else if (enviadoDesdeResumen) {
            idResumen = datos[0].id_cliente;
            res.redirect ("/actualizarPeso");
        }
        else{
            idEditar = datos[0].id_cliente;
            res.redirect ("/seleccionarCampoAtleta");
        }
    });

});

app.get ("/actualizarPeso", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("actualizarPeso", {titulo: "Actualizar Peso y Estatura", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/actualizarPeso", (req, res) => {
    // Obtener los nuevos valores de peso y altura en variables globales.
    nuevoPeso = req.body.nuevoPeso;
    nuevaEstatura = req.body.nuevaAltura;

    res.redirect ("/resumen");
});

// Ruta resumen del atleta.
app.get ("/resumen", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto === "Atleta") {
        // A un atleta no se le permite modificar sus atributos.

        conexion.query (`SELECT * FROM bitacoras WHERE id_cliente="${usuarioSesionIniciada.id}"`, (err, datos) => {
            res.render ("resumen", {titulo: "Resumen de Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "", resultados:datos, nuevoPeso:0, nuevaEstatura:0,
            privilegio:usuarioSesionIniciada.puesto});
        });

        return;
    }

    // Si aun no se tiene el ID del cliente, debemos redirigir a la busqueda.
    if (idResumen.length === 0){
        enviadoDesdeResumen = true;
        res.redirect ("/buscarAtleta");

        return;
    }
    
    // Si ya se obtuvo, realizamos la consulta para obtener su bitacora.
    conexion.query (`SELECT * FROM bitacoras WHERE id_cliente="${idResumen}";`, (err, datos) => {
        if (err) throw err;
        
        res.render ("resumen", {titulo: "Resumen de Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", resultados:datos, nuevoPeso:nuevoPeso, nuevaEstatura:nuevaEstatura,
        privilegio:usuarioSesionIniciada.puesto});
    });

})
.post ("/resumen", (req, res) => {
    // Calculamos el nuevo IMC.
    let nuevoIMC = (nuevoPeso / (Math.pow (nuevaEstatura, 2))).toFixed (2);

    // Actualizamos valores de altura, peso, e IMC en la bitacora.
    conexion.query (`UPDATE bitacoras SET peso=${nuevoPeso}, altura=${nuevaEstatura}, imc_cliente=${nuevoIMC}
    WHERE id_cliente="${idResumen}";`, (err) =>{
        if (err) throw err;
    });

    // Reiniciamos las variables y redirigimos.
    enviadoDesdeResumen = false;
    nuevoPeso = 0;
    nuevaEstatura = 0;
    res.redirect ("/establecerNuevoObjetivo");
});

app.get ("/establecerNuevoObjetivo", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }
    
    res.render ("establecerObjetivo", {titulo: "Establecer Nuevo Objetivo", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/establecerNuevoObjetivo", (req, res) => {
    const objetivo = req.body.objetivo;

    // Establecemos el nuevo objetivo.
    conexion.query (`UPDATE bitacoras SET objetivo="${objetivo}" WHERE id_cliente="${idResumen}";`, (err) =>{
        if (err) throw err;
    });

    idResumen = "";
    res.redirect ("/menuPrincipal");
});

app.post ("/resumenAtleta", (req, res) => {
    // Al atleta directamente lo regresamos al menu principal.
    res.redirect ("/menuPrincipal");
});

// Ruta agregarEmpleado
app.get ("/registrarEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    res.render ("registroEmpleado", {titulo: "Registrar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/registrarEmpleado", (req, res) => {
    let fechaNacimiento = new Date (req.body.fechaNacimiento);
    let fechaActual = new Date ();
    let fechaValida;
    usuarioRegistrado.id = "";
    usuarioRegistrado.nombre = "";
    usuarioRegistrado.puesto = "";
    
    fechaValida = validarFecha (fechaNacimiento, fechaActual);

    if (!fechaValida){
        res.render ("registroEmpleado", {titulo: "Registrar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "La fecha de nacimiento no es válida."});
        
        return;
    }

    const id = generarID ();
    const nombre = req.body.nombreCompleto;
    const curp = req.body.curp;
    const sueldo = req.body.sueldo;
    const fechaN = req.body.fechaNacimiento;
    const telefono = req.body.telefono;
    const rfc = req.body.rfc;
    const escolaridad = req.body.escolaridad;
    const puesto = req.body.puesto;

    conexion.query ("INSERT INTO personal SET ?", {id:id, nombre:nombre, curp:curp, sueldo:sueldo, fechaNacimiento:fechaN, 
    rfc:rfc, escolaridad:escolaridad, telefono:telefono, puesto:puesto}, (err, results) => {
        if (err){
            // console.log (err);
            res.render ("registroEmpleado", {titulo: "Registrar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "Ocurrio un error. Vuelvelo a intentar."});
        }
        else{
            usuarioRegistrado.id = id;
            usuarioRegistrado.nombre = nombre;
            usuarioRegistrado.puesto = puesto;
            
            console.log (usuarioRegistrado);
            passRequested = true;
            res.redirect ("/crearContrasenia");
        }
    });

});

app.get ("/buscarEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("buscarEmpleado", {titulo: "Buscar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""}); 
})
.post ("/buscarEmpleado", (req, res) => {
    const id = req.body.id;

    conexion.query (`SELECT * FROM personal WHERE id="${id}"`, (err, datos) => {
        if (err) throw err;

        if (datos.length === 0) {
            res.render ("buscarEmpleado", {titulo: "Buscar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "No se encontro el empleado."});

            return;
        }

        idEditar = datos[0].id;
        res.redirect ("/seleccionarCampoEmpleado");
    });
});

app.get ("/seleccionarCampoEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("seleccionarCampoEmpleado", {titulo: "Seleccionar Campo", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/seleccionarCampoEmpleado", (req, res) => {
    campoEditar = req.body.campoEditar;
    res.redirect ("/editarEmpleado");  
});

// Ruta editarEmpleado
app.get ("/editarEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    if (campoEditar.length === 0){
        res.redirect ("/buscarEmpleado");
        
        return;
    }

    res.render ("editarEmpleado", {titulo: "Editar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", campoEditarP: campoEditar});
})
.post ("/editarEmpleado", (req, res) => {
    const nuevoValor = req.body.nuevoValor;

    if (campoEditar === "nombre" || campoEditar === "curp" || campoEditar === "telefono" || 
    campoEditar === "fechaNacimiento" || campoEditar === "rfc" || campoEditar === "escolaridad" || campoEditar === "puesto"){
        conexion.query (`UPDATE personal SET ${campoEditar}="${nuevoValor}" WHERE id="${idEditar}";`, (err) => {
            if (err) throw err;
        });
    }
    else{
        conexion.query (`UPDATE personal SET ${campoEditar}=${nuevoValor} WHERE id="${idEditar}";`, (err) => {
            if (err) throw err;
        });
    }

    campoEditar = "";
    idEditar = "";
    res.redirect ("/menuPrincipal"); 
});

// Ruta eliminarEmpleado
app.get ("/eliminarEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    res.render ("eliminarEmpleado", {titulo: "Eliminar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/eliminarEmpleado", (req, res) => {
    const id = req.body.id;

    conexion.query (`DELETE FROM personal WHERE id="${id}"`, (err) => {
        if (err) {
            res.render ("eliminarEmpleado", {titulo: "Eliminar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "Ocurrio un error. Vuelve a intentarlo."});

            return;
        }
    });
    
    res.redirect ("/menuPrincipal");
});

// Ruta puntoVentaMenu
app.get ("/puntoVentaMenu", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };
    
    res.render ("puntoVentaMenu", {titulo: "Punto de Venta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaMenu", (req, res) => {
    //
});

// Ruta puntoVentaCarrito
app.get ("/puntoVentaCarrito", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };
    
    res.render ("puntoVentaCarrito", {titulo: "Carrito", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", carritoCompras:carrito, capitalizar:capitalizar});
})
.post ("/puntoVentaCarrito", (req, res) => {
    // Arreglo de JSON con {nombre, precio}
    const productoBuscado = req.body.newItem.toLowerCase ();

    conexion.query (`SELECT * FROM productos WHERE nombre="${productoBuscado}"`, (err, results) => {
        if (err) throw err;

        if (results.length === 0){
            res.render ("puntoVentaCarrito", {titulo: "Carrito", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "No se encontro el producto.", carritoCompras:carrito, capitalizar:capitalizar});

            return;
        }

        let producto = {id:results[0].id_producto, nombre:results[0].nombre, precio:results[0].precio.toString (), cantidad:"1",
        existencia:results[0].existencia};
        carrito.push (producto);

        res.redirect ("/puntoVentaCarrito");
    });
    
});

app.post ("/borrarProducto", (req, res) => {
    const nombreProducto = req.body.checkbox;
   
    eliminarProductoEnCarrito (nombreProducto);

    res.redirect ("/puntoVentaCarrito");
});

app.post ("/modificarCantidad", (req, res) => {
    const nuevoValor = req.body.cantidad;
    const productoModificado = req.body.producto;

    for (let index = 0; index < carrito.length; index++){
        if (carrito[index].nombre === productoModificado) {
            carrito[index].cantidad = nuevoValor;
        }
    }

    res.redirect ("/puntoVentaCarrito");
});

// Ruta puntoVentaTotal
app.get ("/puntoVentaTotal", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    let total = 0;

    // console.log (carrito);

    for (let index = 0; index < carrito.length; index++){
        total += (parseFloat (carrito[index].precio) * parseInt (carrito[index].cantidad));
    }

    total = total.toFixed (2);

    res.render ("puntoVentaTotal", {titulo: "Resumen de Compras", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", carritoCompras:carrito, totalCuenta:total, cambio:-0.0000001,
    numeroCuenta:"", capitalizar:capitalizar});
})
.post ("/puntoVentaTotal", (req, res) => {
    const total = req.body.total;
    const montoPagado = req.body.montoPagado;
    let numeroCuenta = generarNumeroCuenta ();

    let cambio = montoPagado - total;
    cambio = cambio.toFixed (2);

    res.render ("puntoVentaTotal", {titulo: "Resumen de Compras", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", carritoCompras:carrito, totalCuenta:total, cambio:cambio, 
    numeroCuenta:numeroCuenta, capitalizar:capitalizar});
});

app.post ("/guardarCuenta", (req, res) => {
    const total = req.body.total;
    let numeroCuenta = req.body.numeroCuenta;
    let nuevaExistencia = 0;
    let fecha = obtenerFecha ();
    let cantidadComprada = 0;
    let productoActualNombre = "";
    let totalProductoActual = 0;
    let productosVendidos = 0;
    let idActual = 0;

    // console.log (numeroCuenta);

    // Actualizar la existencia.
    // for (let index = 0; index < carrito.length; index++){
    //     cantidadComprada = parseInt (carrito[index].cantidad);
    //     productosVendidos += cantidadComprada;
    //     productoActual = carrito[index].id;

    //     conexion.query (`SELECT existencia FROM productos WHERE nombre="${productoActual}"`, (err, datos) => {
    //         if (err) throw err;

    //         nuevaExistencia = datos[0].existencia - cantidadComprada;
    //         conexion.query (`UPDATE productos SET existencia=${nuevaExistencia} WHERE id_producto=${productoActual}`);
    //     });
    // }

    carrito.forEach ((elemento) => {
        cantidadComprada = parseInt (elemento.cantidad);
        productosVendidos += cantidadComprada;
        idActual = elemento.id;
        productoActualNombre = elemento.nombre;
        nuevaExistencia = elemento.existencia - cantidadComprada;
        
        conexion.query (`UPDATE productos SET existencia=${nuevaExistencia} WHERE id_producto=${idActual}`, (err) => {
            if (err) throw err;
        });
    });

    // Crear una cuenta.
    conexion.query (`INSERT INTO venta SET ?`, {id_venta:numeroCuenta, fecha:fecha, total:total, 
    cantidadProductos:productosVendidos});
    
    carrito.forEach ((elemento) => {
        idActual = elemento.id;
        cantidadComprada = parseInt (elemento.cantidad);
        totalProductoActual = parseFloat (parseFloat (elemento.precio) * cantidadComprada);

        conexion.query (`INSERT INTO detalle_venta SET ?`, {id_producto:idActual, cantidad:cantidadComprada,
        total:totalProductoActual, id_venta:numeroCuenta}, (err) => {
            if (err) throw err;
        });
    });
    
    // Crear el reporte de venta.
    // for (let index = 0; index < carrito.length; index++){
    //     idActual = carrito[index].id;
    //     cantidadComprada = parseInt (carrito[index].cantidad);
    //     totalProductoActual = parseFloat (parseFloat (carrito[index].precio) * cantidadComprada);

    //     console.log (idActual);
    //     console.log (productoActual);
    //     console.log (cantidadComprada);
    //     console.log (totalProductoActual);

    //     conexion.query (`SELECT id_producto FROM productos WHERE nombre="${productoActual}"`, (err, datos) => {
    //         if (err) throw err;
    //         id = datos[0].id_producto;   
    //     });
        
    //     conexion.query (`INSERT INTO detalle_venta SET ?`, {id_producto:idActual, cantidad:cantidadComprada,
    //     total:totalProductoActual, id_venta:numeroCuenta}, (err) => {
    //         if (err) throw err;
    //     });
    // }

    carrito = [];
    res.redirect ("/puntoVentaMenu");
});

// Ruta puntoVentaAñadirInventario
app.get ("/puntoVentaAnadirInventario", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    res.render ("puntoVentaAnadirInventario", {titulo: "Añadir al Inventario", usuario: usuarioSesionIniciada.nombre, 
    login: false, sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaAnadirInventario", (req, res) => {
    const nombreProducto = req.body.nombre.toLowerCase ();
    const descripcion = req.body.descripcion;
    const precio = parseFloat (req.body.precio);
    const existencia = parseInt (req.body.existencia);

    conexion.query (`INSERT INTO productos SET ?`, {nombre:nombreProducto, descripcion: descripcion, precio:precio,
    existencia:existencia}, (err) => {
        if (err){
            console.error (err);

            res.render ("puntoVentaAnadirInventario", {titulo: "Añadir al Inventario", usuario: usuarioSesionIniciada.nombre, 
            login: false, sesion: sesionIniciada, mensajeError: "Ocurrio un error. Intentalo de nuevo."});
            
            return;
        }
    });

    res.redirect ("/puntoVentaMenu");
});

// Ruta puntoVentaEliminarInventario
app.get ("/puntoVentaEliminarInventario", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    res.render ("puntoVentaEliminarInventario", {titulo: "Eliminar del Inventario", usuario: usuarioSesionIniciada.nombre, 
    login: false, sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaEliminarInventario", (req, res) => {
    const nombreProducto = req.body.nombre.toLowerCase ();

    conexion.query (`SELECT id_producto FROM productos WHERE nombre="${nombreProducto}";`, (err, datos) => {
        if (err) throw err;

        if (datos.length === 0) {
            res.render ("puntoVentaEliminarInventario", {titulo: "Eliminar del Inventario", usuario: usuarioSesionIniciada.nombre, 
            login: false, sesion: sesionIniciada, mensajeError: "No se encontro el producto."});
    
            return;
        }

        conexion.query (`DELETE FROM productos WHERE id_producto=${datos[0].id_producto}`, (err) => {
            if (err) throw err;
        });

        res.redirect ("/puntoVentaMenu");
    });
});

app.get ("/puntoVentaEditarInventario", (req, res) => {
    if (!sesionIniciada) {
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    if (campoEditar.length === 0){
        res.redirect ("/buscarProducto");
        
        return;
    }

    res.render ("puntoVentaEditarInventario", {titulo: "Editar Inventario", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", campoEditarP: campoEditar});
})
.post ("/puntoVentaEditarInventario", (req, res) => {
    const nuevoValor = req.body.nuevoValor;

    if (campoEditar === "precio") {
        conexion.query (`UPDATE productos SET precio=${nuevoValor} WHERE id_producto=${idEditar};`);
    }
    else if (campoEditar === "existencia") {
        conexion.query (`UPDATE productos SET existencia=${nuevoValor} WHERE id_producto=${idEditar};`);
    }
    else if (campoEditar === "nombre") {
        conexion.query (`UPDATE productos SET ${campoEditar}="${nuevoValor.toLowerCase ()}" WHERE id_producto=${idEditar};`);
    }
    else {
        conexion.query (`UPDATE productos SET ${campoEditar}="${nuevoValor}" WHERE id_producto=${idEditar};`);
    }

    campoEditar = "";
    idEditar = "";

    res.redirect ("/puntoVentaMenu");
});

app.get ("/buscarProducto", (req, res) => {
    if (!sesionIniciada) {
        res.redirect ("/login");

        return;
    }

    res.render ("buscarProducto", {titulo: "Buscar Producto", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/buscarProducto", (req, res) => {
    const producto = req.body.producto.toLowerCase ();

    conexion.query (`SELECT * FROM productos WHERE nombre="${producto}";`, (err, datos) => {
        if (err) throw err;

        if (datos.length === 0) {
            res.render ("buscarProducto", {titulo: "Buscar Producto", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "No se encontro el producto."});

            return;
        }

        idEditar = datos[0].id_producto;
        res.redirect ("/seleccionarCampoProducto");
    });

});

app.get ("/seleccionarCampoProducto", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("seleccionarCampoProducto", {titulo: "Seleccionar Campo", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/seleccionarCampoProducto", (req, res) => {
    campoEditar = req.body.campoEditar;

    res.redirect ("/puntoVentaEditarInventario");
});

// Ruta puntoVentaInventario
app.get ("/puntoVentaInventario", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo" && usuarioSesionIniciada.puesto !== "Auxiliar Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    conexion.query (`SELECT * FROM productos;`, (err, datos) => {
        if (err) throw err;

        for (let index = 0; index < datos.length; index++){
            datos[index].nombre = capitalizar (datos[index].nombre);
        }

        res.render ("puntoVentaInventario", {titulo: "Inventario", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", resultados:datos});
    });

})
.post ("/puntoVentaInventario", (req, res) => {
    res.redirect ("/puntoVentaMenu");
});

app.get ("/menuFinanzas", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    res.render ("menuFinanzas", {titulo: "Menú de Finanzas", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
});

app.get ("/buscarCuenta", (req, res) => {
    if (!sesionIniciada) {
        res.redirect ("/login");

        return;
    }

    res.render ("buscarCuenta", {titulo: "Buscar Producto", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/buscarCuenta", (req, res) => {
    const id = req.body.cuenta;

    conexion.query (`SELECT * FROM venta WHERE id_venta="${id}"`, (err, datos) => {
        if (err) throw err;

        if (datos.length === 0) {
            res.render ("buscarCuenta", {titulo: "Buscar Producto", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "No se encontro la cuenta."});

            return;
        }

        cuentaBuscada = {id:datos[0].id_venta, fecha:datos[0].fecha, total:datos[0].total, 
        cantidadProductos:datos[0].cantidadProductos};
        res.redirect ("/consultarCuenta");
    });
});

app.get ("/consultarCuenta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    conexion.query (`SELECT detalle_venta.id_producto, productos.nombre, detalle_venta.cantidad, detalle_venta.total 
    FROM detalle_venta INNER JOIN productos ON detalle_venta.id_producto = productos.id_producto 
    AND id_venta="${cuentaBuscada.id}";`, (err, datos) => {
        if (err) throw err;

        res.render ("consultarCuenta", {titulo: "Consultar Cuenta", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", resultados:datos, cuenta:cuentaBuscada, capitalizar:capitalizar});
    });
})
.post ("/consultarCuenta", (req, res) => {
    cuentaBuscada = {};
    res.redirect ("/menuFinanzas");
});

// Ruta reporteVentas
app.get ("/reporteVentas", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    }

    conexion.query (`SELECT * FROM venta;`, (err, datos) => {
        if (err) throw err;

        if (datos.length === 0){
            res.redirect ("/menuFinanzas");

            return;
        }

        res.render ("reporteVentas", {titulo: "Reporte de Ventas", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", resultados:datos, totalMes:0, mes:0});
    });

})
.post ("/reporteVentas", (req, res) => {
    res.redirect ("/menuFinanzas");
});

app.get ("/reporteMembresias", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    };

    conexion.query (`SELECT pago_membresia.id_pago_membresia, pago_membresia.id_cliente, pago_membresia.fecha_pago, 
    membresias.costo_membresia FROM pago_membresia INNER JOIN membresias ON pago_membresia.tipo_membresia=
    membresias.tipo_membresia;`, (err, datos) => {
        if (err) throw err;

        if (datos.length === 0) {
            res.redirect ("/menuFinanzas");

            return;
        }

        res.render ("reporteMembresias", {titulo: "Reporte de Ventas", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", resultados:datos, totalMes:0, mes:0});
    });
})
.post ("/reporteMembresias", (req, res) => {
    res.redirect ("/menuFinanzas");
});

app.get ("/consultarDatos", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }
    
    if (usuarioSesionIniciada.puesto === "Atleta") {
        conexion.query (`SELECT * FROM cliente WHERE id_cliente="${usuarioSesionIniciada.id}";`, (err, datos) => {
            if (err) throw err;

            res.render ("consultarDatos", {titulo:"Consultar Datos", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "", resultados:datos, privilegio:usuarioSesionIniciada.puesto});
        });
    }
    else {
        conexion.query (`SELECT * FROM personal WHERE id="${usuarioSesionIniciada.id}";`, (err, datos) => {
            if (err) throw err;

            res.render ("consultarDatos", {titulo:"Consultar Datos", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "", resultados:datos, privilegio:usuarioSesionIniciada.puesto});
        });
    }
})
.post ("/consultarDatos", (req, res) => {
    res.redirect ("/menuPrincipal");
});

app.get ("/consultarClientes", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    }

    conexion.query (`SELECT * FROM cliente;`, (err, datos) => {
        if (err) throw err;

        res.render ("consultarClientes", {titulo:"Consultar Clientes", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", resultados:datos});
    });
})
.post ("/consultarClientes", (req, res) => {
    res.redirect ("/menuFinanzas");
});

app.get ("/consultarEmpleados", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (usuarioSesionIniciada.puesto !== "Administrativo") {
        res.redirect ("/menuPrincipal");

        return;
    }

    conexion.query (`SELECT * FROM personal;`, (err, datos) => {
        if (err) throw err;

        res.render ("consultarEmpleados", {titulo:"Consultar Clientes", usuario: usuarioSesionIniciada.nombre, login: false, 
        sesion: sesionIniciada, mensajeError: "", resultados:datos});
    });
})
.post ("/consultarEmpleados", (req, res) => {
    res.redirect ("/menuFinanzas");
});

app.listen (process.env.PORT || 3000, () => {
    console.log ("Server running on http://localhost:3000");
});

