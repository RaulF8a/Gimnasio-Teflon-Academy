create database Gimnasio_Teflon_Ac;
use Gimnasio_Teflon_Ac;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
	id INTEGER NOT NULL auto_increment,
    user VARCHAR (10) NOT NULL,
	pass VARCHAR (255) NOT NULL,
    rol VARCHAR (50) NOT NULL,
     PRIMARY KEY (id)
);

DROP TABLE IF EXISTS cliente;
CREATE TABLE cliente(
ID_cliente bigint unsigned not null AUTO_INCREMENT,
nombre_cliente varchar (25) not null,
tel_cliente varchar (10) not null,
peso int,
altura int,
fecha_nac VARCHAR (20) NOT NULL,
fecha_inscripcion VARCHAR (20) NOT NULL,
tipo_membresia varchar(25) not null,
PRIMARY KEY (ID_cliente),
UNIQUE KEY ID_cliente(ID_cliente),
KEY peso(peso),
KEY altura(altura),
KEY tipo_membresia(tipo_membresia),
CONSTRAINT cliente_ibfk_1 FOREIGN KEY (tipo_membresia) REFERENCES membresias(tipo_membresia),
CONSTRAINT cliente_ibfk_2 FOREIGN KEY (peso) REFERENCES bitacoras(peso),
CONSTRAINT cliente_ibfk_3 FOREIGN KEY (altura) REFERENCES bitacoras(altura)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES cliente WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS membresias;
CREATE TABLE membresias(
tipo_membresia varchar(25) not null,
costo_membresia int not null,
KEY tipo_membresia(tipo_membresia)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES membresias WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS visitas;
CREATE TABLE visitas(
entrada_cliente VARCHAR (30) NOT NULL,
salida_cliente VARCHAR (30) NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES visitas WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS bitacoras;
CREATE TABLE bitacoras(
imc_cliente double,
objetivo varchar(150),
peso int,
altura int,
KEY peso(peso),
KEY altura(altura)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES bitacoras WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS rutinas;
CREATE TABLE rutinas(
ejercicio varchar(30),
descrip_rut varchar(300),
series varchar(30)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES rutinas WRITE;
UNLOCK TABLES;


-- Desde aqui --
DROP TABLE IF EXISTS detalle_venta;
CREATE TABLE detalle_venta (
  id_detalle_venta bigint unsigned NOT NULL AUTO_INCREMENT,
  id_producto int NOT NULL,
  cantidad int NOT NULL,
  total double NOT NULL,
  id_venta VARCHAR (12) NOT NULL,
  PRIMARY KEY (id_detalle_venta),
  UNIQUE KEY id_detalle_venta (id_detalle_venta),
  KEY id_venta (id_venta),
  KEY id_producto (id_producto),
  CONSTRAINT detalle_venta_ibfk_1 FOREIGN KEY (id_venta) REFERENCES venta (id_venta),
  CONSTRAINT detalle_venta_ibfk_2 FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES detalle_venta WRITE;
UNLOCK TABLES;


DROP TABLE IF EXISTS productos;
CREATE TABLE productos(
  id_producto int NOT NULL auto_increment,
  nombre varchar (90) NOT NULL,
  descripcion varchar(80) DEFAULT NULL,
  precio double NOT NULL,
  existencia int NOT NULL,
  PRIMARY KEY (id_producto),
  UNIQUE KEY id_producto (id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES productos WRITE;
UNLOCK TABLES;

INSERT INTO productos VALUES (
	"Agua", "Botella de 600ml", 10.50, 10
);

DROP TABLE IF EXISTS personal;
CREATE TABLE personal (
	id VARCHAR (10) NOT NULL PRIMARY KEY,
	nombre VARCHAR (255) NOT NULL,
    curp VARCHAR (50) NOT NULL,
    sueldo INTEGER NOT NULL,
    fechaNacimiento VARCHAR (20) NOT NULL,
    rfc VARCHAR (50) NOT NULL,
    escolaridad VARCHAR (40) NOT NULL,
    telefono VARCHAR (15) NOT NULL,
    puesto VARCHAR (30) NOT NULL,
  UNIQUE KEY id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES personal WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS venta;
CREATE TABLE venta (
  id_venta VARCHAR (12) NOT NULL,
  fecha VARCHAR (20) NOT NULL,
  total double NOT NULL,
  cantidadProductos int NOT NULL,
  PRIMARY KEY (id_venta),
  UNIQUE KEY id_venta (id_venta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
LOCK TABLES venta WRITE;
UNLOCK TABLES;

