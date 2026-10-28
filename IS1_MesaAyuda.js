
/*-----------------------------------------------------------------------------------------------------------------
//*  MesaAyuda.js debe copiarse al directorio del proyecto express como index.js
//*
//*  REST API 
//*  UADER - FCyT - Ingenieria de Software I 
//*  Caso de estudio MesaAyuda
//*
//*  Dr. Pedro E. Colla 2023,2025
 *----------------------------------------------------------------------------------------------------------------*/
//AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1

import express from 'express';
import crypto from 'crypto';
console.log("Comenzando servidor");

// const crypto = require('crypto');
console.log("crypto Ok!");

//const express = require('express');
//console.log("express Ok!");

const app = express();
console.log("express ready!");

const PORT = 8080;

import cors from 'cors';

//const cors = require('cors');
console.log("cors ok!");

app.use(cors());
console.log("CORS ready!");

import AWS from 'aws-sdk'
//var AWS = require('aws-sdk');
console.log("aws-sdk ready!");

/*----
Acquire critical security resources from an external file out of the path
*/

//const accessKeyId = require('../accessKeyId.js');
//const secretAccessKey = require('../secretAccessKey.js');

import accessKeyId from '../accessKeyId.js';
import secretAccessKey  from '../secretAccessKey.js';

let awsConfig = {
    "region"         : "us-east-1",
    "endpoint"       : "http://dynamodb.us-east-1.amazonaws.com",
    "accessKeyId"    : accessKeyId, 
    "secretAccessKey": secretAccessKey
};

AWS.config.update(awsConfig);
console.log("Servidor listo!");
let docClient = new AWS.DynamoDB.DocumentClient();

/*----
   Application server in LISTEN mode
*/

app.listen(
    PORT,
    () => console.log(`Servidor listo en http://localhost:${PORT}`)
);

app.use(express.json());

/*-------------------------------------------------------------------------------------------
                            Funciones y Servicios
 *-------------------------------------------------------------------------------------------*/

/*-----------
función para hacer el parse de un archivo JSON
*/
function jsonParser(keyValue,stringValue) {
    var string = JSON.stringify(stringValue);
    var objectValue = JSON.parse(string);
    return objectValue[keyValue];
}

/*-------------------------------------------------------------------------------------------
                            SERVER API 
 *-------------------------------------------------------------------------------------------*/
/*==*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
 *                       API REST Cliente                                                   *
 *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*==*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

app.get('/api/cliente', (req,res) => {
    res.status(200).send({response : "OK", message : "API Ready"});
    console.log("API cliente: OK");
});


/*---
  /api/loginCliente
  Esta API permite acceder a un cliente por ID y comparar la password pasada en un JSON en el cuerpo con la indicada en el DB
*/  
app.post('/api/loginCliente', (req,res) => {

    const { contacto } = req.body;
    const {password} = req.body;

    console.log("loginCliente: id("+contacto+") password ("+password+")");

    if (!password) {
        res.status(400).send({response : "ERROR" , message : "Password no informada"});
        return;
    }    
    if (!contacto) {
        res.status(400).send({response : "ERROR" , message : "id no informado"});
        return;
    }    
    const paramsScan = { // ScanInput
        TableName: "cliente", // required
        FilterExpression: 'contacto = :contacto',
        ExpressionAttributeValues: {':contacto' : contacto}
    };
    docClient.scan(paramsScan, function (err, data) {
                if (err) {
                    res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                }
                else {
                    if (!data.Items || data.Items.length === 0) {
                        res.status(400).send({response : "ERROR" , message : "Cliente invalido"});
                    } else {
                    const Data1 = data.Items[0];
                    const paswd=jsonParser('password',Data1);
                    const activo=jsonParser('activo',Data1);
                    const id=jsonParser('id',Data1);
                    const contacto=jsonParser('contacto',Data1);
                    if (password == paswd) {
                        if (activo == true) {                           
                            const nombre = jsonParser('nombre', Data1);

                            // Obtener la fecha actual
                            const ahora = new Date();
                            const fechaActual =
                                String(ahora.getDate()).padStart(2, '0') + '/' +
                                String(ahora.getMonth() + 1).padStart(2, '0') + '/' +
                                ahora.getFullYear();

                            // Actualizar fecha en DynamoDB
                            const paramsUpdate = {
                                TableName: "cliente",
                                Key: { id: id },
                                UpdateExpression: "SET fecha_ultimo_ingreso = :fecha",
                                ExpressionAttributeValues: {
                                    ":fecha": fechaActual
                                }
                            };

                            docClient.update(paramsUpdate, function(err, data) {
                                if (err) {
                                    return res.status(500).json({
                                        response: "ERROR",
                                        message: "Error al actualizar último ingreso"
                                    });
                                }

                                return res.status(200).json({
                                    response: "OK",
                                    id: id,
                                    nombre: nombre,
                                    contacto: contacto,
                                    fecha_ultimo_ingreso: fechaActual
                                });
                            });
    
                        } else {
                            res.status(400).send(JSON.stringify({response : "ERROR", message : "Cliente no activo"}));    
                        }
                    } else {
                        res.status(400).send(JSON.stringify({response : "ERROR" , message : "usuario incorrecto"}));
                    }    
            }    
            }
    })
});


/*-----------
  /api/getCliente
  Esta API permite acceder a un cliente dado su id
*/

app.post('/api/getCliente/:id', (req,res) => {
    const { id } = req.params;
    console.log("getCliente: id("+id+")");
    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
        } else {

            if (Object.keys(data).length != 0) {
               res.status(200).send(JSON.stringify({"response":"OK","cliente" : data.Item}),null,2);
            } else {
               res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
            }
        }    
    })


} );

/*---------
Función para realizar el SCAN de un DB de cliente usando contacto como clave para la búsqueda (no es clave formal del DB)
*/
async function scanDb(contacto) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const scanKey=contacto;
    const paramsScan = { // ScanInput
      TableName: "cliente", // required
      Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
      FilterExpression : 'id = :contacto',
      ExpressionAttributeValues : {':contacto' : scanKey}
    };      
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
          return data.Items 
    });  
    return objectPromise;
}

/*----
addCliente
Revisa si el contacto (e-mail) existe y en caso que no da de alta el cliente generando un id al azar
*/
app.post('/api/addCliente', (req,res) => {

    const {contacto} = req.body;
    const {password} = req.body;
    const {nombre}   = req.body;
    console.log("addCliente: contacto("+contacto+") nombre("+nombre+") password("+password+")");
    
    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informada"});
        return;
    }
    if (!nombre) {
        res.status(400).send({response : "ERROR", message : "Nombre no informado"});
        return;
    }

    if (!contacto){
        res.status(400).send({response : "ERROR" , message : "Contacto no informado"});
        return;
    } 

    scanDb(contacto)
    .then(resultDb => {
    if (Object.keys(resultDb).length != 0) {
        res.status(400).send({response : "ERROR" , message : "Cliente ya existe"});
        return;
    } else {
        var hoy = new Date();
        var dd = String(hoy.getDate()).padStart(2, '0');
        var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = hoy.getFullYear();
        hoy = dd + '/' + mm + '/' + yyyy;
    
        const newCliente = {
         id                    : contacto,
         nombre                : nombre,
         password              : password,
         activo                : true,
         registrado            : true,
         primer_ingreso        : false,
         fecha_alta            : hoy,
         fecha_cambio_password : hoy,
         fecha_ultimo_ingreso  : hoy,
        };
    
        const paramsPut = {
          TableName: "cliente",
          Item: newCliente,
          ConditionExpression:'attribute_not_exists(id)',
        };

        docClient.put(paramsPut, function (err, data) {
            if (err) {
                res.status(400).send(JSON.stringify({response : "ERROR", message : "DB error" + err}));
            } else {
                res.status(200).send(JSON.stringify({response : "OK", "cliente": newCliente}));
            }
        });
    }
    });

});
/*----------
/api/updateCliente
Permite actualizar datos del cliente contacto, nombre, estado de activo y registrado
*/
app.post('/api/updateCliente', (req,res) => {
    
    const {id} = req.body;
    const {nombre}   = req.body; 
    const {password} = req.body;

    var activo = ((req.body.activo+'').toLowerCase() === 'true')
    var registrado = ((req.body.registrado+'').toLowerCase() === 'true')

    console.log("updateCliente: id("+id+") nombre("+nombre+") password("+password+") activo("+activo+") registrado("+registrado+")");

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!nombre) {
        res.status(400).send({response : "ERROR" , message: "Nombre no informado"});
        return;
    }

    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informado"});
        return;
    }

    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 
   
                    ExpressionAttributeNames: { 
                         "#a": "activo", 
                         "#n": "nombre",
                         "#p": "password",
                         "#r": "registrado"

                    }, 
                    ExpressionAttributeValues: { 
                        ":a": activo , 
                        ":p": password,
                        ":n": nombre , 
                        ":r": registrado 
                   }, 
                   Key: { 
                       "id": id 
                   }, 
                   ReturnValues: "ALL_NEW", 
                   TableName: "cliente", 
                   UpdateExpression: "SET #n = :n, #p = :p, #a = :a, #r = :r" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK", message : "updated" , "data": data}));
                    }    
                });    
            }
        }    
    })


});
/*-------
/api/resetCliente
Permite cambiar la password de un cliente
*/
app.post('/api/resetCliente', (req,res) => {
    
    const {id}       = req.body;
    const {password} = req.body;
 
    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informada"});
        return;
    }

    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 
   
                    ExpressionAttributeNames: { 
                         "#p": "password" 
                    }, 
                    ExpressionAttributeValues: { 
                        ":p": password 
                   }, 
                   Key: { 
                       "id": id 
                   }, 
                   ReturnValues: "ALL_NEW", 
                   TableName: "cliente", 
                   UpdateExpression: "SET #p = :p" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK", message : "updated" , "data": data}));
                    }    
                });    
            }
        }    
    })
});
/*-----------
  /api/resetPassword - Reset password usando email
*/  
app.post('/api/resetPassword', (req, res) => {
    const { contacto, newPassword } = req.body;

    console.log("resetPassword: contacto(" + contacto + ") nueva password");

    // Validaciones
    if (!contacto || !newPassword) {
        return res.status(400).send({ 
            response: "ERROR", 
            message: "Email y nueva password son obligatorios" 
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).send({ 
            response: "ERROR", 
            message: "La password debe tener al menos 6 caracteres" 
        });
    }

    // Buscar cliente por email (contacto)
    const paramsScan = {
        TableName: "cliente",
        FilterExpression: 'contacto = :contacto',
        ExpressionAttributeValues: {':contacto' : contacto}
    };

    docClient.scan(paramsScan, function (err, data) {
        if (err) {
            return res.status(400).send({ 
                response: "ERROR", 
                message: "Error de base de datos" 
            });
        }

        if (data.Items.length === 0) {
            return res.status(400).send({ 
                response: "ERROR", 
                message: "Usuario no encontrado" 
            });
        }

        const cliente = data.Items[0];
        const clienteId = cliente.id;

        // Obtener la fecha actual
        const ahora = new Date();

        const fechaActual =
            String(ahora.getDate()).padStart(2, '0') + '/' +
            String(ahora.getMonth() + 1).padStart(2, '0') + '/' +
            ahora.getFullYear();

        // Actualizar password en la base de datos
        const paramsUpdate = { 
            TableName: "cliente",

            Key: {
                "id": clienteId
            },

            ExpressionAttributeNames: { 
                "#p": "password",
                "#f": "fecha_cambio_password"
            }, 
            ExpressionAttributeValues: { 
                ":p": newPassword, 
                ":f": fechaActual
            },
            
            UpdateExpression: "SET #p = :p, #f = :f",
            
            ReturnValues: "ALL_NEW" 

        };

        docClient.update(paramsUpdate, function (updateErr, updateData) {
            if (updateErr) {
                return res.status(400).send({ 
                    response: "ERROR", 
                    message: "Error al actualizar password" 
                });
            }

            // Mostrar la fecha que quedó guardada en DynamoDB
            console.log(
                "Fecha de cambio de password:",
                updateData.Attributes.fecha_cambio_password
            );

            console.log("Password actualizada para:", contacto);
            res.status(200).send({ 
                response: "OK", 
                message: "Password actualizada exitosamente"
            });
        });
    });
});

/*-----------
  /api/registrarCliente - Registro de nuevo cliente
*/  
app.post('/api/registrarCliente', (req, res) => {
    const { contacto, password, nombre, terminos } = req.body;

    console.log("registrarCliente: contacto(" + contacto + ") nombre(" + nombre + ") password(" + password + ")");

    // Validaciones
    if (!contacto || !password || !nombre) {
        return res.status(400).send({ 
            response: "ERROR", 
            message: "Todos los campos son obligatorios" 
        });
    }

    if (!contacto.includes('@') || !contacto.includes('.')) {
        return res.status(400).send({ 
            response: "ERROR", 
            message: "Formato de email inválido" 
        });
    }

    if (password.length < 6) {
        return res.status(400).send({ 
            response: "ERROR", 
            message: "La password debe tener al menos 6 caracteres" 
        });
    }


    if (terminos !== true) {
    return res.status(400).send({
        response: "ERROR",
        message: "Debe aceptar los términos y condiciones"
    });
}

    // Buscar si el usuario ya existe
    const paramsScan = {
        TableName: "cliente",
        FilterExpression: 'contacto = :contacto',
        ExpressionAttributeValues: {':contacto' : contacto}
    };

    docClient.scan(paramsScan, function (err, data) {
        if (err) {
            return res.status(400).send({ 
                response: "ERROR", 
                message: "Error de base de datos" 
            });
        }

        if (data.Items.length > 0) {
            return res.status(400).send({ 
                response: "ERROR", 
                message: "El usuario ya existe" 
            });
        }

        // Crear nuevo cliente
        var hoy = new Date();
        var dd = String(hoy.getDate()).padStart(2, '0');
        var mm = String(hoy.getMonth() + 1).padStart(2, '0');
        var yyyy = hoy.getFullYear();
        hoy = dd + '/' + mm + '/' + yyyy;

        const newCliente = {
            id: crypto.randomUUID(),
            contacto: contacto,
            password: password,
            nombre: nombre,
            activo: true,
            registrado: true,
            fecha_alta: hoy,
            fecha_cambio_password: hoy,
            fecha_ultimo_ingreso: hoy,
        };

        const paramsPut = {
            TableName: "cliente",
            Item: newCliente
        };

        docClient.put(paramsPut, function (putErr, putData) {
            if (putErr) {
                return res.status(400).send({ 
                    response: "ERROR", 
                    message: "Error al crear usuario" 
                });
            }

            console.log("Usuario registrado:", contacto);
            res.status(200).send({ 
                response: "OK",
                message: "Registro exitoso",
                ID: newCliente.id
            });
        });
    });
});
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
/*                                                       API REST ticket                                                             *
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

/*---------
Función para realizar el SCAN de un DB de cliente usando contacto como clave para la búsqueda (no es clave formal del DB)
*/
async function scanDbTicket(clienteID) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const scanKey=clienteID;
    const paramsScan = { // ScanInput
      TableName: "ticket", // required
      Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
      FilterExpression : 'clienteID = :clienteID',
      ExpressionAttributeValues : {':clienteID' : scanKey}
    };      
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
          return data.Items 
    });  
    return objectPromise;
}
/*----------
  listarTicket
  API REST para obtener todos los tickets de un clienteID
*/  
app.post('/api/listarTicket', (req,res) => {

    const {ID}  = req.body;
    console.log("listarTicket: ID("+ID+")");
 
    if (!ID) {
        res.status(400).send({response : "ERROR" , message: "ID cliente  no informada"});
        return;
    }

    scanDbTicket(ID)
    .then(resultDb => {
      if (Object.keys(resultDb).length == 0) {
        res.status(400).send({response : "ERROR" , message : "clienteID no tiene tickets"});
        return;
      } else {
        res.status(200).send(JSON.stringify({response : "OK",  "data": resultDb}));
    }

    });

});

/*---------
  getTicket
  API REST para obtener los detalles de un ticket
*/

/*
app.post('/api/getTicket', (req,res) => {
    const {id}  = req.body;
    console.log("getTicket: id("+id+")");
 
    if (!id) {
        res.status(400).send({response : "ERROR" , message: "ticket id no informada"});
        return;
    }
    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //"clienteID": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
            //"id"       : "e08905a8-4aab-45bf-9948-4ba2b8602ced"
        }
    };
    docClient.get(params, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
        }
        else {
            if (Object.keys(data).length == 0) {
                res.status(400).send({response : "ERROR" , message : "ticket invalido"});
            } else {
                res.status(200).send(JSON.stringify({response : "OK", "data" : data}));    
            }    
        }
    })
});
*/


/*---------
  getTicket
  API REST para consultar un ticket mediante GET o POST
*/

async function getTicket(req, res) {

    // 1. Obtener los parámetros según el método HTTP
    const { ID, PASSWORD, TICKET } =
        req.method === 'GET' ? req.query : req.body;

    // 2. Validar que se hayan informado todos los datos
    if (!ID || !PASSWORD || !TICKET) {
        return res.status(400).json({
            response: "ERROR",
            message: "Debe informar ID, PASSWORD y TICKET"
        });
    }

    try {

        // 3. Buscar primero al cliente en DynamoDB
        const paramsCliente = {
            TableName: "cliente",
            Key: {
                id: ID
            }
        };

        const resultadoCliente =
            await docClient.get(paramsCliente).promise();

        const cliente = resultadoCliente.Item;

        // 4. Verificar si el cliente existe
        // Si no existe, NO se consulta el ticket
        if (!cliente) {
            return res.status(404).json({
                response: "ERROR",
                message: "Cliente no existe"
            });
        }

        // 5. Validar la contraseña del cliente
        if (cliente.password !== PASSWORD) {
            return res.status(401).json({
                response: "ERROR",
                message: "Password incorrecta"
            });
        }

        // 6. Buscar el ticket solicitado
        const paramsTicket = {
            TableName: "ticket",
            Key: {
                id: TICKET
            }
        };

        const resultadoTicket =
            await docClient.get(paramsTicket).promise();

        const ticket = resultadoTicket.Item;

        // 7. Verificar si el ticket existe
        if (!ticket) {
            return res.status(404).json({
                response: "ERROR",
                message: "Ticket no existe"
            });
        }

        // 8. Devolver la información solicitada
        return res.status(200).json({
            response: "OK",
            clienteID: cliente.id,
            correo: cliente.contacto,
            ticket: ticket
        });

    } catch (error) {

        console.error("Error en getTicket:", error);

        return res.status(500).json({
            response: "ERROR",
            message: "Error al consultar la base de datos"
        });
    }
}

// Permitir GET y POST en la ruta solicitada
app.get('/getTicket', getTicket);
app.post('/getTicket', getTicket);

// Mantener compatibilidad con la ruta anterior
app.get('/api/getTicket', getTicket);
app.post('/api/getTicket', getTicket);


/*
 * resumenTickets
 * Obtiene todos los tickets asociados a un cliente.
 * Permite solicitudes GET y POST.
 */
async function resumenTickets(req, res) {

    // 1. Obtener los parámetros según el método HTTP
    const { ID, PASSWORD } =
        req.method === 'GET' ? req.query : req.body;

    // 2. Validar que se hayan informado los datos
    if (!ID || !PASSWORD) {
        return res.status(400).json({
            response: "ERROR",
            message: "Debe informar ID y PASSWORD"
        });
    }

    try {

        // 3. Buscar al cliente en DynamoDB
        const paramsCliente = {
            TableName: "cliente",
            Key: {
                id: ID
            }
        };

        const resultadoCliente =
            await docClient.get(paramsCliente).promise();

        const cliente = resultadoCliente.Item;

        // 4. Verificar si el cliente existe
        if (!cliente) {
            return res.status(404).json({
                response: "ERROR",
                message: "Cliente no existe"
            });
        }

        // 5. Validar la contraseña del cliente
        if (cliente.password !== PASSWORD) {
            return res.status(401).json({
                response: "ERROR",
                message: "Password incorrecta"
            });
        }

        // 6. Preparar la búsqueda de tickets
        const paramsTickets = {
            TableName: "ticket",
            FilterExpression: "clienteID = :clienteID",
            ExpressionAttributeValues: {
                ":clienteID": cliente.id
            }
        };

        // 7. Obtener todos los tickets del cliente
        const tickets = [];
        let resultadoTickets;

        do {
            resultadoTickets =
                await docClient.scan(paramsTickets).promise();

            tickets.push(...(resultadoTickets.Items || []));

            paramsTickets.ExclusiveStartKey =
                resultadoTickets.LastEvaluatedKey;

        } while (resultadoTickets.LastEvaluatedKey);

        // 8. Seleccionar los datos solicitados
        const resumen = tickets.map(ticket => ({
            id: ticket.id,
            fecha_apertura: ticket.fecha_apertura,
            estado_solucion: ticket.estado_solucion
        }));

        // 9. Devolver el resultado en formato JSON
        return res.status(200).json({
            response: "OK",
            cliente: {
                id: cliente.id,
                correo: cliente.contacto,
                cantidad_tickets: resumen.length,
                tickets: resumen
            }
        });

    } catch (error) {

        console.error("Error en resumenTickets:", error);

        return res.status(500).json({
            response: "ERROR",
            message: "Error al consultar la base de datos"
        });
    }
}

// Permitir GET y POST
app.get('/api/resumenTickets', resumenTickets);
app.post('/api/resumenTickets', resumenTickets);



/*-----------------
/api/addTicket
API REST para agregar ticket (genera id)
*/
app.post('/api/addTicket', (req,res) => {

    const {clienteID} = req.body;
    const estado_solucion = 1;
    const {solucion} = req.body;
    const {descripcion} = req.body;

    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const newTicket = {
     id                    : crypto.randomUUID(),
     clienteID             : clienteID,
     estado_solucion       : estado_solucion,
     solucion              : solucion,
     descripcion           : descripcion,
     fecha_apertura        : hoy,
     ultimo_contacto       : hoy
    };

    const paramsPut = {
      TableName: "ticket",
      Item: newTicket,
      ConditionExpression:'attribute_not_exists(id)',
    };

    docClient.put(paramsPut, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB error" + err}));
        } else {
            res.status(200).send(JSON.stringify({response : "OK", "ticket": newTicket}));
        }
    });
}
)

/*--------
/api/updateTicket
Dado un id actualiza el ticket, debe informarse la totalidad del ticket excepto ultimo_contacto
*/
app.post('/api/updateTicket', (req,res) => {

    const {id} = req.body;
    const {clienteID} = req.body;
    const {estado_solucion} = req.body;
    const {solucion} = req.body;
    const {descripcion} = req.body;
    const {fecha_apertura} = req.body;

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!clienteID) {
        res.status(400).send({response : "ERROR" , message: "clienteID no informada"});
        return;
    }

    if (!estado_solucion) {
        res.status(400).send({response : "ERROR" , message: "estado_solucion no informada"});
        return;
    }

    if (!solucion) {
        res.status(400).send({response : "ERROR" , message: "solucion no informado"});
        return;
    }

    if (!fecha_apertura) {
        res.status(400).send({response : "ERROR" , message: "fecha apertura"});
        return;
    }
    
    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const ultimo_contacto = hoy;

    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "ticket no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 

                    ExpressionAttributeNames: { 
                        "#c": "clienteID", 
                        "#e": "estado_solucion",
                        "#s": "solucion",
                        "#a": "fecha_apertura",
                        "#u": "ultimo_contacto",
                        "#d": "descripcion"
                    }, 
                    ExpressionAttributeValues: { 
                        ":c":  clienteID, 
                        ":e":  estado_solucion , 
                        ":s":  solucion , 
                        ":a":  fecha_apertura,
                        ":u":  ultimo_contacto,
                        ":d":  descripcion 
                    }, 
                    Key: { 
                        "id": id 
                    }, 
                    ReturnValues: "ALL_NEW", 
                    TableName: "ticket", 
                    UpdateExpression: "SET #c = :c, #e = :e, #a = :a, #s = :s, #d = :d, #u = :u" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK",  "data": data}));
                    }    
                });    
            }
        }    
    })

});
/*-------------------------------------------------[ Fin del API REST ]-------------------------------------------------------------*/
