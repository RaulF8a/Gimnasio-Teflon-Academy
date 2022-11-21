import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import ejs from 'ejs';
import mysql2 from 'mysql2';
import bycryptjs from 'bcryptjs';

const app = express ();
const __dirname = path.resolve ();

// Conexion a la base de datos.
// let conexion = mysql2.createConnection ({
//     host: "localhost",
//     user: "root",
//     password: process.env.DB_PASSWORD,
//     database: "pruebas"
// });

// conexion.connect ((err) => {
//     if (err) throw err;
    
//     console.log ("Conexion exitosa.");
// });

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

// Ruta Home
app.get ("/", (req, res) => {
    res.render ("home", {titulo: "Gimnasio Teflon Academy", usuario: usuarioSesionIniciada.nombre, 
    login: false, sesion: sesionIniciada, mensajeError: ""});
})
.post ("/", (req, res) => {
    //
});

// Ruta inicio
app.get ("/inicio", (req, res) => {
    res.render ("inicio", {titulo: "Inicio", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/inicio", (req, res) => {
    //
});

// Ruta login
app.get ("/login", (req, res) => {
    res.render ("login", {titulo: "Login", usuario: usuarioSesionIniciada.nombre, login: true, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/login", async (req, res) => {
    const usuario = req.body.user;
    const pass = req.body.password;

    let passCrypt = await bycryptjs.hash (pass, 8);

    if (!(usuario && pass)){
        res.render ("login", {titulo: "Login", usuario: usuarioSesionIniciada.nombre, login: true, sesion: sesionIniciada, 
        mensajeError: "No has rellenado alguno de los campos."});

        return;
    }

    conexion.query (`SELECT * FROM users WHERE user='${usuario}';`, (err, datos) => {
        if (err) throw err;

        if (datos.length == 0 || !(bycryptjs.compare (passCrypt, datos[0].pass))){
            res.render ("login", {titulo: "Login", usuario: usuarioSesionIniciada.nombre, login: true, sesion: sesionIniciada, 
            mensajeError: "Usuario y/o contraseña incorrecto."});

            return;
        } 

        conexion.query (`SELECT * FROM pruebas.empleado WHERE id="${usuario}"`, (err, datosE) =>{
            if (!datos){
                conexion.query (`SELECT * FROM pruebas.empleado WHERE id="${usuario}"`, (err, datosA) => {
                    usuarioSesionIniciada.id = datosA[0].id;
                    usuarioSesionIniciada.nombre = datosA[0].nombre;
                    usuarioSesionIniciada.puesto = datosA[0].puesto;
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

// Ruta seleccionServicio
app.get ("/seleccionServicio", (req, res) => {
    res.render ("seleccionServicio", {titulo: "Seleccionar Servicio", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/seleccionServicio", (req, res) => {
    //
});

// Ruta menuPrincipal
app.get ("/menuPrincipal", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }
    
    res.render ("menuPrincipal", {titulo: "Menu Principal", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", privilegio:usuarioSesionIniciada.puesto});
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

    res.render ("pagoDeMembresia", {titulo: "Pago de Membresia", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/pagoMembresia", (req, res) => {
    //
});

// Ruta registroAcceso
app.get ("/registroAcceso", (req, res) => {
    res.render ("registroAcceso", {titulo: "Registro de Acceso", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/registroAcceso", (req, res) => {
    //
});

// Ruta verRegistroAcceso
app.get ("/verRegistroAcceso", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("verRegistroAcceso", {titulo: "Registro de Acceso", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/verRegistroAcceso", (req, res) => {
    //
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

    let passCrypt = await bycryptjs.hash (pass, 8);

    conexion.query ("INSERT INTO users SET ?", {user:usuarioRegistrado.id, pass:passCrypt, rol:usuarioRegistrado.puesto});

    passRequested = false;
    res.redirect ("/menuPrincipal");
});

// Ruta agregarAtleta
app.get ("/registrarAtleta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("registroAtleta", {titulo: "Registrar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/registrarAtleta", (req, res) => {
    //
});

// Ruta editarAtleta
app.get ("/editarAtleta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    if (campoEditar.length === 0){
        res.redirect ("/buscarAtleta");
        
        return;
    }

    res.render ("editarAtleta", {titulo: "Editar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", campoEditarP: campoEditar});
})
.post ("/editarAtleta", (req, res) => {
    // Al terminar de editar, hay que reiniciar la variable que contiene el campo.
});

// Ruta eliminarAtleta
app.get ("/eliminarAtleta", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("eliminarAtleta", {titulo: "Eliminar Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/eliminarAtleta", (req, res) => {
    //
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
    console.log (campoEditar);
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
    res.redirect ("/seleccionarCampoAtleta");
});

// Ruta resumen del atleta.
app.get ("/resumen", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("resumen", {titulo: "Resumen de Atleta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/resumen", (req, res) => {
    //
});

// Ruta agregarEmpleado
app.get ("/registrarEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

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
        sesion: sesionIniciada, mensajeError: "La fecha no es valida"});
        
        return;
    }

    const id = generarID ();
    const nombre = req.body.nombreCompleto;
    const curp = req.body.curp;
    const sueldo = req.body.sueldo;
    const fechaN = req.body.fechaNacimiento;
    const rfc = req.body.rfc;
    const escolaridad = req.body.escolaridad;
    const puesto = req.body.puesto;

    conexion.query ("INSERT INTO empleado SET ?", {id:id, nombre:nombre, curp:curp, sueldo:sueldo, fechaNacimiento:fechaN, 
    rfc:rfc, escolaridad:escolaridad, puesto:puesto}, (err, results) => {
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

// Ruta editarEmpleado
app.get ("/editarEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("editarEmpleado", {titulo: "Editar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/editarEmpleado", (req, res) => {
    //
});

// Ruta eliminarEmpleado
app.get ("/eliminarEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("eliminarEmpleado", {titulo: "Eliminar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/eliminarEmpleado", (req, res) => {
    //
});

// Ruta puntoVentaMenu
app.get ("/puntoVentaMenu", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("puntoVentaMenu", {titulo: "Punto de Venta", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaMenu", (req, res) => {
    //
});

// Ruta puntoVentaAñadirInventario
app.get ("/puntoVentaAnadirInventario", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("puntoVentaAnadirInventario", {titulo: "Añadir al Inventario", usuario: usuarioSesionIniciada.nombre, 
    login: false, sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaAnadirInventario", (req, res) => {
    //
});

// Ruta puntoVentaCarrito
app.get ("/puntoVentaCarrito", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("puntoVentaCarrito", {titulo: "Carrito", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaCarrito", (req, res) => {
    // Arreglo de JSON con {nombre, precio}
    
    // Si la compra fue exitosa, se debe limpiar el carrito.
});

// Ruta puntoVentaEliminarInventario
app.get ("/puntoVentaEliminarInventario", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("puntoVentaEliminarInventario", {titulo: "Eliminar del Inventario", usuario: usuarioSesionIniciada.nombre, 
    login: false, sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaEliminarInventario", (req, res) => {
    //
});

// Ruta puntoVentaInventario
app.get ("/puntoVentaInventario", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("puntoVentaInventario", {titulo: "Inventario", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaInventario", (req, res) => {
    //
});

// Ruta puntoVentaTotal
app.get ("/puntoVentaTotal", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("puntoVentaToatal", {titulo: "Resumen de Compras", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaTotal", (req, res) => {
    //
});

// Ruta reporteVentas
app.get ("/reporteVentas", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("reporteVentas", {titulo: "Reporte de Ventas", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: ""});
})
.post ("/reporteVentas", (req, res) => {
    //
});

app.listen (process.env.PORT || 3000, () => {
    console.log ("Server running on port 3000");
});

