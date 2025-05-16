const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

// Configuración (mejor usar variables de entorno)
const TABLE_NAME = process.env.CONFIRMACIONES_TABLE || 'ConfirmacionesEvento';

exports.handler = async (event, context) => {
  console.log('Evento recibido:', JSON.stringify(event, null, 2));
  
  // Validaciones iniciales
  if (!event.body) {
    return response(400, { error: 'Cuerpo de la solicitud faltante' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return response(400, { error: 'JSON inválido en el cuerpo' });
  }

  const { nombre, telefono } = payload;
  
  // Validar campos requeridos
  if (!nombre || !telefono) {
    return response(400, { error: 'Nombre y teléfono son requeridos' });
  }

  // Validar formato de teléfono (ejemplo básico)
  if (!/^[\d\+\-\(\)\s]{10,15}$/.test(telefono)) {
    return response(400, { error: 'Formato de teléfono inválido' });
  }

  // Preparar ítem para DynamoDB
  const now = new Date().toISOString();
  const item = {
    id: uuidv4(),
    nombre: nombre.trim(),
    telefono: telefono.replace(/\D/g, ''), // Solo números
    fecha: now,
    fechaConfirmacion: now,
    status: 'confirmado',
    metadata: {
      userAgent: event.headers?.['User-Agent'] || 'desconocido',
      sourceIP: event.requestContext?.identity?.sourceIp || 'desconocido'
    }
  };

  try {
    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(telefono)' // Evitar duplicados
    }).promise();

    console.log('Confirmación registrada:', item.id);
    return response(200, { 
      message: 'Confirmación exitosa',
      confirmacionId: item.id
    });
  } catch (error) {
    console.error('Error en DynamoDB:', error);
    
    if (error.code === 'ConditionalCheckFailedException') {
      return response(409, { error: 'Este teléfono ya está registrado' });
    }
    
    return response(500, { 
      error: 'Error interno al procesar la confirmación',
      details: process.env.DEBUG_MODE === 'true' ? error.message : undefined
    });
  }
};

// Función helper para respuestas HTTP
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
}