const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

// Configura el SDK para usar la región correcta
AWS.config.update({ region: 'us-east-1' }); // Cambia según tu región

exports.handler = async (event) => {
  // Validar método HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    // Parsear y validar datos de entrada
    const { nombre, telefono } = JSON.parse(event.body);
    
    if (!nombre || !telefono) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nombre y teléfono son requeridos' })
      };
    }

    // Validar formato de teléfono (ejemplo básico)
    const telefonoRegex = /^[0-9]{10,15}$/;
    if (!telefonoRegex.test(telefono)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Formato de teléfono inválido' })
      };
    }

    // Parámetros para DynamoDB
    const params = {
      TableName: 'ConfirmacionesEvento',
      Item: {
        id: uuidv4(), // Mejor que Date.now() para evitar colisiones
        nombre,
        telefono,
        fecha: new Date().toISOString(),
        status: 'confirmado' // Puedes añadir más campos
      },
      // Condición para evitar duplicados si lo necesitas
      ConditionExpression: 'attribute_not_exists(telefono)'
    };

    await dynamoDB.put(params).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Para CORS
      },
      body: JSON.stringify({ 
        message: 'Confirmación exitosa',
        confirmacionId: params.Item.id
      })
    };
  } catch (error) {
    console.error('Error:', error);
    
    // Manejar errores específicos de DynamoDB
    if (error.code === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Este teléfono ya está registrado' })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error al procesar la confirmación',
        details: error.message 
      })
    };
  }
};

async function getConfirmaciones() {
  const params = {
    TableName: 'ConfirmacionesEvento',
    IndexName: 'FechaIndex',
    KeyConditionExpression: 'fecha = :fecha',
    ExpressionAttributeValues: {
      ':fecha': new Date().toISOString().split('T')[0] // Busca por día
    },
    ScanIndexForward: false // Orden descendente
  };

  try {
    const data = await dynamoDB.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al obtener confirmaciones' })
    };
  }
}