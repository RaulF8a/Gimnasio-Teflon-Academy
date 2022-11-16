import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import ejs from 'ejs';
import mysql from 'mysql'

const app = express ();
const __dirname = path.resolve ();
let conexion = mysql.createConnection ({
    host: "",
    user: "",
    password: "",
    database: ""
});

app.use (bodyParser.urlencoded ({extended: true}));
app.use (express.static ("public"));
app.set ("view engine", "ejs");

// Ruta Home
app.get ("/", (req, res) => {
    res.render ("home");
})
.post ("/", (req, res) => {
    //
});

// Ruta inicio
app.get ("/inicio", (req, res) => {
    res.render ("inicio");
})
.post ("/inicio", (req, res) => {
    //
});

// Ruta login
app.get ("/login", (req, res) => {
    res.render ("login");
})
.post ("/login", (req, res) => {
    //
});

// Ruta seleccionServicio
app.get ("/seleccionServicio", (req, res) => {
    res.render ("seleccionServicio");
})
.post ("/seleccionServicio", (req, res) => {
    //
});

// Ruta menuPrincipal
app.get ("/menuPrincipal", (req, res) => {
    res.render ("menuPrincipal");
})
.post ("/menuPrincipal", (req, res) => {
    //
});

// Ruta pagoMembresia
app.get ("/pagoMembresia", (req, res) => {
    res.render ("pagoDeMembresia");
})
.post ("/pagoMembresia", (req, res) => {
    //
});

// Ruta registroAcceso
app.get ("/registroAcceso", (req, res) => {
    res.render ("registroAcceso");
})
.post ("/registroAcceso", (req, res) => {
    //
});

// Ruta verRegistroAcceso
app.get ("/verRegistroAcceso", (req, res) => {
    res.render ("verRegistroAcceso");
})
.post ("/verRegistroAcceso", (req, res) => {
    //
});

// Ruta crearContraseña
app.get ("/crearContrasenia", (req, res) => {
    res.render ("crearContrasenia");
})
.post ("/", (req, res) => {
    //
});

// Ruta agregarAtleta
app.get ("/agregarAtleta", (req, res) => {
    res.render ("registroAtleta");
})
.post ("/", (req, res) => {
    //
});

// Ruta editarAtleta
app.get ("/editarAtleta", (req, res) => {
    res.render ("editarAtleta");
})
.post ("/editarAtleta", (req, res) => {
    //
});

// Ruta eliminarAtleta
app.get ("/eliminarAtleta", (req, res) => {
    res.render ("eliminarAtleta");
})
.post ("/eliminarAtleta", (req, res) => {
    //
});

// Ruta resumen del atleta.
app.get ("/resumen", (req, res) => {
    res.render ("resumen");
})
.post ("/resumen", (req, res) => {
    //
});

// Ruta agregarEmpleado
app.get ("/agregarEmpleado", (req, res) => {
    res.render ("registroEmpleado");
})
.post ("/", (req, res) => {
    //
});

// Ruta editarEmpleado
app.get ("/editarEmpleado", (req, res) => {
    res.render ("editarEmpleado");
})
.post ("/editarEmpleado", (req, res) => {
    //
});

// Ruta eliminarEmpleado
app.get ("/eliminarEmpleado", (req, res) => {
    res.render ("eliminarEmpleado");
})
.post ("/eliminarEmpleado", (req, res) => {
    //
});

// Ruta puntoVentaMenu
app.get ("/puntoVentaMenu", (req, res) => {
    res.render ("puntoVentaMenu");
})
.post ("/puntoVentaMenu", (req, res) => {
    //
});

// Ruta puntoVentaAñadirInventario
app.get ("/puntoVentaAnadirInventario", (req, res) => {
    res.render ("puntoVentaAnadirInventario");
})
.post ("/puntoVentaAnadirInventario", (req, res) => {
    //
});

// Ruta puntoVentaCarrito
app.get ("/puntoVentaCarrito", (req, res) => {
    res.render ("puntoVentaCarrito");
})
.post ("/puntoVentaCarrito", (req, res) => {
    //
});

// Ruta puntoVentaEliminarInventario
app.get ("/puntoVentaEliminarInventario", (req, res) => {
    res.render ("puntoVentaEliminarInventario");
})
.post ("/puntoVentaEliminarInventario", (req, res) => {
    //
});

// Ruta puntoVentaInventario
app.get ("/puntoVentaInventario", (req, res) => {
    res.render ("puntoVentaInventario");
})
.post ("/puntoVentaInventario", (req, res) => {
    //
});

// Ruta puntoVentaTotal
app.get ("/puntoVentaTotal", (req, res) => {
    res.render ("puntoVentaTotal");
})
.post ("/puntoVentaTotal", (req, res) => {
    //
});

// Ruta reporteVentas
app.get ("/reporteVentas", (req, res) => {
    res.render ("reporteVentas");
})
.post ("/reporteVentas", (req, res) => {
    //
});

app.listen (process.env.PORT || 3000, () => {
    console.log ("Server running on port 3000");
});

