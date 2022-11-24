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
/*let conexion = mysql2.createConnection ({
    host: "localhost",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "Gimnasio_Teflon_Ac"
});

conexion.connect ((err) => {
    if (err) throw err;
    
    console.log ("Conexion exitosa.");
});*/

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
let sesionIniciada = true;
let campoEditar = "";
let idEditar = "";
let cuentaBuscada = {};

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

        conexion.query (`SELECT * FROM gimnasio_teflon_ac.personal WHERE id="${usuario}"`, (err, datosE) =>{
            if (!datos){
                conexion.query (`SELECT * FROM gimnasio_teflon_ac.personal WHERE id="${usuario}"`, (err, datosA) => {
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
    campoEditar = "";
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

// Ruta editarEmpleado
app.get ("/editarEmpleado", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }

    res.render ("editarEmpleado", {titulo: "Editar Empleado", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", campEditar: campoEditar});
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

// Ruta puntoVentaCarrito
app.get ("/puntoVentaCarrito", (req, res) => {
    if (!sesionIniciada){
        res.redirect ("/login");

        return;
    }
    
    res.render ("puntoVentaCarrito", {titulo: "Carrito", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", carritoCompras:carrito});
})
.post ("/puntoVentaCarrito", (req, res) => {
    // Arreglo de JSON con {nombre, precio}
    const productoBuscado = req.body.newItem.toLowerCase ();

    conexion.query (`SELECT * FROM productos WHERE nombre="${productoBuscado}"`, (err, results) => {
        if (err) throw err;

        if (results.length === 0){
            res.render ("puntoVentaCarrito", {titulo: "Carrito", usuario: usuarioSesionIniciada.nombre, login: false, 
            sesion: sesionIniciada, mensajeError: "No se encontro el producto.", carritoCompras:carrito});

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
    sesion: sesionIniciada, mensajeError: "", carritoCompras:carrito, totalCuenta:total, cambio:-0.0000001});
})
.post ("/puntoVentaTotal", (req, res) => {
    const total = req.body.total;
    const montoPagado = req.body.montoPagado;

    let cambio = montoPagado - total;
    cambio = cambio.toFixed (2);

    res.render ("puntoVentaTotal", {titulo: "Resumen de Compras", usuario: usuarioSesionIniciada.nombre, login: false, 
    sesion: sesionIniciada, mensajeError: "", carritoCompras:carrito, totalCuenta:total, cambio:cambio});
});

app.post ("/guardarCuenta", (req, res) => {
    const total = req.body.total;
    let numeroCuenta = generarNumeroCuenta ();
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

    // Crear el reporte de venta.
    for (let index = 0; index < carrito.length; index++){
        idActual = carrito[index].id;
        cantidadComprada = parseInt (carrito[index].cantidad);
        totalProductoActual = parseFloat (parseFloat (carrito[index].precio) * cantidadComprada);

        // console.log (idActual);
        // console.log (productoActual);
        // console.log (cantidadComprada);
        // console.log (totalProductoActual);

        // conexion.query (`SELECT id_producto FROM productos WHERE nombre="${productoActual}"`, (err, datos) => {
        //     if (err) throw err;
        //     id = datos[0].id_producto;   
        // });
        
        conexion.query (`INSERT INTO detalle_venta SET ?`, {id_producto:idActual, cantidad:cantidadComprada,
        total:totalProductoActual, id_venta:numeroCuenta}, (err) => {
            if (err) throw err;
        });
    }

    carrito = [];
    res.redirect ("/puntoVentaMenu");
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

    res.render ("puntoVentaEliminarInventario", {titulo: "Eliminar del Inventario", usuario: usuarioSesionIniciada.nombre, 
    login: false, sesion: sesionIniciada, mensajeError: ""});
})
.post ("/puntoVentaEliminarInventario", (req, res) => {
    const nombreProducto = req.body.nombre.toLowerCase ();

    conexion.query (`DELETE FROM productos WHERE nombre="${nombreProducto}"`, (err) => {
        if (err){
            console.error (err);

            res.render ("puntoVentaEliminarInventario", {titulo: "Eliminar del Inventario", usuario: usuarioSesionIniciada.nombre, 
            login: false, sesion: sesionIniciada, mensajeError: "Ocurrio un error. Intentalo de nuevo."});

            return;
        }
    });

    res.redirect ("/puntoVentaMenu");
});

app.get ("/puntoVentaEditarInventario", (req, res) => {
    if (!sesionIniciada) {
        res.redirect ("/login");

        return;
    }

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
        conexion.query (`UPDATE productos SET precio=${nuevoValor} WHERE id_producto=${idEditar};`)
    }
    else if (campoEditar === "existencia") {
        conexion.query (`UPDATE productos SET existencia=${nuevoValor} WHERE id_producto=${idEditar};`)
    }
    else if (campoEditar === "nombre") {
        nuevoValor.toLowerCase ();
        conexion.query (`UPDATE productos SET ${campoEditar}="${nuevoValor}" WHERE id_producto=${idEditar};`)
    }
    else {
        conexion.query (`UPDATE productos SET ${campoEditar}="${nuevoValor}" WHERE id_producto=${idEditar};`)
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

app.listen (process.env.PORT || 3000, () => {
    console.log ("Server running on port 3000");
});

