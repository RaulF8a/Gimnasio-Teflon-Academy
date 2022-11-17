import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import ejs from 'ejs';
import mysql from 'mysql';
import passport from 'passport';
import session from 'express-session';

const app = express ();
const __dirname = path.resolve ();

// Conexion a la base de datos.
let conexion = mysql.createConnection ({
    host: "",
    user: "",
    password: "",
    database: ""
});

// Configuraciones de aplicacion.
app.use (bodyParser.urlencoded ({extended: true}));
app.use (express.static ("public"));
app.set ("view engine", "ejs");

// Inicializar Passport.
app.use (session ({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use (passport.initialize ());
app.use (passport.session ());

let mensajeError = ""

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

// Ruta Home
app.get ("/", (req, res) => {
    res.render ("home", {titulo: "Gimnasio Teflon Academy", usuario: "", login: false, sesion: false});
})
.post ("/", (req, res) => {
    //
});

// Ruta inicio
app.get ("/inicio", (req, res) => {
    res.render ("inicio", {titulo: "Inicio", usuario: "Raul", login: false, sesion: true});
})
.post ("/inicio", (req, res) => {
    //
});

// Ruta login
app.get ("/login", (req, res) => {
    res.render ("login", {titulo: "Login", usuario: "", login: true, sesion: true});
})
.post ("/login", (req, res) => {
    //
});

// Ruta seleccionServicio
app.get ("/seleccionServicio", (req, res) => {
    res.render ("seleccionServicio", {titulo: "Seleccionar Servicio", usuario: "", login: false, sesion: true});
})
.post ("/seleccionServicio", (req, res) => {
    //
});

// Ruta menuPrincipal
app.get ("/menuPrincipal", (req, res) => {
    res.render ("menuPrincipal", {titulo: "Menu Principal", usuario: "", login: false, sesion: true});
})
.post ("/menuPrincipal", (req, res) => {
    //
});

// Ruta pagoMembresia
app.get ("/pagoMembresia", (req, res) => {
    res.render ("pagoDeMembresia", {titulo: "Pago de Membresia", usuario: "", login: false, sesion: true});
})
.post ("/pagoMembresia", (req, res) => {
    //
});

// Ruta registroAcceso
app.get ("/registroAcceso", (req, res) => {
    res.render ("registroAcceso", {titulo: "Registro de Acceso", usuario: "", login: false, sesion: true});
})
.post ("/registroAcceso", (req, res) => {
    //
});

// Ruta verRegistroAcceso
app.get ("/verRegistroAcceso", (req, res) => {
    res.render ("verRegistroAcceso", {titulo: "Registro de Acceso", usuario: "", login: false, sesion: true});
})
.post ("/verRegistroAcceso", (req, res) => {
    //
});

// Ruta crearContraseña
app.get ("/crearContrasenia", (req, res) => {
    res.render ("crearContrasenia", {titulo: "Crear Contraseña", usuario: "", login: false, sesion: true});
})
.post ("/crearContrasenia", (req, res) => {
    //
});

// Ruta agregarAtleta
app.get ("/registrarAtleta", (req, res) => {
    res.render ("registroAtleta", {titulo: "Registrar Atleta", usuario: "", login: false, sesion: true});
})
.post ("/registrarAtleta", (req, res) => {
    //
});

// Ruta editarAtleta
app.get ("/editarAtleta", (req, res) => {
    res.render ("editarAtleta", {titulo: "Editar Atleta", usuario: "", login: false, sesion: true});
})
.post ("/editarAtleta", (req, res) => {
    //
});

// Ruta eliminarAtleta
app.get ("/eliminarAtleta", (req, res) => {
    res.render ("eliminarAtleta", {titulo: "Eliminar Atleta", usuario: "", login: false, sesion: true});
})
.post ("/eliminarAtleta", (req, res) => {
    //
});

// Ruta resumen del atleta.
app.get ("/resumen", (req, res) => {
    res.render ("resumen", {titulo: "Resumen de Atleta", usuario: "", login: false, sesion: true});
})
.post ("/resumen", (req, res) => {
    //
});

// Ruta agregarEmpleado
app.get ("/registrarEmpleado", (req, res) => {
    res.render ("registroEmpleado", {titulo: "Registrar Empleado", usuario: "", login: false, sesion: true, mensajeError: mensajeError});
})
.post ("/registrarEmpleado", (req, res) => {
    let fechaNacimiento = new Date (req.body.fechaNacimiento);
    let fechaActual = new Date ();
    let fechaValida = true;
    mensajeError = "";
    
    // Un menor de 15 años no puede trabajar.
    if (fechaNacimiento.getFullYear () > fechaActual.getFullYear () - 15){
        // console.log ("Fecha no valida.");
        fechaValida = false;
    }

    if (fechaNacimiento.getFullYear () === fechaActual.getFullYear () - 15){
        if (fechaNacimiento.getMonth () < fechaActual.getMonth ()){
            // console.log ("Fecha no valida porque no ha llegado el mes.");
            fechaValida = false;
        }
        else if (fechaNacimiento.getMonth () === fechaNacimiento.getMonth ()){
            if (fechaNacimiento.getDay () > fechaActual.getDay ()){
                // console.log ("Fecha no valida porque no ha llegado el dia.");
                fechaValida = false;
            }
        }
    }

    if (!fechaValida){
        mensajeError = "La fecha no es valida";
        res.redirect ("/registrarEmpleado");
    }
});

// Ruta editarEmpleado
app.get ("/editarEmpleado", (req, res) => {
    res.render ("editarEmpleado", {titulo: "Editar Empleado", usuario: "", login: false, sesion: true});
})
.post ("/editarEmpleado", (req, res) => {
    //
});

// Ruta eliminarEmpleado
app.get ("/eliminarEmpleado", (req, res) => {
    res.render ("eliminarEmpleado", {titulo: "Eliminar Empleado", usuario: "", login: false, sesion: true});
})
.post ("/eliminarEmpleado", (req, res) => {
    //
});

// Ruta puntoVentaMenu
app.get ("/puntoVentaMenu", (req, res) => {
    res.render ("puntoVentaMenu", {titulo: "Punto de Venta", usuario: "", login: false, sesion: true});
})
.post ("/puntoVentaMenu", (req, res) => {
    //
});

// Ruta puntoVentaAñadirInventario
app.get ("/puntoVentaAnadirInventario", (req, res) => {
    res.render ("puntoVentaAnadirInventario", {titulo: "Añadir al Inventario", usuario: "", login: false, sesion: true});
})
.post ("/puntoVentaAnadirInventario", (req, res) => {
    //
});

// Ruta puntoVentaCarrito
app.get ("/puntoVentaCarrito", (req, res) => {
    res.render ("puntoVentaCarrito", {titulo: "Carrito", usuario: "", login: false, sesion: true});
})
.post ("/puntoVentaCarrito", (req, res) => {
    //
});

// Ruta puntoVentaEliminarInventario
app.get ("/puntoVentaEliminarInventario", (req, res) => {
    res.render ("puntoVentaEliminarInventario", {titulo: "Eliminar del Inventario", usuario: "", login: false, sesion: true});
})
.post ("/puntoVentaEliminarInventario", (req, res) => {
    //
});

// Ruta puntoVentaInventario
app.get ("/puntoVentaInventario", (req, res) => {
    res.render ("puntoVentaInventario", {titulo: "Inventario", usuario: "", login: false, sesion: true});
})
.post ("/puntoVentaInventario", (req, res) => {
    //
});

// Ruta puntoVentaTotal
app.get ("/puntoVentaTotal", (req, res) => {
    res.render ("puntoVentaTotal", {titulo: "Resumen de Compras", usuario: "", login: false, sesion: true});
})
.post ("/puntoVentaTotal", (req, res) => {
    //
});

// Ruta reporteVentas
app.get ("/reporteVentas", (req, res) => {
    res.render ("reporteVentas", {titulo: "Reporte de Ventas", usuario: "", login: false, sesion: true});
})
.post ("/reporteVentas", (req, res) => {
    //
});

app.listen (process.env.PORT || 3000, () => {
    console.log ("Server running on port 3000");
});

